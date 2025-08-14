import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, ActivityIndicator, Button, Divider } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import api from '../../services/api';

const DetalleVentaScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { venta: ventaParam } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [venta, setVenta] = useState(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const loadVentaDetalle = useCallback(async () => {
    try {
      setLoading(true);
      console.log(`Cargando detalles de la venta ID: ${ventaParam.id}`);
      
      // Obtener los detalles de la venta desde la API
      const detallesVenta = await api.getVenta(ventaParam.id);
      console.log('Detalles de venta recibidos:', detallesVenta);
      
      // Verificar si la respuesta contiene los datos necesarios
      if (!detallesVenta || !detallesVenta.items) {
        console.error('La respuesta de la API no contiene los detalles esperados');
        Alert.alert('Error', 'Los datos de la venta están incompletos');
        setVenta({
          ...ventaParam,
          items: [],
          metodo_pago: 'No especificado',
          notas: '',
          vendedor_nombre: 'No especificado'
        });
      } else {
        // Adaptar la estructura de la API a la estructura esperada por la UI
        setVenta({
          ...detallesVenta,
          detalles: detallesVenta.items,
          usuario: { 
            id: detallesVenta.usuario_id, 
            nombre: detallesVenta.vendedor_nombre 
          },
          cliente: {
            id: detallesVenta.cliente_id,
            nombre: detallesVenta.cliente_nombre,
            direccion: detallesVenta.cliente_direccion,
            telefono: detallesVenta.cliente_telefono
          }
        });
      }
    } catch (error) {
      console.error('Error al cargar detalles de venta:', error);
      Alert.alert('Error', 'No se pudieron cargar los detalles de la venta');
      
      // En caso de error, usar los datos básicos que ya tenemos
      setVenta({
        ...ventaParam,
        detalles: [],
        metodo_pago: 'No disponible',
        notas: 'Error al cargar detalles',
        usuario: { id: 0, nombre: 'No disponible' }
      });
    } finally {
      setLoading(false);
    }
  }, [ventaParam]);

  useEffect(() => {
    loadVentaDetalle();
  }, [loadVentaDetalle]);

  // Función para generar el HTML del ticket
  const generateTicketHTML = (ventaData) => {
    if (!ventaData) return '';
    
    // Crear el HTML para los productos
    const productosHTML = (ventaData.detalles || ventaData.items || []).map(item => `
      <tr>
        <td>${item.producto_nombre || (item.producto && item.producto.nombre) || 'Producto sin nombre'}</td>
        <td>${item.cantidad}</td>
        <td>L. ${parseFloat(item.precio_unitario || 0).toFixed(2)}</td>
        <td>L. ${parseFloat(item.subtotal || 0).toFixed(2)}</td>
      </tr>
    `).join('');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ticket de Venta</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 10px;
            width: 80mm; /* Ancho estándar de ticket */
            max-width: 80mm;
            font-size: 12px;
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
        </style>
      </head>
      <body>
        <div class="header">
          <h2>FACTURA</h2>
          <p>Venta #${ventaData.id}</p>
          <p>Fecha: ${ventaData.fecha}</p>
        </div>
        
        <div class="info-row">
          <span><b>Cliente:</b></span>
          <span>${ventaData.cliente?.nombre || ventaData.cliente_nombre || 'No especificado'}</span>
        </div>
        
        <div class="info-row">
          <span><b>Vendedor:</b></span>
          <span>${ventaData.usuario?.nombre || ventaData.vendedor_nombre || 'No especificado'}</span>
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
          <p>Total: L. ${parseFloat(ventaData.total).toFixed(2)}</p>
          <p>Método de pago: ${ventaData.metodo_pago}</p>
        </div>
        
        ${ventaData.notas ? `<p><b>Notas:</b> ${ventaData.notas}</p>` : ''}
        
        <div class="footer">
          <p>¡Gracias por su compra!</p>
        </div>
      </body>
      </html>
    `;
  };

  // Función para generar y compartir el PDF
  const generateAndSharePDF = async () => {
    try {
      if (!venta) return;
      
      setGeneratingPDF(true);
      
      // Generar el HTML del ticket
      const html = generateTicketHTML(venta);
      
      // Crear el PDF
      const { uri } = await Print.printToFileAsync({ 
        html,
        base64: false,
        width: 210, // Ancho en puntos (72 puntos = 1 pulgada)
        height: 800 // Alto aproximado, se ajustará automáticamente
      });
      
      // Compartir el PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Error', 'La función de compartir no está disponible en este dispositivo');
      }
      
      setGeneratingPDF(false);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      Alert.alert('Error', 'No se pudo generar el PDF: ' + error.message);
      setGeneratingPDF(false);
    }
  };

  const handleDevolucion = () => {
    navigation.navigate('NuevaDevolucion', { venta });
  };
  
  const handleCancelarVenta = async () => {
    Alert.alert(
      'Confirmar Cancelación',
      '¿Está seguro de que desea cancelar esta venta? Esta acción no se puede deshacer.',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Sí, Cancelar', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              console.log(`Cancelando venta ID: ${venta.id}`);
              
              // Llamar a la API para cancelar la venta
              const response = await api.cancelarVenta(venta.id);
              console.log('Respuesta de cancelación:', response);
              
              Alert.alert('Venta Cancelada', 'La venta ha sido cancelada exitosamente');
              navigation.goBack();
            } catch (error) {
              console.error('Error al cancelar venta:', error);
              Alert.alert('Error', `No se pudo cancelar la venta: ${error.message}`);
            } finally {
              setLoading(false);
            }
          } 
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Cargando detalles...</Text>
      </View>
    );
  }

  if (!venta) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No se pudo cargar la información de la venta</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Volver
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title={`Venta #${venta.id}`} />
        <Card.Content>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha:</Text>
            <Text style={styles.infoValue}>{venta.fecha}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cliente:</Text>
            <Text style={styles.infoValue}>{venta.cliente?.nombre || venta.cliente_nombre || 'No especificado'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Vendedor:</Text>
            <Text style={styles.infoValue}>{venta.usuario?.nombre || venta.vendedor_nombre || 'No especificado'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Método de Pago:</Text>
            <Text style={styles.infoValue}>{venta.metodo_pago}</Text>
          </View>
          
          {venta.notas && (
            <View style={styles.notasContainer}>
              <Text style={styles.notasLabel}>Notas:</Text>
              <Text style={styles.notasText}>{venta.notas}</Text>
            </View>
          )}
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Title title="Productos" />
        <Card.Content>
          {(venta.detalles || venta.items || []).map((item, index) => (
            <View key={index}>
              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.producto_nombre || (item.producto && item.producto.nombre) || 'Producto sin nombre'}</Text>
                  <Text style={styles.itemPrice}>L. {item.precio_unitario ? parseFloat(item.precio_unitario).toFixed(2) : '0.00'} x {item.cantidad}</Text>
                </View>
                <Text style={styles.itemSubtotal}>L. {item.subtotal ? parseFloat(item.subtotal).toFixed(2) : '0.00'}</Text>
              </View>
              {index < (venta.detalles || venta.items || []).length - 1 && <Divider style={styles.divider} />}
            </View>
          ))}
          
          <Divider style={styles.totalDivider} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalAmount}>L. {venta.total ? parseFloat(venta.total).toFixed(2) : '0.00'}</Text>
          </View>
        </Card.Content>
      </Card>
      
      <View style={styles.actionsContainer}>
        <Button
          mode="contained"
          icon="share"
          onPress={generateAndSharePDF}
          style={styles.actionButton}
          loading={generatingPDF}
          disabled={generatingPDF}
        >
          {generatingPDF ? 'Generando...' : 'Compartir Ticket'}
        </Button>
        
        <Button
          mode="outlined"
          icon="keyboard-return"
          onPress={handleDevolucion}
          style={styles.actionButton}
          color="#dc3545"
        >
          Devolución
        </Button>
        
        <Button
          mode="contained"
          icon="close"
          onPress={handleCancelarVenta}
          style={styles.actionButton}
          color="#dc3545"
        >
          Cancelar Venta
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: '#dc3545',
    marginBottom: 16,
  },
  card: {
    marginBottom: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 100,
    fontWeight: 'bold',
    color: '#666',
  },
  infoValue: {
    flex: 1,
    color: '#333',
  },
  notasContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  notasLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#666',
  },
  notasText: {
    color: '#333',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  itemPrice: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
  },
  divider: {
    backgroundColor: '#eee',
  },
  totalDivider: {
    marginVertical: 16,
    backgroundColor: '#ddd',
    height: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default DetalleVentaScreen;
