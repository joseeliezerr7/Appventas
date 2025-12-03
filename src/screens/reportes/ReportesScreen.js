import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Button, Divider, ActivityIndicator, Menu } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../../utils/formatters';
import api from '../../services/api';
import { exportService } from '../../services/exportService';
import { useAuth } from '../../contexts/AuthContext';

const ReportesScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingResumen, setLoadingResumen] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedPeriodo, setSelectedPeriodo] = useState('Este mes');

  // Verificar permisos de acceso
  const canAccessReports = user && (user.rol === 'admin' || user.rol === 'supervisor' || user.rol === 'gerente');

  // Si el usuario no tiene permisos, mostrar mensaje de acceso denegado
  if (!canAccessReports) {
    return (
      <View style={styles.accessDeniedContainer}>
        <Ionicons name="lock-closed-outline" size={80} color="#999" />
        <Text style={styles.accessDeniedTitle}>Acceso Restringido</Text>
        <Text style={styles.accessDeniedText}>
          No tienes permisos para acceder a los reportes.
        </Text>
        <Text style={styles.accessDeniedText}>
          Contacta al administrador si necesitas acceso.
        </Text>
      </View>
    );
  }

  const periodos = ['Hoy', 'Esta semana', 'Este mes', 'Último trimestre', 'Este año'];

  useEffect(() => {
    cargarResumenDashboard();
  }, [selectedPeriodo]);

  const cargarResumenDashboard = async () => {
    try {
      setLoadingResumen(true);
      const periodo = selectedPeriodo.toLowerCase().replace(' ', '_');
      console.log('Cargando resumen para período:', periodo);
      
      const response = await api.get(`/reportes/resumen-dashboard?periodo=${periodo}`);
      console.log('Respuesta del servidor:', response);
      console.log('Tipo de response:', typeof response);

      // api.get() devuelve los datos directamente, no envueltos en .data
      if (response && typeof response === 'object') {
        console.log('Datos del resumen:', response);
        setResumenVentas(response);
      } else {
        console.warn('Respuesta vacía o sin datos');
        // Usar datos por defecto si no hay respuesta
        setResumenVentas({
          totalVentas: 0,
          totalProductos: 0,
          clientesAtendidos: 0,
          ticketPromedio: 0,
          comparacionAnterior: 0
        });
      }
    } catch (error) {
      console.error('Error al cargar resumen:', error);
      console.error('Detalles del error:', error.message);
      
      // Usar datos por defecto en caso de error
      setResumenVentas({
        totalVentas: 0,
        totalProductos: 0,
        clientesAtendidos: 0,
        ticketPromedio: 0,
        comparacionAnterior: 0
      });
      
      // Solo mostrar alerta si no es un error de endpoint no encontrado
      if (!error.message.includes('404')) {
        Alert.alert('Error', 'No se pudo cargar el resumen del dashboard');
      }
    } finally {
      setLoadingResumen(false);
    }
  };

  const reportesDisponibles = [
    {
      id: 1,
      titulo: 'Ganancias y Utilidades',
      descripcion: 'Análisis de rentabilidad y márgenes de ganancia',
      icono: 'trending-up-outline',
      color: '#4CAF50',
      ruta: 'ReporteGanancias'
    },
    {
      id: 2,
      titulo: 'Ventas por Producto',
      descripcion: 'Análisis detallado de ventas por cada producto',
      icono: 'cube-outline',
      color: '#2196F3',
      ruta: 'ReporteVentasProducto'
    },
    {
      id: 3,
      titulo: 'Ventas por Cliente',
      descripcion: 'Análisis de ventas agrupadas por cliente',
      icono: 'people-outline',
      color: '#9C27B0',
      ruta: 'ReporteVentasCliente'
    },
    {
      id: 4,
      titulo: 'Ventas por Vendedor',
      descripcion: 'Desempeño de ventas por cada vendedor',
      icono: 'person-outline',
      color: '#FF5722',
      ruta: 'ReporteVentasVendedor'
    },
    {
      id: 5,
      titulo: 'Inventario',
      descripcion: 'Estado actual del inventario y rotación',
      icono: 'file-tray-stacked-outline',
      color: '#FF9800',
      ruta: 'ReporteInventario'
    },
    {
      id: 6,
      titulo: 'Devoluciones',
      descripcion: 'Análisis de devoluciones y motivos',
      icono: 'return-down-back-outline',
      color: '#F44336',
      ruta: 'Devoluciones'
    },
    {
      id: 7,
      titulo: 'Cuentas por Cobrar',
      descripcion: 'Estado de cuentas pendientes por cobrar',
      icono: 'cash-outline',
      color: '#795548',
      ruta: 'ReporteCuentasCobrar'
    }
  ];

  const [resumenVentas, setResumenVentas] = useState({
    totalVentas: 0,
    totalProductos: 0,
    clientesAtendidos: 0,
    ticketPromedio: 0,
    comparacionAnterior: 0
  });

  const handleGenerarReporte = (ruta) => {
    setLoading(true);
    
    // Simular carga de reporte
    setTimeout(() => {
      setLoading(false);
      navigation.navigate(ruta, { periodo: selectedPeriodo });
    }, 500);
  };

  const exportarResumen = async (formato) => {
    try {
      if (loadingResumen) {
        Alert.alert('Error', 'Espera a que se cargue el resumen');
        return;
      }

      const resumenData = [
        {
          metrica: 'Total Ventas',
          valor: resumenVentas?.totalVentas || 0,
          periodo: selectedPeriodo
        },
        {
          metrica: 'Productos Vendidos',
          valor: resumenVentas?.totalProductos || 0,
          periodo: selectedPeriodo
        },
        {
          metrica: 'Clientes Atendidos',
          valor: resumenVentas?.clientesAtendidos || 0,
          periodo: selectedPeriodo
        },
        {
          metrica: 'Ticket Promedio',
          valor: resumenVentas?.ticketPromedio || 0,
          periodo: selectedPeriodo
        },
        {
          metrica: 'Comparación Anterior',
          valor: `${resumenVentas?.comparacionAnterior || 0}%`,
          periodo: selectedPeriodo
        }
      ];

      const headers = ['Métrica', 'Valor', 'Período'];
      const title = `Resumen de Ventas - ${selectedPeriodo}`;
      const filename = 'resumen_ventas';

      await exportService.exportData(formato, resumenData, filename, headers, title);
    } catch (error) {
      console.error('Error al exportar resumen:', error);
      Alert.alert('Error', 'No se pudo exportar el resumen');
    }
  };

  const renderResumenCard = () => (
    <Card style={styles.resumenCard}>
      <Card.Title 
        title="Resumen de Ventas" 
        subtitle={selectedPeriodo}
        right={() => (
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button 
                onPress={() => setMenuVisible(true)}
                icon="calendar"
              >
                Periodo
              </Button>
            }
          >
            {periodos.map(periodo => (
              <Menu.Item
                key={periodo}
                title={periodo}
                onPress={() => {
                  setSelectedPeriodo(periodo);
                  setMenuVisible(false);
                }}
              />
            ))}
          </Menu>
        )}
      />
      <Card.Content>
        {loadingResumen ? (
          <View style={styles.resumenLoading}>
            <ActivityIndicator size="small" color="#0066cc" />
            <Text style={styles.resumenLoadingText}>Cargando resumen...</Text>
          </View>
        ) : (
          <View style={styles.resumenGrid}>
            <View style={styles.resumenItem}>
              <Text style={styles.resumenValue}>{formatCurrency(resumenVentas?.totalVentas || 0)}</Text>
              <Text style={styles.resumenLabel}>Total Ventas</Text>
            </View>
            
            <View style={styles.resumenItem}>
              <Text style={styles.resumenValue}>{resumenVentas?.totalProductos || 0}</Text>
              <Text style={styles.resumenLabel}>Productos Vendidos</Text>
            </View>
            
            <View style={styles.resumenItem}>
              <Text style={styles.resumenValue}>{resumenVentas?.clientesAtendidos || 0}</Text>
              <Text style={styles.resumenLabel}>Clientes Atendidos</Text>
            </View>
            
            <View style={styles.resumenItem}>
              <Text style={styles.resumenValue}>{formatCurrency(resumenVentas?.ticketPromedio || 0)}</Text>
              <Text style={styles.resumenLabel}>Ticket Promedio</Text>
            </View>
          </View>
        )}
        
        <View style={styles.comparacionContainer}>
          <Text style={styles.comparacionLabel}>
            Comparado con periodo anterior:
          </Text>
          <View style={styles.comparacionValor}>
            <Ionicons 
              name={(resumenVentas?.comparacionAnterior || 0) >= 0 ? "arrow-up" : "arrow-down"} 
              size={16} 
              color={(resumenVentas?.comparacionAnterior || 0) >= 0 ? "#4CAF50" : "#F44336"} 
            />
            <Text style={[
              styles.comparacionPorcentaje,
              {color: (resumenVentas?.comparacionAnterior || 0) >= 0 ? "#4CAF50" : "#F44336"}
            ]}>
              {Math.abs(resumenVentas?.comparacionAnterior || 0)}%
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderReporteCard = (reporte) => (
    <Card 
      key={reporte.id} 
      style={[styles.reporteCard, { borderLeftColor: reporte.color, borderLeftWidth: 4 }]}
    >
      <Card.Content style={styles.reporteContent}>
        <View style={[styles.iconContainer, { backgroundColor: `${reporte.color}20` }]}>
          <Ionicons name={reporte.icono} size={24} color={reporte.color} />
        </View>
        <View style={styles.reporteInfo}>
          <Text style={styles.reporteTitulo}>{reporte.titulo}</Text>
          <Text style={styles.reporteDescripcion}>{reporte.descripcion}</Text>
        </View>
      </Card.Content>
      <Card.Actions>
        <Button 
          mode="contained" 
          onPress={() => handleGenerarReporte(reporte.ruta)}
          style={[styles.reporteButton, { backgroundColor: reporte.color }]}
        >
          Ver Reporte
        </Button>
      </Card.Actions>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loaderText}>Generando reporte...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Reportes</Text>
      
      {renderResumenCard()}
      
      <Text style={styles.sectionTitle}>Reportes Disponibles</Text>
      
      <View style={styles.reportesContainer}>
        {reportesDisponibles.map(reporte => renderReporteCard(reporte))}
      </View>
      
      <View style={styles.exportContainer}>
        <Text style={styles.exportTitle}>Exportar Datos</Text>
        <Text style={styles.exportDescription}>
          Exporta los datos de ventas, inventario y clientes en diferentes formatos.
        </Text>
        <View style={styles.exportButtons}>
          <Button 
            mode="outlined" 
            icon="file-excel" 
            style={styles.exportButton}
            onPress={() => exportarResumen('excel')}
          >
            Excel
          </Button>
          <Button 
            mode="outlined" 
            icon="file-pdf-box" 
            style={styles.exportButton}
            onPress={() => exportarResumen('pdf')}
          >
            PDF
          </Button>
          <Button 
            mode="outlined" 
            icon="file-delimited" 
            style={styles.exportButton}
            onPress={() => exportarResumen('csv')}
          >
            CSV
          </Button>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 40,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  resumenCard: {
    marginBottom: 20,
    elevation: 2,
  },
  resumenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  resumenItem: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  resumenValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 5,
  },
  resumenLabel: {
    fontSize: 12,
    color: '#666',
  },
  comparacionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
  },
  comparacionLabel: {
    fontSize: 14,
    color: '#555',
  },
  comparacionValor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comparacionPorcentaje: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  resumenLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  resumenLoadingText: {
    marginLeft: 10,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 15,
    color: '#333',
  },
  reportesContainer: {
    marginBottom: 20,
  },
  reporteCard: {
    marginBottom: 12,
    elevation: 1,
  },
  reporteContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  reporteInfo: {
    flex: 1,
  },
  reporteTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  reporteDescripcion: {
    fontSize: 12,
    color: '#666',
  },
  reporteButton: {
    marginLeft: 'auto',
  },
  exportContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  exportDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  exportButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  exportButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loaderText: {
    marginTop: 10,
  },
});

export default ReportesScreen;
