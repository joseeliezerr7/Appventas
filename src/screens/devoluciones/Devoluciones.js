import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { Text, Card, Searchbar, ActivityIndicator, Button, Chip, FAB } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const DevolucionesScreen = () => {
  const navigation = useNavigation();
  const [devoluciones, setDevoluciones] = useState([]);
  const [filteredDevoluciones, setFilteredDevoluciones] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setError] = useState(null);
  const [filterActive, setFilterActive] = useState('todas'); // todas, hoy, semana, mes

  const loadDevoluciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Cargar devoluciones desde la API
      const devolucionesData = await api.getDevoluciones();
      console.log('Devoluciones cargadas desde la API:', devolucionesData.length);
      
      setDevoluciones(devolucionesData);
      applyFilters(devolucionesData, searchQuery, filterActive);
    } catch (error) {
      console.error('Error al cargar devoluciones:', error);
      setError('No se pudieron cargar las devoluciones');
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
        (item.cliente_nombre && item.cliente_nombre.toLowerCase().includes(lowercaseQuery)) ||
        (item.id && item.id.toString().toLowerCase().includes(lowercaseQuery)) ||
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
        
        const itemDate = new Date(item.fecha);
        
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
      <>
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
      </>
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
                <Text style={styles.devolucionId}>Devolución #{item.id}</Text>
                <Text style={styles.clienteText}>
                  {item.cliente_nombre || 'Cliente no especificado'}
                </Text>
              </View>
              <Text style={styles.totalValue}>L. {parseFloat(item.total || 0).toFixed(2)}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.footerRow}>
              <Text style={styles.fecha}>{item.fecha ? new Date(item.fecha).toLocaleDateString() : ''}</Text>
              <Text style={styles.itemsCount}>{cantidadItems} productos</Text>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>No se encontraron devoluciones</Text>
    </View>
  );
  
  const navigateToNuevaDevolucion = () => {
    navigation.navigate('NuevaDevolucion');
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar devolución..."
        onChangeText={onChangeSearch}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderFilterChips()}
        </ScrollView>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Cargando devoluciones...</Text>
        </View>
      ) : (
        <>
          {errorMsg ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
              <Text style={styles.errorText}>{errorMsg}</Text>
              <Button 
                mode="contained" 
                onPress={onRefresh} 
                style={styles.retryButton}
              >
                Reintentar
              </Button>
            </View>
          ) : (
            <FlatList
              data={filteredDevoluciones}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderDevolucionItem}
              contentContainerStyle={styles.listContainer}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007bff']} />
              }
              ListEmptyComponent={renderEmptyList}
            />
          )}
          <FAB
            style={styles.fab}
            icon="plus"
            onPress={navigateToNuevaDevolucion}
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
  card: {
    marginBottom: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  devolucionId: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  clienteText: {
    color: '#666',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fecha: {
    color: '#666',
    fontSize: 12,
  },
  itemsCount: {
    fontSize: 12,
    color: '#666',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066cc',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryButton: {
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#007bff',
  },
});

export default DevolucionesScreen;
