import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, FAB, ActivityIndicator, Button, Chip, Menu, Divider } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../../utils/formatters';
import api from '../../services/api';
import { exportService } from '../../services/exportService';

const ReporteGananciasScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [gananciasData, setGananciasData] = useState(null);
  const [selectedPeriodo, setSelectedPeriodo] = useState('este_mes');
  const [menuVisible, setMenuVisible] = useState(false);
  const [viewMode, setViewMode] = useState('resumen'); // 'resumen' o 'productos'

  const periodos = [
    { label: 'Hoy', value: 'hoy' },
    { label: 'Esta semana', value: 'esta_semana' },
    { label: 'Este mes', value: 'este_mes' },
    { label: 'Último trimestre', value: 'ultimo_trimestre' },
    { label: 'Este año', value: 'este_año' }
  ];

  useEffect(() => {
    cargarDatosGanancias();
  }, [selectedPeriodo]);

  const cargarDatosGanancias = async () => {
    try {
      setLoading(true);
      console.log('Cargando datos de ganancias para período:', selectedPeriodo);

      const response = await api.get(`/reportes/ganancias?periodo=${selectedPeriodo}`);
      console.log('Datos de ganancias recibidos:', response);
      console.log('Tipo de response:', typeof response);

      // api.get() devuelve los datos directamente, no envueltos en .data
      if (response && typeof response === 'object') {
        console.log('Configurando datos de ganancias:', response);
        console.log('Detalles por producto en respuesta:', response.detalles_por_producto);
        setGananciasData(response);
      } else {
        // Datos por defecto en caso de respuesta vacía
        setGananciasData({
          resumen: {
            ingresos_totales: 0,
            costos_totales: 0,
            ganancia_total: 0,
            total_ventas: 0,
            productos_vendidos: 0,
            margen_promedio: 0
          },
          detalles_por_producto: []
        });
      }
    } catch (error) {
      console.error('Error al cargar datos de ganancias:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos de ganancias');

      // Datos por defecto en caso de error
      setGananciasData({
        resumen: {
          ingresos_totales: 0,
          costos_totales: 0,
          ganancia_total: 0,
          total_ventas: 0,
          productos_vendidos: 0,
          margen_promedio: 0
        },
        detalles_por_producto: []
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarDatosGanancias();
  };

  const exportarGanancias = async (formato) => {
    try {
      setMenuVisible(false); // Close menu immediately to prevent multiple calls
      console.log('Exportando ganancias - datos disponibles:', gananciasData);
      console.log('Detalles por producto:', gananciasData?.detalles_por_producto);

      if (!gananciasData || !gananciasData.detalles_por_producto || gananciasData.detalles_por_producto.length === 0) {
        Alert.alert('Error', 'No hay datos para exportar. Asegúrate de que el reporte tenga información.');
        console.log('No hay datos para exportar:', {
          gananciasData: !!gananciasData,
          detalles_por_producto: gananciasData?.detalles_por_producto,
          length: gananciasData?.detalles_por_producto?.length
        });
        return;
      }

      const dataToExport = gananciasData.detalles_por_producto.map(producto => ({
        'Producto': producto.producto_nombre || 'N/A',
        'Código': producto.producto_codigo || 'N/A',
        'Categoría': producto.categoria_nombre || 'Sin categoría',
        'Cantidad Vendida': producto.total_cantidad_vendida || 0,
        'Ingresos Totales': formatCurrency(producto.total_ingresos || 0),
        'Costos Totales': formatCurrency(producto.total_costos || 0),
        'Ganancia Bruta': formatCurrency(producto.ganancia_bruta || 0),
        'Margen %': `${producto.margen_ganancia_porcentaje || 0}%`,
        'Número de Ventas': producto.numero_ventas || 0
      }));

      const headers = [
        'Producto', 'Código', 'Categoría', 'Cantidad Vendida',
        'Ingresos Totales', 'Costos Totales', 'Ganancia Bruta',
        'Margen %', 'Número de Ventas'
      ];

      const periodoLabel = periodos.find(p => p.value === selectedPeriodo)?.label || selectedPeriodo;
      const title = `Reporte de Ganancias - ${periodoLabel}`;
      const filename = `ganancias_${selectedPeriodo}`;

      await exportService.exportData(formato, dataToExport, filename, headers, title);
    } catch (error) {
      console.error('Error al exportar ganancias:', error);
      Alert.alert('Error', 'No se pudo exportar el reporte');
    }
  };

  const renderResumenCard = () => {
    if (!gananciasData?.resumen) return null;

    const resumen = gananciasData.resumen;
    const margenColor = resumen.margen_promedio >= 20 ? '#4CAF50' :
                      resumen.margen_promedio >= 10 ? '#FF9800' : '#F44336';

    return (
      <Card style={styles.resumenCard}>
        <Card.Title
          title="Resumen de Ganancias"
          subtitle={periodos.find(p => p.value === selectedPeriodo)?.label}
          left={(props) => <Ionicons name="trending-up" size={24} color="#4CAF50" />}
        />
        <Card.Content>
          <View style={styles.resumenGrid}>
            <View style={styles.resumenItem}>
              <Text style={styles.resumenValue}>{formatCurrency(resumen.ingresos_totales || 0)}</Text>
              <Text style={styles.resumenLabel}>Ingresos Totales</Text>
            </View>

            <View style={styles.resumenItem}>
              <Text style={styles.resumenValue}>{formatCurrency(resumen.costos_totales || 0)}</Text>
              <Text style={styles.resumenLabel}>Costos Totales</Text>
            </View>

            <View style={styles.resumenItem}>
              <Text style={[styles.resumenValue, { color: '#4CAF50' }]}>
                {formatCurrency(resumen.ganancia_total || 0)}
              </Text>
              <Text style={styles.resumenLabel}>Ganancia Total</Text>
            </View>

            <View style={styles.resumenItem}>
              <Text style={[styles.resumenValue, { color: margenColor }]}>
                {resumen.margen_promedio || 0}%
              </Text>
              <Text style={styles.resumenLabel}>Margen Promedio</Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.estadisticasRow}>
            <View style={styles.estadisticaItem}>
              <Text style={styles.estadisticaValue}>{resumen.total_ventas || 0}</Text>
              <Text style={styles.estadisticaLabel}>Total Ventas</Text>
            </View>
            <View style={styles.estadisticaItem}>
              <Text style={styles.estadisticaValue}>{resumen.productos_vendidos || 0}</Text>
              <Text style={styles.estadisticaLabel}>Productos Vendidos</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderProductoCard = (producto, index) => {
    const margenColor = producto.margen_ganancia_porcentaje >= 20 ? '#4CAF50' :
                       producto.margen_ganancia_porcentaje >= 10 ? '#FF9800' : '#F44336';

    return (
      <Card key={index} style={styles.productoCard}>
        <Card.Content>
          <View style={styles.productoHeader}>
            <View style={styles.productoInfo}>
              <Text style={styles.productoNombre}>{producto.producto_nombre || 'Producto sin nombre'}</Text>
              <Text style={styles.productoCodigo}>Código: {producto.producto_codigo || 'N/A'}</Text>
              <Text style={styles.productoCategoria}>{producto.categoria_nombre || 'Sin categoría'}</Text>
            </View>
            <View style={styles.gananciaBadge}>
              <Text style={[styles.margenPorcentaje, { color: margenColor }]}>
                {producto.margen_ganancia_porcentaje || 0}%
              </Text>
              <Text style={styles.margenLabel}>Margen</Text>
            </View>
          </View>

          <View style={styles.productoMetricas}>
            <View style={styles.metricaItem}>
              <Text style={styles.metricaValue}>{producto.total_cantidad_vendida || 0}</Text>
              <Text style={styles.metricaLabel}>Cantidad</Text>
            </View>
            <View style={styles.metricaItem}>
              <Text style={styles.metricaValue}>{formatCurrency(producto.total_ingresos || 0)}</Text>
              <Text style={styles.metricaLabel}>Ingresos</Text>
            </View>
            <View style={styles.metricaItem}>
              <Text style={styles.metricaValue}>{formatCurrency(producto.total_costos || 0)}</Text>
              <Text style={styles.metricaLabel}>Costos</Text>
            </View>
            <View style={styles.metricaItem}>
              <Text style={[styles.metricaValue, { color: '#4CAF50' }]}>
                {formatCurrency(producto.ganancia_bruta || 0)}
              </Text>
              <Text style={styles.metricaLabel}>Ganancia</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Cargando reporte de ganancias...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>Reporte de Ganancias</Text>

        {/* Controles de filtro */}
        <View style={styles.controlsContainer}>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setMenuVisible(true)}
                icon="calendar"
                style={styles.periodoButton}
              >
                {periodos.find(p => p.value === selectedPeriodo)?.label}
              </Button>
            }
          >
            {periodos.map(periodo => (
              <Menu.Item
                key={periodo.value}
                title={periodo.label}
                onPress={() => {
                  setSelectedPeriodo(periodo.value);
                  setMenuVisible(false);
                }}
              />
            ))}
          </Menu>

          <View style={styles.viewToggle}>
            <Chip
              selected={viewMode === 'resumen'}
              onPress={() => setViewMode('resumen')}
              style={styles.chip}
            >
              Resumen
            </Chip>
            <Chip
              selected={viewMode === 'productos'}
              onPress={() => setViewMode('productos')}
              style={styles.chip}
            >
              Por Producto
            </Chip>
          </View>
        </View>

        {/* Resumen siempre visible */}
        {renderResumenCard()}

        {/* Vista de productos */}
        {viewMode === 'productos' && (
          <View style={styles.productosContainer}>
            <Text style={styles.sectionTitle}>Ganancias por Producto</Text>
            {gananciasData?.detalles_por_producto && gananciasData.detalles_por_producto.length > 0 ? (
              gananciasData.detalles_por_producto.map((producto, index) =>
                renderProductoCard(producto, index)
              )
            ) : (
              <Card style={styles.emptyCard}>
                <Card.Content>
                  <Text style={styles.emptyText}>No hay datos de productos para el período seleccionado</Text>
                </Card.Content>
              </Card>
            )}
          </View>
        )}

        {/* Botones de exportación */}
        <Card style={styles.exportCard}>
          <Card.Title title="Exportar Reporte" />
          <Card.Content>
            <View style={styles.exportButtons}>
              <Button
                mode="outlined"
                icon="file-excel"
                style={styles.exportButton}
                onPress={() => exportarGanancias('excel')}
              >
                Excel
              </Button>
              <Button
                mode="outlined"
                icon="file-pdf-box"
                style={styles.exportButton}
                onPress={() => exportarGanancias('pdf')}
              >
                PDF
              </Button>
              <Button
                mode="outlined"
                icon="file-delimited"
                style={styles.exportButton}
                onPress={() => exportarGanancias('csv')}
              >
                CSV
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="refresh"
        label="Actualizar"
        onPress={onRefresh}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4CAF50',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  periodoButton: {
    minWidth: 120,
  },
  viewToggle: {
    flexDirection: 'row',
  },
  chip: {
    marginLeft: 8,
  },
  resumenCard: {
    marginBottom: 20,
    elevation: 2,
  },
  resumenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  resumenItem: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  resumenValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 4,
  },
  resumenLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  divider: {
    marginVertical: 15,
  },
  estadisticasRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  estadisticaItem: {
    alignItems: 'center',
  },
  estadisticaValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  estadisticaLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  productosContainer: {
    marginBottom: 20,
  },
  productoCard: {
    marginBottom: 12,
    elevation: 1,
  },
  productoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  productoInfo: {
    flex: 1,
  },
  productoNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productoCodigo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  productoCategoria: {
    fontSize: 12,
    color: '#999',
  },
  gananciaBadge: {
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 8,
  },
  margenPorcentaje: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  margenLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  productoMetricas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricaItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricaValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  metricaLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  emptyCard: {
    marginVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
  exportCard: {
    marginTop: 20,
    marginBottom: 80,
  },
  exportButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  exportButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
  },
});

export default ReporteGananciasScreen;