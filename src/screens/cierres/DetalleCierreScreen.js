import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Divider, ActivityIndicator, List, DataTable } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const DetalleCierreScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { cierreId } = route.params || {};
  const [cierre, setCierre] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ventas, setVentas] = useState([]);

  useEffect(() => {
    loadCierreDetalle();
  }, [cierreId]);

  const loadCierreDetalle = async () => {
    try {
      setLoading(true);
      // Simular carga de datos desde API
      setTimeout(() => {
        // Datos de ejemplo para desarrollo
        const cierreEjemplo = {
          id: cierreId,
          fecha: '2025-06-10',
          hora: '18:30',
          vendedor: 'Juan Pérez',
          totalVentas: 5250.75,
          totalDevoluciones: 150.50,
          totalNeto: 5100.25,
          estado: 'completado',
          metodoPago: {
            efectivo: 3000.00,
            tarjeta: 1500.00,
            transferencia: 600.25,
            credito: 0.00
          },
          observaciones: 'Cierre normal sin incidencias.',
          creadoPor: 'admin',
          fechaCreacion: '2025-06-10 18:35:22'
        };

        const ventasEjemplo = [
          { id: 1, hora: '09:15', cliente: 'Tienda A', total: 850.50, metodoPago: 'Efectivo' },
          { id: 2, hora: '10:30', cliente: 'Tienda B', total: 1200.25, metodoPago: 'Tarjeta' },
          { id: 3, hora: '12:45', cliente: 'Tienda C', total: 950.00, metodoPago: 'Transferencia' },
          { id: 4, hora: '14:20', cliente: 'Tienda D', total: 1500.00, metodoPago: 'Efectivo' },
          { id: 5, hora: '16:10', cliente: 'Tienda E', total: 750.00, metodoPago: 'Tarjeta' },
        ];
        
        setCierre(cierreEjemplo);
        setVentas(ventasEjemplo);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error al cargar detalle del cierre:', error);
      setLoading(false);
      Alert.alert('Error', 'No se pudo cargar la información del cierre');
    }
  };

  const handleEdit = () => {
    navigation.navigate('EditarCierre', { cierre });
  };

  const handlePrint = () => {
    Alert.alert(
      'Imprimir Cierre',
      '¿Desea imprimir el reporte de cierre?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Imprimir',
          onPress: () => {
            // Aquí iría la lógica para imprimir
            Alert.alert('Éxito', 'Reporte enviado a la impresora');
          },
        },
      ]
    );
  };

  const handleExport = () => {
    Alert.alert(
      'Exportar Cierre',
      'Seleccione el formato de exportación',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'PDF',
          onPress: () => {
            // Aquí iría la lógica para exportar a PDF
            Alert.alert('Éxito', 'Cierre exportado a PDF');
          },
        },
        {
          text: 'Excel',
          onPress: () => {
            // Aquí iría la lógica para exportar a Excel
            Alert.alert('Éxito', 'Cierre exportado a Excel');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loaderText}>Cargando información del cierre...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title 
          title={`Cierre de Caja - ${cierre.fecha}`} 
          subtitle={`Vendedor: ${cierre.vendedor} | Hora: ${cierre.hora}`}
        />
        <Card.Content>
          <View style={styles.resumenContainer}>
            <View style={styles.resumenItem}>
              <Text style={styles.resumenLabel}>Total Ventas</Text>
              <Text style={styles.resumenValue}>L. {cierre.totalVentas.toFixed(2)}</Text>
            </View>
            
            <View style={styles.resumenItem}>
              <Text style={styles.resumenLabel}>Devoluciones</Text>
              <Text style={[styles.resumenValue, styles.devolucionesValue]}>
                -L. {cierre.totalDevoluciones.toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.resumenItem}>
              <Text style={styles.resumenLabel}>Total Neto</Text>
              <Text style={[styles.resumenValue, styles.totalNetoValue]}>
                L. {cierre.totalNeto.toFixed(2)}
              </Text>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Desglose por Método de Pago</Text>
          
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Método</DataTable.Title>
              <DataTable.Title numeric>Monto</DataTable.Title>
            </DataTable.Header>
            
            <DataTable.Row>
              <DataTable.Cell>Efectivo</DataTable.Cell>
              <DataTable.Cell numeric>L. {cierre.metodoPago.efectivo.toFixed(2)}</DataTable.Cell>
            </DataTable.Row>
            
            <DataTable.Row>
              <DataTable.Cell>Tarjeta</DataTable.Cell>
              <DataTable.Cell numeric>L. {cierre.metodoPago.tarjeta.toFixed(2)}</DataTable.Cell>
            </DataTable.Row>
            
            <DataTable.Row>
              <DataTable.Cell>Transferencia</DataTable.Cell>
              <DataTable.Cell numeric>L. {cierre.metodoPago.transferencia.toFixed(2)}</DataTable.Cell>
            </DataTable.Row>
            
            <DataTable.Row>
              <DataTable.Cell>Crédito</DataTable.Cell>
              <DataTable.Cell numeric>L. {cierre.metodoPago.credito.toFixed(2)}</DataTable.Cell>
            </DataTable.Row>
            
            <DataTable.Row style={styles.totalRow}>
              <DataTable.Cell>TOTAL</DataTable.Cell>
              <DataTable.Cell numeric>L. {cierre.totalNeto.toFixed(2)}</DataTable.Cell>
            </DataTable.Row>
          </DataTable>
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Ventas del Día</Text>
          
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Hora</DataTable.Title>
              <DataTable.Title>Cliente</DataTable.Title>
              <DataTable.Title>Método</DataTable.Title>
              <DataTable.Title numeric>Total</DataTable.Title>
            </DataTable.Header>
            
            {ventas.map(venta => (
              <DataTable.Row 
                key={venta.id}
                onPress={() => navigation.navigate('DetalleVenta', { ventaId: venta.id })}
              >
                <DataTable.Cell>{venta.hora}</DataTable.Cell>
                <DataTable.Cell>{venta.cliente}</DataTable.Cell>
                <DataTable.Cell>{venta.metodoPago}</DataTable.Cell>
                <DataTable.Cell numeric>L. {(venta.total !== undefined && venta.total !== null) ? parseFloat(venta.total).toFixed(2) : '0.00'}</DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Información Adicional</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estado:</Text>
            <Text style={[
              styles.estadoText,
              cierre.estado === 'completado' ? styles.estadoCompletado : styles.estadoPendiente
            ]}>
              {cierre.estado === 'completado' ? 'Completado' : 'Pendiente'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Creado por:</Text>
            <Text style={styles.infoValue}>{cierre.creadoPor}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha de creación:</Text>
            <Text style={styles.infoValue}>{cierre.fechaCreacion}</Text>
          </View>
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Observaciones</Text>
          <Text style={styles.observacionesText}>{cierre.observaciones || 'Sin observaciones'}</Text>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          icon="pencil"
          onPress={handleEdit}
          style={styles.actionButton}
        >
          Editar
        </Button>
        
        <Button
          mode="contained"
          icon="printer"
          onPress={handlePrint}
          style={styles.actionButton}
        >
          Imprimir
        </Button>
        
        <Button
          mode="contained"
          icon="export"
          onPress={handleExport}
          style={styles.actionButton}
        >
          Exportar
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  card: {
    marginBottom: 15,
    elevation: 2,
  },
  divider: {
    marginVertical: 15,
  },
  resumenContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  resumenItem: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  resumenLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  resumenValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  devolucionesValue: {
    color: '#f44336',
  },
  totalNetoValue: {
    color: '#4caf50',
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#0066cc',
  },
  totalRow: {
    backgroundColor: '#f0f0f0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#555',
  },
  infoValue: {
    color: '#333',
  },
  estadoText: {
    fontWeight: 'bold',
  },
  estadoCompletado: {
    color: '#4caf50',
  },
  estadoPendiente: {
    color: '#ff9800',
  },
  observacionesText: {
    fontStyle: 'italic',
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  actionButton: {
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

export default DetalleCierreScreen;
