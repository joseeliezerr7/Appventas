import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, Searchbar, FAB, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const ClientesScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadClientes = useCallback(async () => {
    // Solo intentar cargar datos si el usuario está autenticado
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Llamada a la API real para obtener los clientes
      const clientesData = await api.getClientes();
      console.log('Clientes cargados desde la API:', clientesData);
      
      setClientes(clientesData);
      setFilteredClientes(clientesData);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      // Si hay un error, podemos mostrar un mensaje al usuario sin interrumpir la experiencia
      console.log('Error al cargar los clientes:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Efecto para configurar el listener de enfoque para recargar datos cuando la pantalla vuelve a estar activa
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('ClientesScreen está en foco - recargando datos');
      loadClientes();
    });
    
    return unsubscribe;
  }, [navigation, loadClientes]);
  
  useEffect(() => {
    loadClientes();
    
    // Configurar opciones de navegación
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          style={{ marginRight: 16 }}
          onPress={() => navigation.navigate('NuevoCliente')}
        >
          <Ionicons name="add" size={24} color="#007bff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, loadClientes]);

  const onRefresh = () => {
    setRefreshing(true);
    loadClientes();
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setFilteredClientes(clientes);
    } else {
      const filtered = clientes.filter(cliente => 
        cliente.nombre.toLowerCase().includes(query.toLowerCase()) ||
        cliente.telefono.includes(query) ||
        cliente.email.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredClientes(filtered);
    }
  };

  const renderClienteItem = ({ item }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('ClienteDetalle', { cliente: item })}
    >
      <Card style={styles.clienteCard}>
        <Card.Content>
          <View style={styles.clienteHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {item.nombre.split(' ').map(n => n[0]).join('').toUpperCase()}
              </Text>
            </View>
            <View style={styles.clienteInfo}>
              <Text style={styles.clienteName}>{item.nombre}</Text>
              <Text style={styles.clienteContact}>{item.telefono}</Text>
              <Text style={styles.clienteAddress} numberOfLines={1}>{item.direccion}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar cliente..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Cargando clientes...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={filteredClientes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderClienteItem}
            contentContainerStyle={styles.listContainer}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No se encontraron clientes</Text>
              </View>
            }
          />
          
          <FAB
            style={styles.fab}
            icon="plus"
            onPress={() => navigation.navigate('NuevoCliente')}
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
  listContainer: {
    padding: 8,
  },
  clienteCard: {
    elevation: 2,
  },
  clienteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  clienteInfo: {
    flex: 1,
  },
  clienteName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  clienteContact: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  clienteAddress: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
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

export default ClientesScreen;
