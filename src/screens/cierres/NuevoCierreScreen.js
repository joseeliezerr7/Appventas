import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Divider, HelperText, ActivityIndicator, DataTable } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const NuevoCierreScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [loadingVentas, setLoadingVentas] = useState(true);
  const [ventas, setVentas] = useState([]);
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
    vendedor: 'Juan Pérez', // Normalmente se obtendría del usuario logueado
    efectivo: '',
    tarjeta: '',
    transferencia: '',
    credito: '',
    observaciones: ''
  });
  const [errors, setErrors] = useState({});

  // Datos de ejemplo para desarrollo
  const ventasEjemplo = [
    { id: 1, hora: '09:15', cliente: 'Tienda A', total: 850.50, metodoPago: 'Efectivo' },
    { id: 2, hora: '10:30', cliente: 'Tienda B', total: 1200.25, metodoPago: 'Tarjeta' },
    { id: 3, hora: '12:45', cliente: 'Tienda C', total: 950.00, metodoPago: 'Transferencia' },
    { id: 4, hora: '14:20', cliente: 'Tienda D', total: 1500.00, metodoPago: 'Efectivo' },
    { id: 5, hora: '16:10', cliente: 'Tienda E', total: 750.00, metodoPago: 'Tarjeta' },
  ];

  // Calcular totales
  const totalVentas = ventas.reduce((sum, venta) => sum + venta.total, 0);
  const totalDevoluciones = 150.50; // Ejemplo, normalmente se obtendría de la API
  const totalNeto = totalVentas - totalDevoluciones;

  // Calcular totales por método de pago de las ventas
  const totalesPorMetodo = ventas.reduce((acc, venta) => {
    const metodo = venta.metodoPago.toLowerCase();
    if (!acc[metodo]) acc[metodo] = 0;
    acc[metodo] += venta.total;
    return acc;
  }, {});

  useEffect(() => {
    loadVentas();
  }, []);

  const loadVentas = () => {
    // Simular carga de ventas del día desde API
    setTimeout(() => {
      setVentas(ventasEjemplo);
      setLoadingVentas(false);
      
      // Pre-llenar los campos de montos según las ventas cargadas
      setFormData(prev => ({
        ...prev,
        efectivo: (totalesPorMetodo.efectivo || 0).toFixed(2),
        tarjeta: (totalesPorMetodo.tarjeta || 0).toFixed(2),
        transferencia: (totalesPorMetodo.transferencia || 0).toFixed(2),
        credito: (totalesPorMetodo.credito || 0).toFixed(2)
      }));
    }, 1000);
  };

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
    
    // Limpiar error cuando el usuario edita el campo
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: null
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validar montos
    const efectivo = parseFloat(formData.efectivo) || 0;
    const tarjeta = parseFloat(formData.tarjeta) || 0;
    const transferencia = parseFloat(formData.transferencia) || 0;
    const credito = parseFloat(formData.credito) || 0;
    
    const totalIngresado = efectivo + tarjeta + transferencia + credito;
    
    if (Math.abs(totalIngresado - totalNeto) > 0.01) {
      newErrors.montos = `El total ingresado (${totalIngresado.toFixed(2)}) no coincide con el total de ventas neto (${totalNeto.toFixed(2)})`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Simular envío a API
      setTimeout(() => {
        setLoading(false);
        Alert.alert(
          'Éxito',
          'Cierre de caja guardado correctamente',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }, 1500);
    } catch (error) {
      console.error('Error al guardar cierre:', error);
      setLoading(false);
      Alert.alert('Error', 'No se pudo guardar el cierre de caja');
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loaderText}>Guardando cierre de caja...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Nuevo Cierre de Caja</Text>
      
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Información General</Text>
        
        <View style={styles.row}>
          <TextInput
            label="Fecha"
            value={formData.fecha}
            onChangeText={(text) => handleChange('fecha', text)}
            style={[styles.input, styles.halfInput]}
            disabled
          />
          
          <TextInput
            label="Hora"
            value={formData.hora}
            onChangeText={(text) => handleChange('hora', text)}
            style={[styles.input, styles.halfInput]}
            disabled
          />
        </View>
        
        <TextInput
          label="Vendedor"
          value={formData.vendedor}
          onChangeText={(text) => handleChange('vendedor', text)}
          style={styles.input}
          disabled
        />
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Resumen de Ventas</Text>
        
        {loadingVentas ? (
          <ActivityIndicator size="small" color="#0066cc" />
        ) : (
          <View style={styles.resumenContainer}>
            <View style={styles.resumenItem}>
              <Text style={styles.resumenLabel}>Total Ventas</Text>
              <Text style={styles.resumenValue}>${totalVentas.toFixed(2)}</Text>
            </View>
            
            <View style={styles.resumenItem}>
              <Text style={styles.resumenLabel}>Devoluciones</Text>
              <Text style={[styles.resumenValue, styles.devolucionesValue]}>
                -${totalDevoluciones.toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.resumenItem}>
              <Text style={styles.resumenLabel}>Total Neto</Text>
              <Text style={[styles.resumenValue, styles.totalNetoValue]}>
                ${totalNeto.toFixed(2)}
              </Text>
            </View>
          </View>
        )}
        
        <Text style={styles.ventasTitle}>Ventas del Día</Text>
        
        {loadingVentas ? (
          <ActivityIndicator size="small" color="#0066cc" />
        ) : (
          <DataTable style={styles.dataTable}>
            <DataTable.Header>
              <DataTable.Title>Hora</DataTable.Title>
              <DataTable.Title>Cliente</DataTable.Title>
              <DataTable.Title>Método</DataTable.Title>
              <DataTable.Title numeric>Total</DataTable.Title>
            </DataTable.Header>
            
            {ventas.map(venta => (
              <DataTable.Row key={venta.id}>
                <DataTable.Cell>{venta.hora}</DataTable.Cell>
                <DataTable.Cell>{venta.cliente}</DataTable.Cell>
                <DataTable.Cell>{venta.metodoPago}</DataTable.Cell>
                <DataTable.Cell numeric>${(venta.total !== undefined && venta.total !== null) ? parseFloat(venta.total).toFixed(2) : '0.00'}</DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        )}
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Desglose por Método de Pago</Text>
        
        {errors.montos && <HelperText type="error">{errors.montos}</HelperText>}
        
        <TextInput
          label="Efectivo"
          value={formData.efectivo}
          onChangeText={(text) => handleChange('efectivo', text)}
          style={styles.input}
          keyboardType="numeric"
          left={<TextInput.Affix text="$" />}
        />
        
        <TextInput
          label="Tarjeta"
          value={formData.tarjeta}
          onChangeText={(text) => handleChange('tarjeta', text)}
          style={styles.input}
          keyboardType="numeric"
          left={<TextInput.Affix text="$" />}
        />
        
        <TextInput
          label="Transferencia"
          value={formData.transferencia}
          onChangeText={(text) => handleChange('transferencia', text)}
          style={styles.input}
          keyboardType="numeric"
          left={<TextInput.Affix text="$" />}
        />
        
        <TextInput
          label="Crédito"
          value={formData.credito}
          onChangeText={(text) => handleChange('credito', text)}
          style={styles.input}
          keyboardType="numeric"
          left={<TextInput.Affix text="$" />}
        />
        
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Ingresado:</Text>
          <Text style={styles.totalValue}>
            ${(
              parseFloat(formData.efectivo || 0) +
              parseFloat(formData.tarjeta || 0) +
              parseFloat(formData.transferencia || 0) +
              parseFloat(formData.credito || 0)
            ).toFixed(2)}
          </Text>
        </View>
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Observaciones</Text>
        
        <TextInput
          label="Observaciones"
          value={formData.observaciones}
          onChangeText={(text) => handleChange('observaciones', text)}
          style={styles.input}
          multiline
          numberOfLines={3}
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
        >
          Guardar Cierre
        </Button>
        
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
        >
          Cancelar
        </Button>
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
  formSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#0066cc',
  },
  input: {
    marginBottom: 10,
    backgroundColor: 'white',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
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
  ventasTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
  dataTable: {
    marginBottom: 10,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 5,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  buttonContainer: {
    marginVertical: 20,
  },
  submitButton: {
    marginBottom: 10,
    paddingVertical: 6,
  },
  cancelButton: {
    paddingVertical: 6,
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

export default NuevoCierreScreen;
