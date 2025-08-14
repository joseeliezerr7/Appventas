import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, TextInput, Divider, ActivityIndicator, Checkbox } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import api from '../../services/api';

const NuevaDevolucionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { venta } = route.params;
  
  const [loading, setLoading] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [itemsSeleccionados, setItemsSeleccionados] = useState([]);
  
  // En una implementación real, cargaríamos los detalles de la venta desde la API
  // Aquí usamos los datos de ejemplo que ya tenemos
  const ventaDetalles = venta.detalles || [
    { id: 1, producto: { id: 1, nombre: 'Producto 1' }, cantidad: 2, precio_unitario: 10.50, subtotal: 21.00 },
    { id: 2, producto: { id: 2, nombre: 'Producto 2' }, cantidad: 1, precio_unitario: 25.75, subtotal: 25.75 },
    { id: 3, producto: { id: 3, nombre: 'Producto 3' }, cantidad: 3, precio_unitario: 5.25, subtotal: 15.75 },
  ];

  const toggleItemSeleccion = (item) => {
    const index = itemsSeleccionados.findIndex(i => i.id === item.id);
    
    if (index >= 0) {
      // Si ya está seleccionado, lo quitamos
      const nuevosItems = [...itemsSeleccionados];
      nuevosItems.splice(index, 1);
      setItemsSeleccionados(nuevosItems);
    } else {
      // Si no está seleccionado, lo añadimos con la cantidad máxima
      setItemsSeleccionados([...itemsSeleccionados, {
        ...item,
        cantidadDevolucion: item.cantidad
      }]);
    }
  };

  const actualizarCantidadDevolucion = (id, cantidad) => {
    // Permitir que el campo esté vacío durante la edición
    if (cantidad === '') {
      setItemsSeleccionados(itemsSeleccionados.map(i => 
        i.id === id ? { ...i, cantidadDevolucion: '' } : i
      ));
      return;
    }
    
    // Convertir a número
    const cantidadNum = parseFloat(cantidad);
    if (isNaN(cantidadNum)) return;
    
    // Encontrar el item original para obtener la cantidad máxima
    const itemOriginal = ventaDetalles.find(i => i.id === id);
    if (!itemOriginal) return;
    
    // Asegurar que la cantidad no exceda la original
    const cantidadFinal = Math.min(cantidadNum, itemOriginal.cantidad);
    
    // Actualizar el estado
    setItemsSeleccionados(itemsSeleccionados.map(i => 
      i.id === id ? { ...i, cantidadDevolucion: cantidadFinal } : i
    ));
  };

  const calcularTotalDevolucion = () => {
    return itemsSeleccionados.reduce((total, item) => {
      const cantidad = parseFloat(item.cantidadDevolucion) || 0;
      const precio = parseFloat(item.precio_unitario) || 0;
      return total + (cantidad * precio);
    }, 0);
  };

  const generateDevolucionHTML = (devolucionData) => {
    // Generar filas de productos
    const productosHTML = devolucionData.items.map(item => `
      <tr>
        <td>${item.producto.nombre}</td>
        <td>${item.cantidadDevolucion}</td>
        <td>L. ${parseFloat(item.precio_unitario).toFixed(2)}</td>
        <td>L. ${(parseFloat(item.precio_unitario) * parseFloat(item.cantidadDevolucion)).toFixed(2)}</td>
      </tr>
    `).join('');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Comprobante de Devolución</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 10px;
            width: 80mm;
            max-width: 80mm;
          }
          .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }
          th, td {
            text-align: left;
            padding: 3px;
            font-size: 10px;
          }
          th {
            border-bottom: 1px solid #ddd;
          }
          .total {
            font-weight: bold;
            text-align: right;
            margin-top: 10px;
            border-top: 1px dashed #000;
            padding-top: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 10px;
            border-top: 1px dashed #000;
            padding-top: 10px;
          }
          .motivo {
            margin: 10px 0;
            padding: 5px;
            background-color: #f5f5f5;
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>DEVOLUCIÓN</h2>
          <p>Venta #${devolucionData.venta_id}</p>
          <p>Fecha: ${devolucionData.fecha}</p>
          <p>Hora: ${devolucionData.hora}</p>
        </div>
        
        <div class="info-row">
          <span>Cliente:</span>
          <span>${devolucionData.cliente.nombre}</span>
        </div>
        
        <div class="info-row">
          <span>Devolución #:</span>
          <span>${devolucionData.id}</span>
        </div>
        
        <div class="motivo">
          <strong>Motivo:</strong> ${devolucionData.motivo}
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cant.</th>
              <th>Precio</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${productosHTML}
          </tbody>
        </table>
        
        <div class="total">
          Total Devuelto: L. ${parseFloat(devolucionData.total).toFixed(2)}
        </div>
        
        <div class="footer">
          <p>Gracias por su preferencia</p>
          <p>Sistema de Ventas v1.0</p>
        </div>
      </body>
      </html>
    `;
  };

  const generateAndSharePDF = async (devolucionData) => {
    try {
      setGeneratingPDF(true);
      
      // Generar HTML
      const html = generateDevolucionHTML(devolucionData);
      
      // Generar PDF
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false
      });
      
      // Compartir PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Comprobante de Devolución #${devolucionData.id}`,
          UTI: 'com.adobe.pdf'
        });
        
        setGeneratingPDF(false);
        return true;
      } else {
        Alert.alert('Error', 'La función de compartir no está disponible en este dispositivo');
      }
      
      setGeneratingPDF(false);
      return true;
    } catch (error) {
      console.error('Error al generar PDF:', error);
      Alert.alert('Error', 'No se pudo generar el PDF: ' + error.message);
      setGeneratingPDF(false);
      return false;
    }
  };

  const handleSubmit = async () => {
    if (itemsSeleccionados.length === 0) {
      Alert.alert('Error', 'Debe seleccionar al menos un producto para la devolución');
      return;
    }
    
    if (!motivo.trim()) {
      Alert.alert('Error', 'Debe ingresar un motivo para la devolución');
      return;
    }
    
    try {
      setLoading(true);
      
      // Calcular el total de la devolución
      const totalDevolucion = calcularTotalDevolucion();
      
      // Preparar los datos de la devolución para la API
      const devolucionData = {
        venta_id: venta.id,
        cliente_id: venta.cliente.id,
        motivo: motivo,
        items: itemsSeleccionados.map(item => ({
          producto_id: item.producto.id,
          cantidad: item.cantidadDevolucion,
          precio_unitario: item.precio_unitario
        })),
        total: totalDevolucion,
        usuario_id: 1 // En una implementación real, esto vendría del contexto de autenticación
      };
      
      console.log('Enviando devolución a la API:', devolucionData);
      
      // Enviar la devolución a la API
      const response = await api.createDevolucion(devolucionData);
      console.log('Respuesta de la API:', response);
      
      // La API se encarga de actualizar el stock y el estado de la venta
      // Ahora usamos el ID devuelto por la API
      const devolucionId = response.id || `DEV-${Date.now()}`;
      
      // Crear objeto completo para el PDF con los datos de la respuesta
      const devolucionCompleta = {
        id: devolucionId,
        venta_id: venta.id,
        fecha: new Date().toLocaleDateString(),
        hora: new Date().toLocaleTimeString(),
        cliente: venta.cliente,
        motivo: motivo,
        items: itemsSeleccionados,
        total: totalDevolucion,
        estado: 'completada'
      };
      
      // Generar y compartir el PDF
      const pdfGenerado = await generateAndSharePDF(devolucionCompleta);
      
      if (pdfGenerado) {
        Alert.alert(
          'Devolución Registrada',
          `La devolución #${devolucionId} ha sido registrada exitosamente. Los productos han sido devueltos al inventario y el estado de la venta ha sido actualizado.`,
          [
            { 
              text: 'Ver Devoluciones', 
              onPress: () => navigation.navigate('DevolucionesList') 
            },
            { 
              text: 'OK', 
              onPress: () => navigation.navigate('VentasList'),
              style: 'cancel' 
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error al registrar devolución:', error);
      Alert.alert('Error', 'No se pudo registrar la devolución: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading || generatingPDF) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>
          {generatingPDF ? 'Generando ticket de devolución...' : 'Procesando devolución...'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title={`Devolución de Venta #${venta.id}`} />
        <Card.Content>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha Venta:</Text>
            <Text style={styles.infoValue}>{venta.fecha}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cliente:</Text>
            <Text style={styles.infoValue}>{venta.cliente.nombre}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Venta:</Text>
            <Text style={styles.infoValue}>L. {parseFloat(venta.total).toFixed(2)}</Text>
          </View>
          
          <TextInput
            label="Motivo de la devolución"
            value={motivo}
            onChangeText={setMotivo}
            style={styles.input}
            multiline
            numberOfLines={3}
          />
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Title title="Seleccione los productos a devolver" />
        <Card.Content>
          {ventaDetalles.map((item, index) => (
            <View key={item.id}>
              <View style={styles.itemRow}>
                <Checkbox
                  status={itemsSeleccionados.some(i => i.id === item.id) ? 'checked' : 'unchecked'}
                  onPress={() => toggleItemSeleccion(item)}
                />
                
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.producto.nombre}</Text>
                  <Text style={styles.itemDetails}>
                    Cantidad: {item.cantidad} | Precio: L. {parseFloat(item.precio_unitario).toFixed(2)}
                  </Text>
                </View>
              </View>
              
              {itemsSeleccionados.some(i => i.id === item.id) && (
                <View style={styles.cantidadContainer}>
                  <Text style={styles.cantidadLabel}>Cantidad a devolver:</Text>
                  <TextInput
                    value={String(itemsSeleccionados.find(i => i.id === item.id).cantidadDevolucion)}
                    onChangeText={(text) => actualizarCantidadDevolucion(item.id, text)}
                    keyboardType="numeric"
                    style={styles.cantidadInput}
                    maxLength={5}
                  />
                </View>
              )}
              
              {index < ventaDetalles.length - 1 && <Divider style={styles.divider} />}
            </View>
          ))}
          
          {itemsSeleccionados.length > 0 && (
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total a devolver:</Text>
              <Text style={styles.totalValue}>
                L. {calcularTotalDevolucion().toFixed(2)}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
      
      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.submitButton}
        disabled={itemsSeleccionados.length === 0 || !motivo.trim()}
      >
        Registrar Devolución
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 8,
  },
  card: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#555',
  },
  infoValue: {
    color: '#333',
  },
  input: {
    marginTop: 16,
    backgroundColor: '#fff',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
  },
  cantidadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 40,
    marginBottom: 8,
  },
  cantidadLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  cantidadInput: {
    width: 80,
    height: 40,
    backgroundColor: '#fff',
  },
  divider: {
    marginVertical: 8,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
  },
  submitButton: {
    marginVertical: 16,
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#555',
  },
});

export default NuevaDevolucionScreen;
