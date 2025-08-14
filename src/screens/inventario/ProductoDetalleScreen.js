import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Text, Card, Button, Divider, ActivityIndicator, DataTable } from 'react-native-paper';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import productosApi from '../../services/productosApi';
const api = productosApi;

const ProductoDetalleScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { productoId } = route.params || {};
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProductoDetalle = useCallback(async () => {
    try {
      setLoading(true);
      // Cargar datos desde la API
      const productoData = await api.getProducto(productoId);
      console.log('Detalle de producto cargado:', productoData);
      setProducto(productoData);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar detalle del producto:', error);
      setLoading(false);
      Alert.alert('Error', 'No se pudo cargar la información del producto');
    }
  }, [productoId]);
  
  useEffect(() => {
    loadProductoDetalle();
  }, [loadProductoDetalle]);

  // Recargar datos cuando la pantalla recibe el foco (ej. al volver de editar)
  useFocusEffect(
    useCallback(() => {
      loadProductoDetalle();
    }, [loadProductoDetalle])
  );

  const handleEdit = () => {
    navigation.navigate('EditarProducto', { producto });
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Está seguro que desea eliminar el producto "${producto?.nombre}" del inventario?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await api.deleteProducto(productoId);
              setLoading(false);
              Alert.alert('Éxito', 'Producto eliminado correctamente');
              navigation.goBack();
            } catch (error) {
              setLoading(false);
              console.error('Error al eliminar producto:', error);
              Alert.alert('Error', 'No se pudo eliminar el producto: ' + (error.message || 'Error desconocido'));
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loaderText}>Cargando información del producto...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Información General" />
        <Card.Content>
          {producto.imagen && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: producto.imagen }} style={styles.productImage} />
            </View>
          )}
          <Text style={styles.productName}>{producto.nombre}</Text>
          <Text style={styles.productCode}>Código: {producto.codigo}</Text>
          <Divider style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Categoría:</Text>
            <Text style={styles.infoValue}>{producto.categoria_nombre || 'Sin categoría'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Descripción:</Text>
            <Text style={styles.infoValue}>{producto.descripcion || 'Sin descripción'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Unidad Principal:</Text>
            <Text style={styles.infoValue}>{producto.unidad_principal || 'Unidad'}</Text>
          </View>

          {producto.codigo_barras && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Código de Barras:</Text>
              <Text style={styles.infoValue}>{producto.codigo_barras}</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Inventario" />
        <Card.Content>
          <View style={styles.stockContainer}>
            <View style={[
              styles.stockBadge,
              producto.stock_total < 20 ? styles.lowStock : 
              producto.stock_total >= 100 ? styles.highStock : styles.mediumStock
            ]}>
              <Text style={styles.stockValue}>{producto.stock_total || 0}</Text>
              <Text style={styles.stockLabel}>Existencias Totales</Text>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ubicación:</Text>
            <Text style={styles.infoValue}>{producto.ubicacion}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Proveedor:</Text>
            <Text style={styles.infoValue}>{producto.proveedor}</Text>
          </View>
        </Card.Content>
      </Card>

      {producto.notas && (
        <Card style={styles.card}>
          <Card.Title title="Notas" />
          <Card.Content>
            <Text style={styles.notesText}>{producto.notas}</Text>
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Title title="Unidades de Medida" />
        <Card.Content>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Unidad</DataTable.Title>
              <DataTable.Title numeric>Factor</DataTable.Title>
              <DataTable.Title numeric>Precio</DataTable.Title>
              <DataTable.Title numeric>Costo</DataTable.Title>
              <DataTable.Title numeric>Stock</DataTable.Title>
              <DataTable.Title>Principal</DataTable.Title>
            </DataTable.Header>

            {(producto.unidades || []).map((unidad, index) => (
              <DataTable.Row key={index}>
                <DataTable.Cell>{unidad?.unidad_nombre || unidad?.nombre || unidad?.abreviatura || 'Sin nombre'}</DataTable.Cell>
                <DataTable.Cell numeric>{unidad?.factor_conversion || 1}</DataTable.Cell>
                <DataTable.Cell numeric>L.{parseFloat(unidad?.precio || 0).toFixed(2)}</DataTable.Cell>
                <DataTable.Cell numeric>L.{parseFloat(unidad?.costo || 0).toFixed(2)}</DataTable.Cell>
                <DataTable.Cell numeric>{unidad?.stock || 0}</DataTable.Cell>
                <DataTable.Cell>{unidad?.es_principal ? 'Sí' : 'No'}</DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Información Adicional" />
        <Card.Content>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha de creación:</Text>
            <Text style={styles.infoValue}>{producto.created_at ? new Date(producto.created_at).toLocaleDateString() : 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Última actualización:</Text>
            <Text style={styles.infoValue}>{producto.updated_at ? new Date(producto.updated_at).toLocaleDateString() : 'N/A'}</Text>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          icon="pencil"
          onPress={handleEdit}
          style={styles.editButton}
        >
          Editar Producto
        </Button>
        
        <Button
          mode="outlined"
          icon="delete"
          onPress={handleDelete}
          style={styles.deleteButton}
          textColor="red"
        >
          Eliminar
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
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  productCode: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  divider: {
    marginVertical: 10,
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
  stockContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  stockBadge: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    margin: 5,
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
  },
  lowStock: {
    backgroundColor: '#ffcccc',
  },
  mediumStock: {
    backgroundColor: '#ffffcc',
  },
  highStock: {
    backgroundColor: '#ccffcc',
  },
  stockValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  stockLabel: {
    fontSize: 12,
    color: '#555',
  },
  notesText: {
    fontStyle: 'italic',
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  editButton: {
    flex: 1,
    marginRight: 10,
  },
  deleteButton: {
    flex: 1,
    borderColor: 'red',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  productImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    resizeMode: 'cover',
  },
});

export default ProductoDetalleScreen;
