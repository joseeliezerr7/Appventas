import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, ActivityIndicator, DataTable, Searchbar, Menu, FAB, Chip } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency, formatInventoryStatus } from '../../utils/formatters';
import api from '../../services/api';
import FiltrosAvanzados from '../../components/FiltrosAvanzados';
import { exportService } from '../../services/exportService';

const ReporteInventarioScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { periodo } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('stock_total');
  const [sortDirection, setSortDirection] = useState('asc');
  const [menuVisible, setMenuVisible] = useState(false);
  const [filtrosVisible, setFiltrosVisible] = useState(false);
  const [filters, setFilters] = useState({
    categoria_id: null,
    stock_minimo: null
  });

  useEffect(() => {
    cargarReporte();
  }, []);

  useEffect(() => {
    filtrarDatos();
  }, [searchQuery, data]);

  const cargarReporte = async (filtrosCustom = null) => {
    try {
      setLoading(true);
      
      const filtrosFinales = filtrosCustom || filters;
      setFilters(filtrosFinales);
      
      const params = new URLSearchParams();
      Object.entries(filtrosFinales).forEach(([key, value]) => {
        if (value !== null && value !== '' && value !== undefined) {
          params.append(key, value);
        }
      });

      const response = await api.get(`/reportes/inventario?${params.toString()}`);

      // El backend devuelve directamente el array, no un objeto con propiedad data
      const inventarioData = Array.isArray(response) ? response : (response.data || []);

      setData(inventarioData);
      setFilteredData(inventarioData);
    } catch (error) {
      console.error('Error al cargar reporte:', error);
      Alert.alert('Error', 'No se pudo cargar el reporte de inventario');
      setData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  const filtrarDatos = () => {
    if (!data || !Array.isArray(data)) {
      setFilteredData([]);
      return;
    }

    if (!searchQuery.trim()) {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter(item =>
      (item?.producto_nombre || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item?.producto_codigo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item?.categoria_nombre || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredData(filtered);
  };

  const ordenarDatos = (field) => {
    if (!filteredData || !Array.isArray(filteredData)) {
      return;
    }

    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);

    const sorted = [...filteredData].sort((a, b) => {
      let aVal = a?.[field] || 0;
      let bVal = b?.[field] || 0;

      // Para números, convertir a entero/float
      if (field === 'stock_total' || field === 'precio' || field === 'vendido_mes_actual') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredData(sorted);
  };

  const exportarDatos = async (formato) => {
    try {
      setMenuVisible(false);

      if (!filteredData || !Array.isArray(filteredData) || filteredData.length === 0) {
        Alert.alert('Error', 'No hay datos para exportar');
        return;
      }

      // Preparar datos con el campo estado agregado
      const dataWithStatus = filteredData.map(item => ({
        ...item,
        estado: formatInventoryStatus(item.stock_total || 0).text
      }));

      const headers = ['Código', 'Producto', 'Categoría', 'Stock', 'Precio', 'Vendido Este Mes', 'Estado'];
      const title = `Reporte de Inventario - ${new Date().toLocaleDateString('es-MX')}`;
      const filename = 'reporte_inventario';

      await exportService.exportData(formato, dataWithStatus, filename, headers, title);
    } catch (error) {
      console.error('Error al exportar:', error);
      Alert.alert('Error', 'No se pudo exportar el reporte');
    }
  };

  const aplicarFiltros = (nuevosFiltros) => {
    cargarReporte(nuevosFiltros);
  };

  const calcularTotales = () => {
    if (!filteredData || !Array.isArray(filteredData) || filteredData.length === 0) {
      return { 
        valorTotalInventario: 0, 
        stockBajo: 0, 
        sinStock: 0,
        totalVendidoMes: 0
      };
    }
    
    return filteredData.reduce((acc, item) => {
      const stock = parseFloat(item?.stock_total || 0);
      const precio = parseFloat(item?.precio || 0);
      const vendido = parseInt(item?.vendido_mes_actual || 0);
      
      return {
        valorTotalInventario: acc.valorTotalInventario + (stock * precio),
        stockBajo: acc.stockBajo + (stock > 0 && stock <= 10 ? 1 : 0),
        sinStock: acc.sinStock + (stock === 0 ? 1 : 0),
        totalVendidoMes: acc.totalVendidoMes + vendido
      };
    }, { 
      valorTotalInventario: 0, 
      stockBajo: 0, 
      sinStock: 0,
      totalVendidoMes: 0
    });
  };

  const getStatusChip = (stock) => {
    const status = formatInventoryStatus(stock);
    return (
      <Chip 
        icon={status.icon}
        style={{ backgroundColor: `${status.color}20` }}
        textStyle={{ color: status.color, fontSize: 11 }}
        compact
      >
        {status.text}
      </Chip>
    );
  };

  const totales = calcularTotales();

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loaderText}>Generando reporte...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Reporte de Inventario</Text>
          <Text style={styles.subtitle}>
            Actualizado: {new Date().toLocaleDateString('es-MX')}
          </Text>
        </View>
        
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button 
              icon="download"
              mode="outlined"
              onPress={() => setMenuVisible(true)}
            >
              Exportar
            </Button>
          }
        >
          <Menu.Item title="Excel" onPress={() => exportarDatos('excel')} />
          <Menu.Item title="PDF" onPress={() => exportarDatos('pdf')} />
          <Menu.Item title="CSV" onPress={() => exportarDatos('csv')} />
        </Menu>
      </View>

      <Card style={styles.resumenCard}>
        <Card.Content>
          <Text style={styles.resumenTitle}>Resumen del Inventario</Text>
          <View style={styles.resumenGrid}>
            <View style={styles.resumenItem}>
              <Text style={styles.resumenValue}>{formatCurrency(totales.valorTotalInventario)}</Text>
              <Text style={styles.resumenLabel}>Valor Total</Text>
            </View>
            <View style={styles.resumenItem}>
              <Text style={styles.resumenValue}>{(filteredData || []).length}</Text>
              <Text style={styles.resumenLabel}>Productos</Text>
            </View>
            <View style={styles.resumenItem}>
              <Text style={[styles.resumenValue, { color: '#FF9800' }]}>{totales.stockBajo}</Text>
              <Text style={styles.resumenLabel}>Stock Bajo</Text>
            </View>
            <View style={styles.resumenItem}>
              <Text style={[styles.resumenValue, { color: '#F44336' }]}>{totales.sinStock}</Text>
              <Text style={styles.resumenLabel}>Sin Stock</Text>
            </View>
          </View>
          
          <View style={styles.ventasInfo}>
            <Text style={styles.ventasLabel}>Vendido este mes:</Text>
            <Text style={styles.ventasValue}>{totales.totalVendidoMes} unidades</Text>
          </View>
        </Card.Content>
      </Card>

      <Searchbar
        placeholder="Buscar productos..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <ScrollView horizontal style={styles.tableContainer}>
        <DataTable style={styles.dataTable}>
          <DataTable.Header>
            <DataTable.Title
              style={styles.codeColumn}
              sortDirection={sortField === 'producto_codigo' ? sortDirection : undefined}
              onPress={() => ordenarDatos('producto_codigo')}
            >
              Código
            </DataTable.Title>
            <DataTable.Title
              style={styles.nameColumn}
              sortDirection={sortField === 'producto_nombre' ? sortDirection : undefined}
              onPress={() => ordenarDatos('producto_nombre')}
            >
              Producto
            </DataTable.Title>
            <DataTable.Title
              style={styles.categoryColumn}
              sortDirection={sortField === 'categoria_nombre' ? sortDirection : undefined}
              onPress={() => ordenarDatos('categoria_nombre')}
            >
              Categoría
            </DataTable.Title>
            <DataTable.Title
              numeric
              sortDirection={sortField === 'stock_total' ? sortDirection : undefined}
              onPress={() => ordenarDatos('stock_total')}
            >
              Stock
            </DataTable.Title>
            <DataTable.Title
              numeric
              sortDirection={sortField === 'precio' ? sortDirection : undefined}
              onPress={() => ordenarDatos('precio')}
            >
              Precio
            </DataTable.Title>
            <DataTable.Title
              numeric
              sortDirection={sortField === 'vendido_mes_actual' ? sortDirection : undefined}
              onPress={() => ordenarDatos('vendido_mes_actual')}
            >
              Vendido
            </DataTable.Title>
            <DataTable.Title
              style={styles.statusColumn}
            >
              Estado
            </DataTable.Title>
          </DataTable.Header>

          {(filteredData || []).map((item, index) => (
            <DataTable.Row key={item?.id || index}>
              <DataTable.Cell style={styles.codeColumn}>
                {item?.producto_codigo || '-'}
              </DataTable.Cell>
              <DataTable.Cell style={styles.nameColumn}>
                {item?.producto_nombre || '-'}
              </DataTable.Cell>
              <DataTable.Cell style={styles.categoryColumn}>
                {item?.categoria_nombre || '-'}
              </DataTable.Cell>
              <DataTable.Cell numeric>
                {item?.stock_total || 0}
              </DataTable.Cell>
              <DataTable.Cell numeric>
                {formatCurrency(item?.precio || 0)}
              </DataTable.Cell>
              <DataTable.Cell numeric>
                {item?.vendido_mes_actual || 0}
              </DataTable.Cell>
              <DataTable.Cell style={styles.statusColumn}>
                {getStatusChip(item?.stock_total || 0)}
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </ScrollView>

      {(!filteredData || filteredData.length === 0) && !loading && (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No hay productos para mostrar</Text>
          <Text style={styles.emptySubtext}>
            Verifica los filtros o agrega productos al inventario
          </Text>
        </View>
      )}

      <FAB
        style={styles.fab}
        icon="filter"
        onPress={() => setFiltrosVisible(true)}
        label="Filtros"
      />

      <FiltrosAvanzados
        visible={filtrosVisible}
        onDismiss={() => setFiltrosVisible(false)}
        onApplyFilters={aplicarFiltros}
        tipoReporte="inventario"
        filtrosIniciales={filters}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  resumenCard: {
    margin: 16,
    elevation: 2,
  },
  resumenTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resumenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  resumenItem: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 5,
    marginBottom: 8,
    alignItems: 'center',
  },
  resumenValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  resumenLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  ventasInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  ventasLabel: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
  },
  ventasValue: {
    fontSize: 16,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  searchbar: {
    margin: 16,
    marginTop: 0,
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  dataTable: {
    backgroundColor: 'white',
    minWidth: 800,
  },
  codeColumn: {
    flex: 1,
    minWidth: 80,
  },
  nameColumn: {
    flex: 2,
    minWidth: 150,
  },
  categoryColumn: {
    flex: 1,
    minWidth: 100,
  },
  statusColumn: {
    flex: 1,
    minWidth: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#0066cc',
  },
});

export default ReporteInventarioScreen;