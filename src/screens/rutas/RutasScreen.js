import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, Searchbar, ActivityIndicator, Chip, Divider } from 'react-native-paper';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const RutasScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [searchQuery, setSearchQuery] = useState('');
  const [rutas, setRutas] = useState([]);
  const [filteredRutas, setFilteredRutas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('todas');

  // Función para calcular la próxima visita basada en los días programados
  const calcularProximaVisita = (diasVisita) => {
    if (!diasVisita || !Array.isArray(diasVisita) || diasVisita.length === 0) {
      return null;
    }

    const diasSemana = {
      'lunes': 1,
      'martes': 2,
      'miercoles': 3,
      'jueves': 4,
      'viernes': 5,
      'sabado': 6,
      'domingo': 0
    };

    const hoy = new Date();
    const diaActual = hoy.getDay(); // 0 = domingo, 1 = lunes, etc.
    
    // Convertir días de visita a números
    const diasNumeros = diasVisita.map(dia => diasSemana[dia.toLowerCase()]).filter(num => num !== undefined);
    
    // Buscar el próximo día de visita
    let proximoDia = null;
    
    // Primero buscar en los días restantes de esta semana
    for (let i = diaActual + 1; i <= 6; i++) {
      if (diasNumeros.includes(i)) {
        proximoDia = i;
        break;
      }
    }
    
    // Si no encontró en esta semana, buscar desde domingo de la próxima semana
    if (proximoDia === null) {
      for (let i = 0; i <= 6; i++) {
        if (diasNumeros.includes(i)) {
          proximoDia = i;
          break;
        }
      }
    }
    
    if (proximoDia === null) return null;
    
    // Calcular la fecha de la próxima visita
    const proximaVisita = new Date(hoy);
    const diasHastaProxima = proximoDia >= diaActual ? proximoDia - diaActual : (7 - diaActual) + proximoDia;
    proximaVisita.setDate(hoy.getDate() + diasHastaProxima);
    
    return proximaVisita.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  };

  const loadRutas = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
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
        if (rutaDetallada.usuario_nombre) {
          vendedorNombre = rutaDetallada.usuario_nombre;
        } else if (ruta.usuario_nombre) {
          vendedorNombre = ruta.usuario_nombre;
        }
        
        // 3. Determinar el total de clientes
        let totalClientes = 0;
        if (rutaDetallada.clientes && Array.isArray(rutaDetallada.clientes)) {
          totalClientes = rutaDetallada.clientes.length;
        }

        // 4. Calcular próxima visita basada en dias_visita
        let proximaVisita = null;
        try {
          if (ruta.dias_visita) {
            const diasVisita = JSON.parse(ruta.dias_visita);
            proximaVisita = calcularProximaVisita(diasVisita);
          }
        } catch (error) {
          console.error('Error al parsear dias_visita:', error);
        }
        
        // 5. Log para verificar el procesamiento
        console.log(`Ruta ${ruta.id}: ${vendedorNombre}, ${totalClientes} clientes, próxima: ${proximaVisita}`);
        
        // 6. Crear objeto formateado para la vista
        rutasFormateadas.push({
          id: ruta.id,
          nombre: ruta.nombre,
          vendedor: vendedorNombre,
          clientes: totalClientes,
          estado: ruta.estado || 'activa',
          ultimaVisita: ruta.ultima_visita ? new Date(ruta.ultima_visita).toISOString().split('T')[0] : null,
          proximaVisita: proximaVisita,
          descripcion: ruta.descripcion,
          diasVisita: ruta.dias_visita
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

  // Cargar rutas al inicializar la pantalla
  useEffect(() => {
    loadRutas();
  }, []);

  // Escuchar cuando la pantalla reciba el foco y verificar parámetros
  useFocusEffect(
    React.useCallback(() => {
      // Verificar si se pasó el parámetro refresh
      if (route.params?.refresh) {
        console.log('Refrescando rutas después de crear nueva ruta');
        // No mostrar loader completo, solo refrescar datos
        loadRutas(false);
        
        // Limpiar el parámetro para evitar refrescar múltiples veces
        navigation.setParams({ refresh: undefined, newRutaId: undefined });
      }
    }, [route.params?.refresh])
  );

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
