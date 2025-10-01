import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Button, Searchbar, Chip, FAB, ActivityIndicator, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const CierreScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [cierres, setCierres] = useState([]);
  const [filteredCierres, setFilteredCierres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterEstado, setFilterEstado] = useState('todos'); // 'todos', 'completados', 'pendientes'
  
  useEffect(() => {
    loadCierres();
  }, []);
  
  useEffect(() => {
    aplicarFiltros();
  }, [searchQuery, filterEstado, cierres]);
  
  const loadCierres = async () => {
    try {
      setLoading(true);
      // Simular carga de datos desde API
      setTimeout(() => {
        // Datos de ejemplo para desarrollo
        const cierresEjemplo = [
          {
            id: '1',
            fecha: '2025-06-10',
            hora: '18:30',
            vendedor: 'Juan Pérez',
            totalVentas: 5250.75,
            totalDevoluciones: 150.50,
            totalNeto: 5100.25,
            estado: 'completado'
          },
          {
            id: '2',
            fecha: '2025-06-09',
            hora: '19:15',
            vendedor: 'María López',
            totalVentas: 4800.00,
            totalDevoluciones: 200.00,
            totalNeto: 4600.00,
            estado: 'completado'
          },
          {
            id: '3',
            fecha: '2025-06-08',
            hora: '18:45',
            vendedor: 'Carlos Rodríguez',
            totalVentas: 6100.50,
            totalDevoluciones: 0.00,
            totalNeto: 6100.50,
            estado: 'completado'
          },
          {
            id: '4',
            fecha: '2025-06-07',
            hora: '19:00',
            vendedor: 'Ana Martínez',
            totalVentas: 3850.25,
            totalDevoluciones: 125.75,
            totalNeto: 3724.50,
            estado: 'pendiente'
          },
          {
            id: '5',
            fecha: '2025-06-06',
            hora: '18:20',
            vendedor: 'Roberto Gómez',
            totalVentas: 5500.00,
            totalDevoluciones: 300.00,
            totalNeto: 5200.00,
            estado: 'completado'
          }
        ];
        
        setCierres(cierresEjemplo);
        setFilteredCierres(cierresEjemplo);
        setLoading(false);
        setRefreshing(false);
      }, 1000);
    } catch (error) {
      console.error('Error al cargar cierres:', error);
      setLoading(false);
      setRefreshing(false);
      Alert.alert('Error', 'No se pudieron cargar los cierres');
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    loadCierres();
  };
  
  const aplicarFiltros = () => {
    let cierresFiltrados = [...cierres];
    
    // Filtrar por estado
    if (filterEstado !== 'todos') {
      cierresFiltrados = cierresFiltrados.filter(
        cierre => cierre.estado === filterEstado
      );
    }
    
    // Filtrar por búsqueda
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      cierresFiltrados = cierresFiltrados.filter(
        cierre => 
          cierre.fecha.toLowerCase().includes(searchLower) ||
          cierre.vendedor.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredCierres(cierresFiltrados);
  };
  
  const handleSearch = (query) => {
    setSearchQuery(query);
  };
  
  const handleFilterChange = (estado) => {
    setFilterEstado(estado);
  };
  
  const navigateToDetalle = (cierreId) => {
    navigation.navigate('DetalleCierre', { cierreId });
  };
  
  const navigateToNuevoCierre = () => {
    navigation.navigate('NuevoCierre');
  };
  
  const renderCierreItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigateToDetalle(item.id)}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.fechaText}>{item.fecha}</Text>
              <Text style={styles.vendedorText}>{item.vendedor}</Text>
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
              <Text style={[styles.montoValue, styles.devolucionesValue]}>
                L. {item.totalDevoluciones.toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.montoItem}>
              <Text style={styles.montoLabel}>Total Neto</Text>
              <Text style={[styles.montoValue, styles.netoValue]}>
                L. {item.totalNeto.toFixed(2)}
              </Text>
            </View>
          </View>
          
          <View style={styles.cardFooter}>
            <Text style={styles.horaText}>Hora: {item.hora}</Text>
            <Button 
              mode="text" 
              onPress={() => navigateToDetalle(item.id)}
              icon="chevron-right"
              contentStyle={styles.verDetalleButton}
            >
              Ver detalle
            </Button>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar por fecha o vendedor"
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filtrar por:</Text>
        <View style={styles.chipContainer}>
          <Chip
            selected={filterEstado === 'todos'}
            onPress={() => handleFilterChange('todos')}
            style={styles.filterChip}
          >
            Todos
          </Chip>
          <Chip
            selected={filterEstado === 'completado'}
            onPress={() => handleFilterChange('completado')}
            style={styles.filterChip}
          >
            Completados
          </Chip>
          <Chip
            selected={filterEstado === 'pendiente'}
            onPress={() => handleFilterChange('pendiente')}
            style={styles.filterChip}
          >
            Pendientes
          </Chip>
        </View>
      </View>
      
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loaderText}>Cargando cierres...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCierres}
          keyExtractor={(item) => item.id}
          renderItem={renderCierreItem}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#cccccc" />
              <Text style={styles.emptyText}>No se encontraron cierres</Text>
              <Button mode="contained" onPress={loadCierres}>
                Recargar
              </Button>
            </View>
          }
        />
      )}
      
      <FAB
        style={styles.fab}
        icon="plus"
        label="Nuevo Cierre"
        onPress={navigateToNuevoCierre}
      />
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
    elevation: 2,
  },
  filterContainer: {
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 14,
    marginBottom: 5,
    color: '#555',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  listContainer: {
    paddingBottom: 80,
  },
  card: {
    marginBottom: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
    height: 30,
  },
  chipCompletado: {
    backgroundColor: '#ccffcc',
  },
  chipPendiente: {
    backgroundColor: '#ffffcc',
  },
  divider: {
    marginVertical: 10,
  },
  montoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  montoItem: {
    flex: 1,
    alignItems: 'center',
  },
  montoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  montoValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  devolucionesValue: {
    color: '#f44336',
  },
  netoValue: {
    color: '#4caf50',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  horaText: {
    fontSize: 12,
    color: '#666',
  },
  verDetalleButton: {
    flexDirection: 'row-reverse',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#007bff',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 20,
  },
});

export default CierreScreen;
