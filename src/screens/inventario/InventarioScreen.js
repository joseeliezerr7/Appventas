import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Text, Card, Searchbar, ActivityIndicator, Chip, Divider, Menu, IconButton } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import productosApi from '../../services/productosApi';
const api = productosApi;

const InventarioScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [productos, setProductos] = useState([]);
  const [filteredProductos, setFilteredProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('todos');
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const loadProductos = useCallback(async () => {
    // Solo intentar cargar datos si el usuario está autenticado
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Llamada a la API real para obtener los productos
      const productosData = await api.getProductos();
      console.log('Productos cargados desde la API:', productosData);
      
      // Asegurarse de que cada producto tenga unidades
      const productosConUnidades = productosData.map(producto => {
        // Depurar información de categoría
        console.log('Datos del producto:', producto.id, producto.nombre);
        console.log('Categoría:', producto.categoria_id, producto.categoria_nombre);
        
        return {
          ...producto,
          unidades: producto.unidades || [],
          stock_total: producto.stock_total || 0
        };
      });
      
      setProductos(productosConUnidades);
      setFilteredProductos(productosConUnidades);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      // Si hay un error, mostramos el mensaje en la consola sin interrumpir la experiencia
      console.log('Error al cargar los productos:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Usar useFocusEffect para recargar los productos cada vez que la pantalla recibe el foco
  useFocusEffect(
    useCallback(() => {
      console.log('Pantalla de inventario enfocada, recargando productos...');
      if (user) {
        loadProductos();
      }
      return () => {
        // Cleanup si es necesario
      };
    }, [user, loadProductos])
  );
  
  useEffect(() => {
    // Configurar opciones de navegación
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          style={{ marginRight: 16 }}
          onPress={() => navigation.navigate('NuevoProducto')}
        >
          <Ionicons name="add" size={24} color="#007bff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProductos();
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      applyFilters(filterType);
    } else {
      const filtered = productos.filter(
        (producto) =>
          producto.nombre.toLowerCase().includes(query.toLowerCase()) ||
          producto.codigo.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProductos(filtered);
    }
  };

  const applyFilters = (type) => {
    setFilterType(type);
    let filtered = [...productos];

    switch (type) {
      case 'bajo_stock':
        filtered = filtered.filter((producto) => producto.stock_total < 20);
        break;
      case 'alto_stock':
        filtered = filtered.filter((producto) => producto.stock_total >= 100);
        break;
      default:
        // 'todos' - no filter
        break;
    }

    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(
        (producto) =>
          producto.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          producto.codigo.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProductos(filtered);
  };

  const handleDeleteProducto = (producto) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que deseas eliminar el producto "${producto.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await api.deleteProducto(producto.id);
              // Actualizar la lista de productos después de eliminar
              const updatedProductos = productos.filter(p => p.id !== producto.id);
              setProductos(updatedProductos);
              setFilteredProductos(updatedProductos.filter(p => {
                // Mantener los filtros actuales
                if (filterType === 'bajo_stock' && p.stock_total >= 20) return false;
                if (filterType === 'alto_stock' && p.stock_total < 100) return false;
                if (searchQuery.trim() !== '') {
                  return p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.codigo.toLowerCase().includes(searchQuery.toLowerCase());
                }
                return true;
              }));
              Alert.alert('Éxito', 'Producto eliminado correctamente');
            } catch (error) {
              console.error('Error al eliminar producto:', error);
              Alert.alert('Error', 'No se pudo eliminar el producto: ' + (error.message || 'Error desconocido'));
            } finally {
              setLoading(false);
            }
          } 
        }
      ]
    );
  };

  const renderProductoItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.productHeader}>
          <TouchableOpacity 
            style={{flex: 1}}
            onPress={() => navigation.navigate('ProductoDetalle', { productoId: item.id })}
          >
            <View>
              <Text style={styles.productName}>{item.nombre}</Text>
              <Text style={styles.productCode}>Código: {item.codigo}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.actionButtons}>
            {item.unidades && item.unidades.length > 0 && item.unidades.find(u => u.es_unidad_base) && (
              <Text style={styles.productPrice}>
                L.{parseFloat(item.unidades.find(u => u.es_unidad_base).precio || 0).toFixed(2)}
              </Text>
            )}
            <IconButton
              icon="dots-vertical"
              size={20}
              onPress={(event) => {
                const { pageX, pageY } = event.nativeEvent;
                setMenuPosition({ x: pageX, y: pageY });
                setSelectedProducto(item);
                setMenuVisible(true);
              }}
            />
          </View>
        </View>
        <Divider style={styles.divider} />
        <TouchableOpacity 
          onPress={() => navigation.navigate('ProductoDetalle', { productoId: item.id })}
        >
          <View style={styles.productFooter}>
            <Text>Categoría: {item.categoria_nombre || 'Sin categoría'}</Text>
            <View style={[
              styles.stockBadge,
              item.stock_total < 20 ? styles.lowStock : 
              item.stock_total >= 100 ? styles.highStock : styles.mediumStock
            ]}>
              <Text style={styles.stockText}>Stock: {item.stock_total || 0} {item.unidad_principal}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Card.Content>
      {menuVisible && selectedProducto && selectedProducto.id === item.id && (
        <Menu
          visible={true}
          onDismiss={() => setMenuVisible(false)}
          anchor={menuPosition}
        >
        <Menu.Item 
          onPress={() => {
            setMenuVisible(false);
            navigation.navigate('ProductoDetalle', { productoId: item.id });
          }} 
          title="Ver detalles" 
          leadingIcon="eye"
        />
        <Menu.Item 
          onPress={() => {
            setMenuVisible(false);
            navigation.navigate('EditarProducto', { producto: item });
          }} 
          title="Editar" 
          leadingIcon="pencil"
        />
        <Menu.Item 
          onPress={() => {
            setMenuVisible(false);
            handleDeleteProducto(item);
          }} 
          title="Eliminar" 
          leadingIcon="delete"
        />
        </Menu>
      )}
    </Card>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar producto por nombre o código"
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
      />

      <View style={styles.filterContainer}>
        <Chip
          selected={filterType === 'todos'}
          onPress={() => applyFilters('todos')}
          style={styles.filterChip}
        >
          Todos
        </Chip>
        <Chip
          selected={filterType === 'bajo_stock'}
          onPress={() => applyFilters('bajo_stock')}
          style={styles.filterChip}
        >
          Bajo stock
        </Chip>
        <Chip
          selected={filterType === 'alto_stock'}
          onPress={() => applyFilters('alto_stock')}
          style={styles.filterChip}
        >
          Alto stock
        </Chip>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loaderText}>Cargando inventario...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={filteredProductos}
            renderItem={renderProductoItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No se encontraron productos</Text>
              </View>
            }
          />

          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate('NuevoProducto')}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  searchBar: {
    marginBottom: 10,
    backgroundColor: 'white',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  filterChip: {
    marginRight: 8,
  },
  card: {
    marginBottom: 10,
    elevation: 2,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productCode: {
    fontSize: 12,
    color: '#666',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  divider: {
    marginVertical: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
  stockText: {
    fontSize: 12,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
  },
  listContainer: {
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#0066cc',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
});

export default InventarioScreen;
