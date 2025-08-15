import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { Text, Card, Searchbar, FAB, ActivityIndicator, Chip, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const VentasScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [ventas, setVentas] = useState([]);
  const [filteredVentas, setFilteredVentas] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterActive, setFilterActive] = useState('todas'); // todas, hoy, semana, mes

  const loadVentas = useCallback(async () => {
    // Solo intentar cargar datos si el usuario está autenticado
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Llamada a la API real para obtener las ventas
      const ventasData = await api.getVentas();
      console.log('Ventas cargadas desde la API:', ventasData);
      
      setVentas(ventasData);
      applyFilters(ventasData, searchQuery, filterActive);
    } catch (error) {
      console.error('Error al cargar ventas:', error);
      // Si hay un error, podemos mostrar un mensaje al usuario
      console.log('Error al cargar las ventas:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, searchQuery, filterActive]);

  useEffect(() => {
    loadVentas();
    
    // Configurar opciones de navegación
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          style={{ marginRight: 16 }}
          onPress={() => navigation.navigate('NuevaVenta')}
        >
          <Ionicons name="add" size={24} color="#007bff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, loadVentas]);

  const onRefresh = () => {
    setRefreshing(true);
    loadVentas();
  };

  const applyFilters = (data, query, filter) => {
    // Primero aplicamos el filtro de fecha
    let filtered = [...data];
    
    if (filter !== 'todas') {
      const today = new Date();
      const todayStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
      
      if (filter === 'hoy') {
        console.log('Filtrando ventas de hoy:', todayStr);
        filtered = data.filter(venta => venta.fecha.startsWith(todayStr));
      } else if (filter === 'semana') {
        // Calcular fecha de hace una semana
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        console.log('Filtrando ventas de la última semana');
        filtered = data.filter(venta => {
          const ventaDate = venta.fecha.split(' ')[0];
          const parts = ventaDate.split('/');
          const ventaDate2 = new Date(parts[2], parts[1] - 1, parts[0]);
          return ventaDate2 >= oneWeekAgo;
        });
      } else if (filter === 'mes') {
        console.log('Filtrando ventas del mes actual');
        filtered = data.filter(venta => {
          const ventaDate = venta.fecha.split(' ')[0];
          const parts = ventaDate.split('/');
          const ventaMonth = parseInt(parts[1]);
          const ventaYear = parseInt(parts[2]);
          return ventaMonth === today.getMonth() + 1 && ventaYear === today.getFullYear();
        });
      }
    }
    
    // Luego aplicamos la búsqueda
    if (query.trim() !== '') {
      filtered = filtered.filter(venta => {
        const clienteNombre = venta.cliente_nombre || (venta.cliente && venta.cliente.nombre) || '';
        return clienteNombre.toLowerCase().includes(query.toLowerCase()) ||
          venta.id.toString().includes(query) ||
          (venta.total !== undefined && venta.total.toString().includes(query));
      });
    }
    
    setFilteredVentas(filtered);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    applyFilters(ventas, query, filterActive);
  };

  const handleFilterChange = (filter) => {
    setFilterActive(filter);
    applyFilters(ventas, searchQuery, filter);
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'completada': return '#28a745';
      case 'cancelada': return '#dc3545';
      case 'pendiente': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'completada': return 'checkmark-circle';
      case 'cancelada': return 'close-circle';
      case 'pendiente': return 'time';
      default: return 'help-circle';
    }
  };

  const formatFecha = (fecha) => {
    const date = new Date(fecha);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Hoy ${date.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Ayer ${date.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('es-HN', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const renderVentaItem = ({ item }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('DetalleVenta', { venta: item })}
    >
      <Card style={styles.ventaCard}>
        <Card.Content>
          <View style={styles.ventaHeader}>
            <View style={styles.ventaInfo}>
              <View style={styles.ventaIdRow}>
                <Text style={styles.ventaId}>Venta #{item.id}</Text>
                <View style={[styles.estadoChip, { backgroundColor: getEstadoColor(item.estado) }]}>
                  <Ionicons 
                    name={getEstadoIcon(item.estado)} 
                    size={12} 
                    color="white" 
                    style={styles.estadoIcon}
                  />
                  <Text style={styles.estadoText}>{item.estado?.toUpperCase() || 'DESCONOCIDO'}</Text>
                </View>
              </View>
              <Text style={styles.ventaCliente}>
                <Ionicons name="person" size={14} color="#666" /> {item.cliente_nombre || 'Cliente desconocido'}
              </Text>
              {item.vendedor_nombre && (
                <Text style={styles.ventaVendedor}>
                  <Ionicons name="business" size={14} color="#666" /> {item.vendedor_nombre}
                </Text>
              )}
            </View>
            <View style={styles.ventaTotalContainer}>
              <Text style={styles.ventaTotal}>L. {parseFloat(item.total).toFixed(2)}</Text>
              <Text style={styles.metodoPago}>
                <Ionicons name={item.metodo_pago === 'efectivo' ? 'cash' : 'card'} size={12} color="#666" /> 
                {item.metodo_pago?.toUpperCase() || 'EFECTIVO'}
              </Text>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.ventaFooter}>
            <Text style={styles.ventaFecha}>
              <Ionicons name="calendar" size={12} color="#888" /> {formatFecha(item.fecha)}
            </Text>
            <Text style={styles.ventaItems}>
              <Ionicons name="cube" size={12} color="#888" /> {parseInt(item.total_productos || 0)} productos
            </Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar venta..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip 
            selected={filterActive === 'todas'} 
            onPress={() => handleFilterChange('todas')}
            style={styles.filterChip}
          >
            Todas
          </Chip>
          <Chip 
            selected={filterActive === 'hoy'} 
            onPress={() => handleFilterChange('hoy')}
            style={styles.filterChip}
          >
            Hoy
          </Chip>
          <Chip 
            selected={filterActive === 'semana'} 
            onPress={() => handleFilterChange('semana')}
            style={styles.filterChip}
          >
            Esta semana
          </Chip>
          <Chip 
            selected={filterActive === 'mes'} 
            onPress={() => handleFilterChange('mes')}
            style={styles.filterChip}
          >
            Este mes
          </Chip>
        </ScrollView>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Cargando ventas...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={filteredVentas}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderVentaItem}
            contentContainerStyle={styles.listContainer}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="cart-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No se encontraron ventas</Text>
              </View>
            }
          />
          
          <FAB
            style={styles.fab}
            icon="plus"
            onPress={() => navigation.navigate('NuevaVenta')}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    margin: 8,
    elevation: 2,
  },
  filtersContainer: {
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  listContainer: {
    padding: 8,
  },
  ventaCard: {
    elevation: 2,
    marginBottom: 2,
  },
  ventaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ventaInfo: {
    flex: 1,
    marginRight: 10,
  },
  ventaIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ventaId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  estadoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  estadoIcon: {
    marginRight: 3,
  },
  estadoText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  ventaCliente: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ventaVendedor: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ventaTotalContainer: {
    alignItems: 'flex-end',
  },
  ventaTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 2,
  },
  metodoPago: {
    fontSize: 11,
    color: '#666',
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    marginVertical: 8,
  },
  ventaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ventaFecha: {
    fontSize: 12,
    color: '#888',
  },
  ventaItems: {
    fontSize: 12,
    color: '#888',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    marginTop: 10,
    color: '#888',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#007bff',
  },
});

export default VentasScreen;
