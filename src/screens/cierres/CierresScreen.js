import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, Searchbar, ActivityIndicator, Chip, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

const CierresScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [cierres, setCierres] = useState([]);
  const [filteredCierres, setFilteredCierres] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('todos');

  const loadCierres = useCallback(async () => {
    // Solo intentar cargar datos si el usuario está autenticado
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Llamada a la API real para obtener los cierres
      const cierresData = await api.getCierres();
      console.log('Cierres cargados desde la API:', cierresData);
      
      setCierres(cierresData);
      setFilteredCierres(cierresData);
    } catch (error) {
      console.error('Error al cargar cierres:', error);
      // Si hay un error, mostramos el mensaje en la consola sin interrumpir la experiencia
      console.log('Error al cargar los cierres:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadCierres();
  }, [loadCierres]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCierres();
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      applyFilters(filterType);
    } else {
      const filtered = cierres.filter(
        (cierre) =>
          cierre.fecha.includes(query) ||
          cierre.vendedor.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredCierres(filtered);
    }
  };

  const applyFilters = (type) => {
    setFilterType(type);
    let filtered = [...cierres];

    switch (type) {
      case 'completados':
        filtered = filtered.filter((cierre) => cierre.estado === 'completado');
        break;
      case 'pendientes':
        filtered = filtered.filter((cierre) => cierre.estado === 'pendiente');
        break;
      default:
        // 'todos' - no filter
        break;
    }

    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(
        (cierre) =>
          cierre.fecha.includes(searchQuery) ||
          cierre.vendedor.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredCierres(filtered);
  };

  const renderCierreItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('DetalleCierre', { cierreId: item.id })}
    >
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cierreHeader}>
            <View>
              <Text style={styles.fechaText}>{item.fecha} - {item.hora}</Text>
              <Text style={styles.vendedorText}>Vendedor: {item.vendedor}</Text>
            </View>
            <Chip 
              mode="outlined"
              style={[
                styles.estadoChip,
                item.estado === 'completado' ? styles.chipCompletado : styles.chipPendiente
              ]}
            >
              {item.estado === 'completado' ? 'Completado' : 'Pendiente'}
            </Chip>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.montoContainer}>
            <View style={styles.montoItem}>
              <Text style={styles.montoLabel}>Ventas</Text>
              <Text style={styles.montoValue}>L. {item.totalVentas.toFixed(2)}</Text>
            </View>
            <View style={styles.montoItem}>
              <Text style={styles.montoLabel}>Devoluciones</Text>
              <Text style={styles.montoValue}>-L. {item.totalDevoluciones.toFixed(2)}</Text>
            </View>
            <View style={styles.montoItem}>
              <Text style={styles.montoLabel}>Total Neto</Text>
              <Text style={[styles.montoValue, styles.montoTotal]}>L. {item.totalNeto.toFixed(2)}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  useEffect(() => {
    loadCierres();
    
    // Configurar opciones de navegación
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          style={{ marginRight: 16 }}
          onPress={() => navigation.navigate('NuevoCierre')}
        >
          <Ionicons name="add" size={24} color="#007bff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, loadCierres]);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Cierres de Caja</Text>
      </View>
      
      <Searchbar
        placeholder="Buscar por fecha o vendedor"
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
          selected={filterType === 'completados'}
          onPress={() => applyFilters('completados')}
          style={styles.filterChip}
        >
          Completados
        </Chip>
        <Chip
          selected={filterType === 'pendientes'}
          onPress={() => applyFilters('pendientes')}
          style={styles.filterChip}
        >
          Pendientes
        </Chip>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loaderText}>Cargando cierres de caja...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCierres}
          renderItem={renderCierreItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No se encontraron cierres de caja</Text>
            </View>
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
    padding: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
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
  cierreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  fechaText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  vendedorText: {
    fontSize: 14,
    color: '#666',
  },
  estadoChip: {
    height: 28,
  },
  chipCompletado: {
    backgroundColor: '#ccffcc',
  },
  chipPendiente: {
    backgroundColor: '#fff0cc',
  },
  divider: {
    marginVertical: 8,
  },
  montoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  montoItem: {
    alignItems: 'center',
  },
  montoLabel: {
    fontSize: 12,
    color: '#666',
  },
  montoValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  montoTotal: {
    color: '#0066cc',
    fontSize: 16,
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
    paddingBottom: 20,
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
});

export default CierresScreen;
