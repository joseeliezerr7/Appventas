import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView, Alert } from 'react-native';
import { Text, Card, Searchbar, ActivityIndicator, Chip, Divider, Badge, Button } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const DevolucionesScreen = () => {
  const navigation = useNavigation();
  const [devoluciones, setDevoluciones] = useState([]);
  const [filteredDevoluciones, setFilteredDevoluciones] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterActive, setFilterActive] = useState('todas'); // todas, hoy, semana, mes

  const loadDevoluciones = useCallback(async () => {
    try {
      setLoading(true);
      
      // En una implementación real, esto sería una llamada a la API
      // Por ahora simulamos una carga desde localStorage
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Intentar cargar las devoluciones del almacenamiento local
      let devolucionesData = [];
      
      try {
        // En una implementación real, esto vendría de AsyncStorage
        const storedDevoluciones = localStorage.getItem('devoluciones');
        if (storedDevoluciones) {
          devolucionesData = JSON.parse(storedDevoluciones);
        }
      } catch (storageError) {
        console.error('Error al cargar devoluciones del almacenamiento:', storageError);
      }
      
      // Si no hay devoluciones guardadas, usar datos de ejemplo
      if (!devolucionesData || devolucionesData.length === 0) {
        devolucionesData = [
          { 
            id: 'DEV-1686523200000', 
            venta_id: 5,
            cliente: { id: 1, nombre: 'Juan Pérez' }, 
            fecha: '11/06/2025',
            hora: '14:30:25', 
            total: 250.00,
            motivo: 'Producto defectuoso',
            items: [
              { producto: { nombre: 'Refresco Cola 600ml' }, cantidadDevolucion: 2, precio_unitario: 25.00 }
            ],
            estado: 'completada'
          },
          { 
            id: 'DEV-1686436800000', 
            venta_id: 3,
            cliente: { id: 3, nombre: 'Roberto Sánchez' }, 
            fecha: '10/06/2025',
            hora: '17:45:12', 
            total: 780.25,
            motivo: 'Cambio por otro producto',
            items: [
              { producto: { nombre: 'Agua Mineral 1L' }, cantidadDevolucion: 1, precio_unitario: 15.50 },
              { producto: { nombre: 'Snack Papas 150g' }, cantidadDevolucion: 3, precio_unitario: 18.25 }
            ],
            estado: 'completada'
          },
          { 
            id: 'DEV-1686350400000', 
            venta_id: 2,
            cliente: { id: 2, nombre: 'María González' }, 
            fecha: '09/06/2025',
            hora: '10:15:30', 
            total: 425.50,
            motivo: 'Cliente insatisfecho',
            items: [
              { producto: { nombre: 'Jugo Natural 500ml' }, cantidadDevolucion: 5, precio_unitario: 35.00 },
              { producto: { nombre: 'Pan Integral' }, cantidadDevolucion: 2, precio_unitario: 45.25 }
            ],
            estado: 'completada'
          },
        ];
      }
      
      setDevoluciones(devolucionesData);
      applyFilters(devolucionesData, searchQuery, filterActive);
    } catch (error) {
      console.error('Error al cargar devoluciones:', error);
      Alert.alert('Error', 'No se pudieron cargar las devoluciones');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, filterActive]);

  // Cargar devoluciones cada vez que la pantalla obtiene el foco
  useFocusEffect(
    useCallback(() => {
      loadDevoluciones();
    }, [loadDevoluciones])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDevoluciones();
  };

  const onChangeSearch = (query) => {
    setSearchQuery(query);
    applyFilters(devoluciones, query, filterActive);
  };

  const applyFilters = (data, query, filter) => {
    let filtered = [...data];
    
    // Aplicar filtro de búsqueda
    if (query) {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(item => 
        (item.cliente && item.cliente.nombre && item.cliente.nombre.toLowerCase().includes(lowercaseQuery)) ||
        (item.id && item.id.toLowerCase().includes(lowercaseQuery)) ||
        (item.motivo && item.motivo.toLowerCase().includes(lowercaseQuery))
      );
    }
    
    // Aplicar filtro de tiempo
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);
    
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);
    
    if (filter !== 'todas') {
      filtered = filtered.filter(item => {
        if (!item.fecha) return false;
        
        const itemDate = new Date(item.fecha.split('/').reverse().join('-'));
        
        switch (filter) {
          case 'hoy':
            return itemDate >= today;
          case 'semana':
            return itemDate >= oneWeekAgo;
          case 'mes':
            return itemDate >= oneMonthAgo;
          default:
            return true;
        }
      });
    }
    
    setFilteredDevoluciones(filtered);
  };

  const handleFilterChange = (filter) => {
    setFilterActive(filter);
    applyFilters(devoluciones, searchQuery, filter);
  };

  const renderFilterChips = () => {
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.filtersContainer}
      >
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
    );
  };

  const navigateToDetalleDevolucion = (devolucion) => {
    navigation.navigate('DetalleDevolucion', { devolucionId: devolucion.id });
  };

  const renderDevolucionItem = ({ item }) => {
    const cantidadItems = Array.isArray(item.items) ? item.items.length : (item.items || 0);
    
    return (
      <TouchableOpacity onPress={() => navigateToDetalleDevolucion(item)}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.devolucionId}>{item.id}</Text>
                <Text style={styles.fecha}>{item.fecha} {item.hora}</Text>
              </View>
              <Badge size={24} style={styles.badge}>{cantidadItems}</Badge>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.clienteRow}>
              <Ionicons name="person-outline" size={16} color="#555" />
              <Text style={styles.clienteText}>
                {item.cliente ? item.cliente.nombre : 'Cliente no especificado'}
              </Text>
            </View>
            
            <View style={styles.motivoRow}>
              <Ionicons name="information-circle-outline" size={16} color="#555" />
              <Text style={styles.motivoText} numberOfLines={1}>
                {item.motivo || 'Sin motivo especificado'}
              </Text>
            </View>
            
            <View style={styles.footerRow}>
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total devuelto:</Text>
                <Text style={styles.totalValue}>L. {parseFloat(item.total).toFixed(2)}</Text>
              </View>
              
              <View style={styles.ventaIdContainer}>
                <Text style={styles.ventaIdLabel}>Venta:</Text>
                <Text style={styles.ventaIdValue}>#{item.venta_id}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>No hay devoluciones registradas</Text>
      <Button 
        mode="contained" 
        onPress={() => navigation.navigate('VentasList')} 
        style={styles.emptyButton}
      >
        Ver Ventas
      </Button>
    </View>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar devolución..."
        onChangeText={onChangeSearch}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      {renderFilterChips()}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Cargando devoluciones...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDevoluciones}
          renderItem={renderDevolucionItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0066cc']}
            />
          }
        />
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
    margin: 10,
    elevation: 2,
  },
  filtersContainer: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  filterChip: {
    marginRight: 8,
  },
  listContainer: {
    padding: 10,
    paddingTop: 5,
    flexGrow: 1,
  },
  card: {
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  devolucionId: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  fecha: {
    color: '#666',
    fontSize: 12,
  },
  badge: {
    backgroundColor: '#0066cc',
  },
  divider: {
    marginVertical: 8,
  },
  clienteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  clienteText: {
    marginLeft: 5,
    fontSize: 14,
  },
  motivoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  motivoText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    marginRight: 5,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  ventaIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ventaIdLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 3,
  },
  ventaIdValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#555',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    marginTop: 10,
  },
});

export default DevolucionesScreen;
