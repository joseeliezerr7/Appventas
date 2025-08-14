import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, Searchbar, ActivityIndicator, Chip, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const ProveedoresScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [proveedores, setProveedores] = useState([]);
  const [filteredProveedores, setFilteredProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('todos');

  // Datos de ejemplo para desarrollo
  const proveedoresEjemplo = [
    { 
      id: 1, 
      nombre: 'Distribuidora ABC', 
      contacto: 'Juan Rodríguez', 
      telefono: '555-1234',
      email: 'contacto@abc.com',
      estado: 'activo',
      ultimaCompra: '2025-06-05',
      totalCompras: 25000.50,
      categoria: 'Bebidas'
    },
    { 
      id: 2, 
      nombre: 'Importadora XYZ', 
      contacto: 'María López', 
      telefono: '555-5678',
      email: 'contacto@xyz.com',
      estado: 'activo',
      ultimaCompra: '2025-06-10',
      totalCompras: 18750.75,
      categoria: 'Alimentos'
    },
    { 
      id: 3, 
      nombre: 'Productos Nacionales', 
      contacto: 'Roberto Gómez', 
      telefono: '555-9012',
      email: 'contacto@nacionales.com',
      estado: 'inactivo',
      ultimaCompra: '2025-04-20',
      totalCompras: 12500.00,
      categoria: 'Limpieza'
    },
    { 
      id: 4, 
      nombre: 'Distribuidora Global', 
      contacto: 'Ana Martínez', 
      telefono: '555-3456',
      email: 'contacto@global.com',
      estado: 'activo',
      ultimaCompra: '2025-06-08',
      totalCompras: 32000.25,
      categoria: 'Varios'
    },
    { 
      id: 5, 
      nombre: 'Mayorista Central', 
      contacto: 'Carlos Sánchez', 
      telefono: '555-7890',
      email: 'contacto@central.com',
      estado: 'activo',
      ultimaCompra: '2025-06-01',
      totalCompras: 28500.50,
      categoria: 'Alimentos'
    },
  ];

  const loadProveedores = () => {
    // Simular carga de datos desde API
    setTimeout(() => {
      setProveedores(proveedoresEjemplo);
      setFilteredProveedores(proveedoresEjemplo);
      setLoading(false);
      setRefreshing(false);
    }, 1000);
  };

  useEffect(() => {
    loadProveedores();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadProveedores();
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      applyFilters(filterType);
    } else {
      const filtered = proveedores.filter(
        (proveedor) =>
          proveedor.nombre.toLowerCase().includes(query.toLowerCase()) ||
          proveedor.contacto.toLowerCase().includes(query.toLowerCase()) ||
          proveedor.categoria.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProveedores(filtered);
    }
  };

  const applyFilters = (type) => {
    setFilterType(type);
    let filtered = [...proveedores];

    switch (type) {
      case 'activos':
        filtered = filtered.filter((proveedor) => proveedor.estado === 'activo');
        break;
      case 'inactivos':
        filtered = filtered.filter((proveedor) => proveedor.estado === 'inactivo');
        break;
      default:
        // 'todos' - no filter
        break;
    }

    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(
        (proveedor) =>
          proveedor.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          proveedor.contacto.toLowerCase().includes(searchQuery.toLowerCase()) ||
          proveedor.categoria.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProveedores(filtered);
  };

  const renderProveedorItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('DetalleProveedor', { proveedorId: item.id })}
    >
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.proveedorHeader}>
            <View>
              <Text style={styles.proveedorName}>{item.nombre}</Text>
              <Text style={styles.categoriaText}>Categoría: {item.categoria}</Text>
            </View>
            <Chip 
              mode="outlined"
              style={[
                styles.estadoChip,
                item.estado === 'activo' ? styles.chipActivo : styles.chipInactivo
              ]}
            >
              {item.estado === 'activo' ? 'Activo' : 'Inactivo'}
            </Chip>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>{item.contacto}</Text>
            <Text style={styles.contactDetails}>{item.telefono} | {item.email}</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.proveedorFooter}>
            <Text>Última compra: {item.ultimaCompra}</Text>
            <Text style={styles.totalText}>Total: ${item.totalCompras.toFixed(2)}</Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar por nombre, contacto o categoría"
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
          selected={filterType === 'activos'}
          onPress={() => applyFilters('activos')}
          style={styles.filterChip}
        >
          Activos
        </Chip>
        <Chip
          selected={filterType === 'inactivos'}
          onPress={() => applyFilters('inactivos')}
          style={styles.filterChip}
        >
          Inactivos
        </Chip>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loaderText}>Cargando proveedores...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={filteredProveedores}
            renderItem={renderProveedorItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No se encontraron proveedores</Text>
              </View>
            }
          />

          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate('NuevoProveedor')}
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
  proveedorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  proveedorName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoriaText: {
    fontSize: 14,
    color: '#666',
  },
  estadoChip: {
    height: 28,
  },
  chipActivo: {
    backgroundColor: '#ccffcc',
  },
  chipInactivo: {
    backgroundColor: '#ffcccc',
  },
  divider: {
    marginVertical: 8,
  },
  contactInfo: {
    marginBottom: 8,
  },
  contactName: {
    fontWeight: 'bold',
  },
  contactDetails: {
    fontSize: 13,
    color: '#666',
  },
  proveedorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalText: {
    fontWeight: 'bold',
    color: '#0066cc',
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

export default ProveedoresScreen;
