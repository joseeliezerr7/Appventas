import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Divider, ActivityIndicator, Menu } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const ReportesScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedPeriodo, setSelectedPeriodo] = useState('Este mes');

  const periodos = ['Hoy', 'Esta semana', 'Este mes', 'Último trimestre', 'Este año'];

  const reportesDisponibles = [
    {
      id: 1,
      titulo: 'Ventas por Producto',
      descripcion: 'Análisis detallado de ventas por cada producto',
      icono: 'cube-outline',
      color: '#4CAF50',
      ruta: 'ReporteVentasProducto'
    },
    {
      id: 2,
      titulo: 'Ventas por Cliente',
      descripcion: 'Análisis de ventas agrupadas por cliente',
      icono: 'people-outline',
      color: '#2196F3',
      ruta: 'ReporteVentasCliente'
    },
    {
      id: 3,
      titulo: 'Ventas por Vendedor',
      descripcion: 'Desempeño de ventas por cada vendedor',
      icono: 'person-outline',
      color: '#9C27B0',
      ruta: 'ReporteVentasVendedor'
    },
    {
      id: 4,
      titulo: 'Devoluciones',
      descripcion: 'Análisis de devoluciones y motivos',
      icono: 'return-down-back-outline',
      color: '#F44336',
      ruta: 'Devoluciones'
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
      titulo: 'Cuentas por Cobrar',
      descripcion: 'Estado de cuentas pendientes por cobrar',
      icono: 'cash-outline',
      color: '#795548',
      ruta: 'ReporteCuentasCobrar'
    }
  ];

  const resumenVentas = {
    totalVentas: 45750.25,
    totalProductos: 358,
    clientesAtendidos: 42,
    ticketPromedio: 1089.29,
    comparacionAnterior: 12.5 // porcentaje de incremento respecto al periodo anterior
  };

  const handleGenerarReporte = (ruta) => {
    setLoading(true);
    
    // Simular carga de reporte
    setTimeout(() => {
      setLoading(false);
      navigation.navigate(ruta, { periodo: selectedPeriodo });
    }, 1000);
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
        <View style={styles.resumenGrid}>
          <View style={styles.resumenItem}>
            <Text style={styles.resumenValue}>${resumenVentas.totalVentas.toFixed(2)}</Text>
            <Text style={styles.resumenLabel}>Total Ventas</Text>
          </View>
          
          <View style={styles.resumenItem}>
            <Text style={styles.resumenValue}>{resumenVentas.totalProductos}</Text>
            <Text style={styles.resumenLabel}>Productos Vendidos</Text>
          </View>
          
          <View style={styles.resumenItem}>
            <Text style={styles.resumenValue}>{resumenVentas.clientesAtendidos}</Text>
            <Text style={styles.resumenLabel}>Clientes Atendidos</Text>
          </View>
          
          <View style={styles.resumenItem}>
            <Text style={styles.resumenValue}>${resumenVentas.ticketPromedio.toFixed(2)}</Text>
            <Text style={styles.resumenLabel}>Ticket Promedio</Text>
          </View>
        </View>
        
        <View style={styles.comparacionContainer}>
          <Text style={styles.comparacionLabel}>
            Comparado con periodo anterior:
          </Text>
          <View style={styles.comparacionValor}>
            <Ionicons 
              name={resumenVentas.comparacionAnterior >= 0 ? "arrow-up" : "arrow-down"} 
              size={16} 
              color={resumenVentas.comparacionAnterior >= 0 ? "#4CAF50" : "#F44336"} 
            />
            <Text style={[
              styles.comparacionPorcentaje,
              {color: resumenVentas.comparacionAnterior >= 0 ? "#4CAF50" : "#F44336"}
            ]}>
              {Math.abs(resumenVentas.comparacionAnterior)}%
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
            icon="file-excel-outline" 
            style={styles.exportButton}
            onPress={() => {}}
          >
            Excel
          </Button>
          <Button 
            mode="outlined" 
            icon="file-pdf-outline" 
            style={styles.exportButton}
            onPress={() => {}}
          >
            PDF
          </Button>
          <Button 
            mode="outlined" 
            icon="file-csv-outline" 
            style={styles.exportButton}
            onPress={() => {}}
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
