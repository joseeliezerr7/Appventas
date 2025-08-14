import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, Searchbar, ActivityIndicator, Chip, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const RutasScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [rutas, setRutas] = useState([]);
  const [filteredRutas, setFilteredRutas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('todas');

  const loadRutas = async () => {
    try {
      // Obtener datos del backend
      const data = await api.getRutas();
      console.log('Rutas cargadas:', data.length);
      console.log('Datos completos de rutas:', JSON.stringify(data, null, 2));
      
      // Formatear los datos para la vista
      const rutasFormateadas = [];
      
      // Procesar cada ruta y obtener datos adicionales si es necesario
      for (const ruta of data) {
        console.log(`Procesando ruta ${ruta.id}...`);
        
        // 1. Obtener datos detallados de la ruta (incluye vendedor y total de clientes)
        let rutaDetallada;
        try {
          // Intentar obtener datos detallados de la ruta
          rutaDetallada = await api.getRuta(ruta.id);
          console.log(`Datos detallados de ruta ${ruta.id}:`, rutaDetallada);
        } catch (error) {
          console.error(`Error al obtener detalles de ruta ${ruta.id}:`, error);
          rutaDetallada = ruta; // Usar datos básicos si falla
        }
        
        // 2. Determinar el nombre del vendedor
        let vendedorNombre = 'Sin asignar';
        if (rutaDetallada.vendedor_nombre) {
          vendedorNombre = rutaDetallada.vendedor_nombre;
        }
        
        // 3. Determinar el total de clientes
        let totalClientes = 0;
        if (rutaDetallada.total_clientes !== undefined && rutaDetallada.total_clientes !== null) {
          totalClientes = parseInt(rutaDetallada.total_clientes) || 0;
        }
        
        // 4. Verificar si el total de clientes es un número válido
        if (isNaN(totalClientes)) {
          console.log(`Ruta ${ruta.id}: total_clientes no es un número válido, usando 0`);
          totalClientes = 0;
        }
        
        // 5. Log detallado para depuración
        console.log(`Ruta ${ruta.id} procesada:`, {
          id: ruta.id,
          nombre: ruta.nombre,
          vendedor_nombre: rutaDetallada.vendedor_nombre,
          vendedor_procesado: vendedorNombre,
          total_clientes: rutaDetallada.total_clientes,
          total_procesado: totalClientes
        });
        
        // 6. Crear objeto formateado para la vista
        rutasFormateadas.push({
          id: ruta.id,
          nombre: ruta.nombre,
          vendedor: vendedorNombre,
          clientes: totalClientes,
          estado: ruta.estado || 'activa',
          ultimaVisita: ruta.ultima_visita ? new Date(ruta.ultima_visita).toISOString().split('T')[0] : null,
          proximaVisita: ruta.proxima_visita ? new Date(ruta.proxima_visita).toISOString().split('T')[0] : null,
          descripcion: ruta.descripcion
        });
      }
      
      setRutas(rutasFormateadas);
      setFilteredRutas(rutasFormateadas);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error al cargar rutas:', error);
      setLoading(false);
      setRefreshing(false);
      // Si hay un error, mostrar algunas rutas de ejemplo para desarrollo
      const rutasEjemplo = [
        { 
          id: 1, 
          nombre: 'Ruta Norte (ejemplo)', 
          vendedor: 'Juan Pérez', 
          clientes: 12, 
          estado: 'activa',
          ultimaVisita: '2025-06-10',
          proximaVisita: '2025-06-17'
        },
        { 
          id: 2, 
          nombre: 'Ruta Sur (ejemplo)', 
          vendedor: 'María López', 
          clientes: 8, 
          estado: 'activa',
          ultimaVisita: '2025-06-08',
          proximaVisita: '2025-06-15'
        }
      ];
      setRutas(rutasEjemplo);
      setFilteredRutas(rutasEjemplo);
    }
  };

  useEffect(() => {
    loadRutas();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadRutas();
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      applyFilters(filterType);
    } else {
      const filtered = rutas.filter(
        (ruta) =>
          ruta.nombre.toLowerCase().includes(query.toLowerCase()) ||
          ruta.vendedor.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredRutas(filtered);
    }
  };

  const applyFilters = (type) => {
    setFilterType(type);
    let filtered = [...rutas];

    switch (type) {
      case 'activas':
        filtered = filtered.filter((ruta) => ruta.estado === 'activa');
        break;
      case 'inactivas':
        filtered = filtered.filter((ruta) => ruta.estado === 'inactiva');
        break;
      default:
        // 'todas' - no filter
        break;
    }

    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(
        (ruta) =>
          ruta.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ruta.vendedor.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredRutas(filtered);
  };

  const renderRutaItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('DetalleRuta', { rutaId: item.id })}
    >
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.rutaHeader}>
            <View>
              <Text style={styles.rutaName}>{item.nombre}</Text>
              <Text style={styles.vendedorName}>Vendedor: {item.vendedor}</Text>
            </View>
            <Chip 
              mode="outlined"
              style={[
                styles.estadoChip,
                item.estado === 'activa' ? styles.chipActiva : styles.chipInactiva
              ]}
            >
              {item.estado === 'activa' ? 'Activa' : 'Inactiva'}
            </Chip>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.rutaFooter}>
            <Text>Clientes: {item.clientes}</Text>
            <Text>
              Próxima visita: {item.proximaVisita || 'No programada'}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar ruta por nombre o vendedor"
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
      />

      <View style={styles.filterContainer}>
        <Chip
          selected={filterType === 'todas'}
          onPress={() => applyFilters('todas')}
          style={styles.filterChip}
        >
          Todas
        </Chip>
        <Chip
          selected={filterType === 'activas'}
          onPress={() => applyFilters('activas')}
          style={styles.filterChip}
        >
          Activas
        </Chip>
        <Chip
          selected={filterType === 'inactivas'}
          onPress={() => applyFilters('inactivas')}
          style={styles.filterChip}
        >
          Inactivas
        </Chip>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loaderText}>Cargando rutas...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={filteredRutas}
            renderItem={renderRutaItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No se encontraron rutas</Text>
              </View>
            }
          />

          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate('NuevaRuta')}
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
  rutaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  rutaName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  vendedorName: {
    fontSize: 14,
    color: '#666',
  },
  estadoChip: {
    height: 28,
  },
  chipActiva: {
    backgroundColor: '#ccffcc',
  },
  chipInactiva: {
    backgroundColor: '#ffcccc',
  },
  divider: {
    marginVertical: 8,
  },
  rutaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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

export default RutasScreen;
