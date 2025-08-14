import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Divider, ActivityIndicator, IconButton } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import api from '../../services/api';

const DetalleDevolucionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  const [loading, setLoading] = useState(true);
  const [devolucion, setDevolucion] = useState(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [, setError] = useState(null);

  const loadDevolucionDetalle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { devolucionId } = route.params;
      
      // Cargar la devolución desde la API
      const devolucionData = await api.getDevolucion(devolucionId);
      console.log('Devolución cargada desde API:', devolucionData);
      
      if (devolucionData) {
        setDevolucion(devolucionData);
      } else {
        setError('No se encontró la devolución');
        Alert.alert('Error', 'No se encontró la devolución solicitada');
      }
    } catch (error) {
      console.error('Error al cargar detalles de devolución:', error);
      setError('Error al cargar la devolución');
      Alert.alert('Error', 'No se pudieron cargar los detalles de la devolución');
    } finally {
      setLoading(false);
    }
  }, [route.params]);
  
  useEffect(() => {
    loadDevolucionDetalle();
  }, [loadDevolucionDetalle]);

  const generateDevolucionHTML = (devolucion) => {
    // Calcular el total de la devolución
    const total = devolucion.total || 
      (devolucion.items || []).reduce((sum, item) => {
        return sum + (parseFloat(item.precio_unitario || 0) * parseFloat(item.cantidad || 0));
      }, 0);
    
    // Generar filas de productos
    const productosHTML = (devolucion.items || []).map(item => `
      <tr>
        <td>${item.producto_nombre || 'Producto no especificado'}</td>
        <td>${item.cantidad || 0}</td>
        <td>L. ${parseFloat(item.precio_unitario || 0).toFixed(2)}</td>
        <td>L. ${(parseFloat(item.precio_unitario || 0) * parseFloat(item.cantidad || 0)).toFixed(2)}</td>
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
            font-size: 12px;
          }
          .ticket-header {
            text-align: center;
            margin-bottom: 10px;
          }
          .ticket-header h1 {
            font-size: 16px;
            margin: 0;
          }
          .ticket-header p {
            margin: 5px 0;
          }
          .ticket-info {
            margin-bottom: 10px;
          }
          .ticket-info p {
            margin: 3px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
          }
          th, td {
            text-align: left;
            padding: 3px;
            font-size: 11px;
          }
          th {
            border-bottom: 1px solid #000;
          }
          .total-row {
            font-weight: bold;
            border-top: 1px solid #000;
          }
          .footer {
            text-align: center;
            margin-top: 10px;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div class="ticket-header">
          <h1>COMPROBANTE DE DEVOLUCIÓN</h1>
          <p>Ventas App</p>
          <p>Devolución #${devolucion.id}</p>
        </div>
        
        <div class="ticket-info">
          <p><strong>Fecha:</strong> ${devolucion.fecha ? new Date(devolucion.fecha).toLocaleDateString() : ''}</p>
          <p><strong>Cliente:</strong> ${devolucion.cliente_nombre || 'Cliente no especificado'}</p>
          <p><strong>Venta Original:</strong> #${devolucion.venta_id || 'N/A'}</p>
          <p><strong>Motivo:</strong> ${devolucion.motivo || 'No especificado'}</p>
          <p><strong>Atendido por:</strong> ${devolucion.usuario_nombre || 'Usuario no especificado'}</p>
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
            <tr class="total-row">
              <td colspan="3">TOTAL DEVUELTO:</td>
              <td>L. ${parseFloat(total).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="footer">
          <p>Gracias por su preferencia</p>
          <p>*** COPIA CLIENTE ***</p>
        </div>
      </body>
      </html>
    `;
  };

  const generateAndSharePDF = async () => {
    if (!devolucion) {
      Alert.alert('Error', 'No hay datos de devolución para generar el PDF');
      return false;
    }
    
    try {
      setGeneratingPDF(true);
      
      // Generar el HTML del ticket
      const html = generateDevolucionHTML(devolucion);
      
      // Generar el PDF
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false
      });
      
      // Verificar si se puede compartir
      const canShare = await Sharing.isAvailableAsync();
      
      if (canShare) {
        // Compartir el PDF
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Comprobante de Devolución ${devolucion.id}`,
          UTI: 'com.adobe.pdf'
        });
        
        return true;
      } else {
        Alert.alert('Error', 'No se puede compartir en este dispositivo');
        return false;
      }
    } catch (error) {
      console.error('Error al generar o compartir PDF:', error);
      Alert.alert('Error', 'No se pudo generar o compartir el PDF');
      return false;
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Cargando detalles de la devolución...</Text>
      </View>
    );
  }

  if (!devolucion) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
        <Text style={styles.errorText}>No se encontró la devolución</Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.goBack()} 
          style={styles.errorButton}
        >
          Volver
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title 
          title={`Devolución #${devolucion.id || 'N/A'}`} 
          subtitle={`${devolucion.fecha ? new Date(devolucion.fecha).toLocaleDateString() : 'Fecha no disponible'}`}
          right={(props) => (
            <IconButton
              {...props}
              icon="share-variant"
              onPress={generateAndSharePDF}
              disabled={generatingPDF}
            />
          )}
        />
        <Card.Content>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cliente:</Text>
            <Text style={styles.infoValue}>
              {devolucion.cliente_nombre || 'Cliente no especificado'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Venta Original:</Text>
            <Text style={styles.infoValue}>#{devolucion.venta_id || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Motivo:</Text>
            <Text style={styles.infoValue}>{devolucion.motivo || 'No especificado'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estado:</Text>
            <Text style={[styles.infoValue, styles.estadoText]}>
              Completada
            </Text>
          </View>
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Productos Devueltos</Text>
          
          {(devolucion.items || []).map((item, index) => (
            <Card key={index} style={styles.itemCard}>
              <Card.Content>
                <Text style={styles.productoNombre}>
                  {item.producto_nombre || 'Producto no especificado'}
                </Text>
                <View style={styles.itemDetails}>
                  <View style={styles.itemDetail}>
                    <Text style={styles.itemDetailLabel}>Cantidad:</Text>
                    <Text style={styles.itemDetailValue}>{item.cantidad || 0}</Text>
                  </View>
                  <View style={styles.itemDetail}>
                    <Text style={styles.itemDetailLabel}>Precio:</Text>
                    <Text style={styles.itemDetailValue}>
                      L. {parseFloat(item.precio_unitario || 0).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.itemDetail}>
                    <Text style={styles.itemDetailLabel}>Subtotal:</Text>
                    <Text style={styles.itemDetailValue}>
                      L. {(parseFloat(item.precio_unitario || 0) * parseFloat(item.cantidad || 0)).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))}
          
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Devuelto:</Text>
            <Text style={styles.totalValue}>L. {parseFloat(devolucion.total || 0).toFixed(2)}</Text>
          </View>
        </Card.Content>
        <Card.Actions style={styles.cardActions}>
          <Button 
            mode="outlined" 
            onPress={() => navigation.goBack()}
          >
            Volver
          </Button>
          <Button 
            mode="contained" 
            onPress={generateAndSharePDF}
            loading={generatingPDF}
            disabled={generatingPDF}
          >
            {generatingPDF ? 'Generando...' : 'Compartir Comprobante'}
          </Button>
        </Card.Actions>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
  },
  errorButton: {
    marginTop: 20,
  },
  card: {
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: 'bold',
    width: '30%',
    color: '#555',
  },
  infoValue: {
    flex: 1,
  },
  estadoText: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  itemCard: {
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  productoNombre: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  itemDetail: {
    flexDirection: 'row',
    marginRight: 10,
    marginBottom: 5,
  },
  itemDetailLabel: {
    color: '#666',
    marginRight: 5,
  },
  itemDetailValue: {
    fontWeight: '500',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  cardActions: {
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
});

export default DetalleDevolucionScreen;
