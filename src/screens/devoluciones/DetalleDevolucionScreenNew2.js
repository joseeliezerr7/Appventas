import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Divider, Text } from 'react-native-paper';
import api from '../../services/api';

const DetalleDevolucionScreenNew2 = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  const [loading, setLoading] = useState(true);
  const [devolucion, setDevolucion] = useState(null);

  const loadDevolucionDetalle = useCallback(async () => {
    try {
      setLoading(true);
      const { devolucionId } = route.params;
      
      if (!devolucionId) {
        throw new Error('ID de devolución no proporcionado');
      }

      console.log('🔄 CARGANDO DEVOLUCION ID:', devolucionId);
      
      // Llamar a la API
      const data = await api.getDevolucion(devolucionId);
      
      console.log('📦 DATOS DE LA API:', JSON.stringify(data, null, 2));
      
      setDevolucion(data);
    } catch (error) {
      console.error('❌ Error al cargar devolución:', error);
      Alert.alert('Error', error.message || 'No se pudieron cargar los detalles de la devolución');
    } finally {
      setLoading(false);
    }
  }, [route.params]);
  
  useEffect(() => {
    loadDevolucionDetalle();
  }, [loadDevolucionDetalle]);

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
          title={`Devolución #${devolucion.id}`} 
          subtitle={`${new Date(devolucion.fecha).toLocaleDateString()}`}
        />
        <Card.Content>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cliente:</Text>
            <Text style={styles.infoValue}>{devolucion.cliente_nombre || 'Cliente no especificado'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Venta Original:</Text>
            <Text style={styles.infoValue}>#{devolucion.venta_id}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Motivo:</Text>
            <Text style={styles.infoValue}>{devolucion.motivo || 'No especificado'}</Text>
          </View>
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>🔄 Productos Devueltos - NUEVA VERSION</Text>
          
          {(devolucion.items || []).map((item, index) => {
            console.log(`🎯 ITEM ${index}:`, {
              producto_nombre: item.producto_nombre,
              cantidad: item.cantidad,
              unidad_nombre: item.unidad_nombre,
              precio_unitario: item.precio_unitario
            });
            
            return (
              <Card key={index} style={styles.itemCard}>
                <Card.Content>
                  <Text style={styles.productoNombre}>
                    {item.producto_nombre || 'Producto no especificado'}
                  </Text>
                  
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemDetailText}>
                      📦 Cantidad: {item.cantidad} {item.unidad_nombre || 'unidades'}
                    </Text>
                    <Text style={styles.itemDetailText}>
                      💰 Precio: L. {parseFloat(item.precio_unitario || 0).toFixed(2)}
                    </Text>
                    <Text style={styles.itemDetailText}>
                      💵 Subtotal: L. {parseFloat(item.subtotal || 0).toFixed(2)}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            );
          })}
          
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
  divider: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#0066cc',
  },
  itemCard: {
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  productoNombre: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
  },
  itemDetails: {
    marginTop: 5,
  },
  itemDetailText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
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

export default DetalleDevolucionScreenNew2;