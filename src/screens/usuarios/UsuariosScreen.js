import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, FAB, List, Divider, ActivityIndicator, Button, IconButton, Searchbar, Chip } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const UsuariosScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('todos'); // todos, admin, vendedor, supervisor, gerente

  // Verificar permisos de acceso
  const canManageUsers = user && (user.rol === 'admin' || user.rol === 'supervisor');

  // Si el usuario no tiene permisos, mostrar mensaje de acceso denegado
  if (!canManageUsers) {
    return (
      <View style={styles.accessDeniedContainer}>
        <Ionicons name="lock-closed-outline" size={80} color="#999" />
        <Text style={styles.accessDeniedTitle}>Acceso Restringido</Text>
        <Text style={styles.accessDeniedText}>
          No tienes permisos para gestionar usuarios.
        </Text>
        <Text style={styles.accessDeniedText}>
          Contacta al administrador si necesitas acceso.
        </Text>
      </View>
    );
  }

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      
      // Verificar si hay token de autenticación
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.log('No hay token de autenticación. Redirigiendo a login...');
        Alert.alert(
          'Sesión expirada',
          'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
        return;
      }
      
      // Obtener usuarios desde la API
      const usuariosData = await api.getUsuarios();
      
      // Verificar si se obtuvo una respuesta válida
      if (Array.isArray(usuariosData)) {
        console.log('Usuarios cargados correctamente:', usuariosData.length);
        setUsuarios(usuariosData);
        setFilteredUsuarios(usuariosData);
      } else {
        console.error('Formato de respuesta inválido:', usuariosData);
        Alert.alert('Error', 'Formato de datos inválido');
        
        // Usar datos de ejemplo como respaldo en caso de error
        const usuariosEjemplo = [
          { id: 1, nombre: 'Juan Pérez', email: 'juan@ejemplo.com', rol: 'vendedor', activo: true },
          { id: 2, nombre: 'María López', email: 'maria@ejemplo.com', rol: 'admin', activo: true },
          { id: 3, nombre: 'Carlos Gómez', email: 'carlos@ejemplo.com', rol: 'vendedor', activo: false },
          { id: 4, nombre: 'Ana Rodríguez', email: 'ana@ejemplo.com', rol: 'supervisor', activo: true },
        ];
        setUsuarios(usuariosEjemplo);
        setFilteredUsuarios(usuariosEjemplo);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      
      // Verificar si es un error de autenticación
      if (error.message && (error.message.includes('401') || error.message.includes('403'))) {
        Alert.alert(
          'Error de autenticación',
          'Tu sesión ha expirado o no tienes permisos para ver esta información. Por favor, inicia sesión nuevamente.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        Alert.alert('Error', 'No se pudieron cargar los usuarios: ' + (error.message || 'Error desconocido'));
        
        // Usar datos de ejemplo como respaldo en caso de error
        const usuariosEjemplo = [
          { id: 1, nombre: 'Juan Pérez', email: 'juan@ejemplo.com', rol: 'vendedor', activo: true },
          { id: 2, nombre: 'María López', email: 'maria@ejemplo.com', rol: 'admin', activo: true },
          { id: 3, nombre: 'Carlos Gómez', email: 'carlos@ejemplo.com', rol: 'vendedor', activo: false },
          { id: 4, nombre: 'Ana Rodríguez', email: 'ana@ejemplo.com', rol: 'supervisor', activo: true },
        ];
        setUsuarios(usuariosEjemplo);
        setFilteredUsuarios(usuariosEjemplo);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Actualizar filtros cuando cambie la lista de usuarios
  useEffect(() => {
    filterUsuarios();
  }, [usuarios]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recargar usuarios cuando la pantalla obtiene el foco (al iniciar o regresar de otra pantalla)
  useFocusEffect(
    useCallback(() => {
      console.log('Pantalla de usuarios en foco, cargando datos...');
      cargarUsuarios();
      
      // Función de limpieza (si es necesaria)
      return () => {
        // Limpiar cualquier suscripción si es necesario
      };
    }, []) // eslint-disable-line react-hooks/exhaustive-deps
  );

  const onRefresh = () => {
    setRefreshing(true);
    cargarUsuarios();
  };

  // Función para filtrar usuarios basado en búsqueda y filtro de rol
  const filterUsuarios = (searchText = searchQuery, roleFilter = selectedFilter) => {
    let filtered = usuarios;

    // Filtrar por rol si no es "todos"
    if (roleFilter !== 'todos') {
      filtered = filtered.filter(usuario => usuario.rol === roleFilter);
    }

    // Filtrar por texto de búsqueda
    if (searchText.trim() !== '') {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(usuario =>
        usuario.nombre.toLowerCase().includes(searchLower) ||
        usuario.email.toLowerCase().includes(searchLower) ||
        usuario.rol.toLowerCase().includes(searchLower)
      );
    }

    setFilteredUsuarios(filtered);
  };

  // Manejar cambio en el texto de búsqueda
  const handleSearchChange = (query) => {
    setSearchQuery(query);
    filterUsuarios(query, selectedFilter);
  };

  // Manejar cambio en el filtro de rol
  const handleRoleFilterChange = (role) => {
    setSelectedFilter(role);
    filterUsuarios(searchQuery, role);
  };

  // Limpiar búsqueda
  const clearSearch = () => {
    setSearchQuery('');
    setSelectedFilter('todos');
    setFilteredUsuarios(usuarios);
  };

  const handleEditarUsuario = (usuario) => {
    // Verificar que el usuario tenga todos los datos necesarios
    console.log('Datos del usuario a editar:', usuario);
    
    if (!usuario || !usuario.id) {
      console.error('Datos de usuario inválidos:', usuario);
      Alert.alert('Error', 'No se pueden editar los datos del usuario porque están incompletos');
      return;
    }
    
    // Navegar a la pantalla de edición con los datos del usuario
    navigation.navigate('EditarUsuario', { usuario });
  };

  const handleEliminarUsuario = (id) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar este usuario?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              // Llamar a la API para eliminar el usuario
              await api.deleteUsuario(id);
              // Actualizar la lista de usuarios
              setUsuarios(usuarios.filter(user => user.id !== id));
              Alert.alert('Éxito', 'Usuario eliminado correctamente');
            } catch (error) {
              console.error('Error al eliminar usuario:', error);
              Alert.alert('Error', 'No se pudo eliminar el usuario: ' + (error.message || 'Error desconocido'));
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleNuevoUsuario = () => {
    navigation.navigate('NuevoUsuario');
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Cargando usuarios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>Gestión de Usuarios</Text>

        {/* Barra de búsqueda */}
        <Searchbar
          placeholder="Buscar por nombre, email o rol"
          onChangeText={handleSearchChange}
          value={searchQuery}
          style={styles.searchBar}
          icon="magnify"
          clearIcon="close"
          onIconPress={() => {}}
          onClearIconPress={clearSearch}
        />

        {/* Filtros por rol */}
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>Filtrar por rol:</Text>
          <View style={styles.chipContainer}>
            <Chip
              selected={selectedFilter === 'todos'}
              onPress={() => handleRoleFilterChange('todos')}
              style={styles.chip}
              textStyle={selectedFilter === 'todos' ? styles.selectedChipText : styles.chipText}
            >
              Todos ({usuarios.length})
            </Chip>
            <Chip
              selected={selectedFilter === 'admin'}
              onPress={() => handleRoleFilterChange('admin')}
              style={styles.chip}
              textStyle={selectedFilter === 'admin' ? styles.selectedChipText : styles.chipText}
            >
              Admin ({usuarios.filter(u => u.rol === 'admin').length})
            </Chip>
            <Chip
              selected={selectedFilter === 'supervisor'}
              onPress={() => handleRoleFilterChange('supervisor')}
              style={styles.chip}
              textStyle={selectedFilter === 'supervisor' ? styles.selectedChipText : styles.chipText}
            >
              Supervisor ({usuarios.filter(u => u.rol === 'supervisor').length})
            </Chip>
            <Chip
              selected={selectedFilter === 'gerente'}
              onPress={() => handleRoleFilterChange('gerente')}
              style={styles.chip}
              textStyle={selectedFilter === 'gerente' ? styles.selectedChipText : styles.chipText}
            >
              Gerente ({usuarios.filter(u => u.rol === 'gerente').length})
            </Chip>
            <Chip
              selected={selectedFilter === 'vendedor'}
              onPress={() => handleRoleFilterChange('vendedor')}
              style={styles.chip}
              textStyle={selectedFilter === 'vendedor' ? styles.selectedChipText : styles.chipText}
            >
              Vendedor ({usuarios.filter(u => u.rol === 'vendedor').length})
            </Chip>
          </View>
        </View>

        {/* Información de resultados */}
        <Text style={styles.resultsInfo}>
          Mostrando {filteredUsuarios.length} de {usuarios.length} usuarios
        </Text>

        {filteredUsuarios.length > 0 ? (
          <Card style={styles.card}>
            <Card.Content>
              {filteredUsuarios.map((usuario, index) => (
                <React.Fragment key={usuario.id}>
                  <List.Item
                    title={usuario.nombre}
                    description={`${usuario.email} - ${usuario.rol}`}
                    left={props => <List.Icon {...props} icon="account" />}
                    right={props => (
                      <View style={styles.actionButtons}>
                        <IconButton
                          icon="pencil"
                          size={20}
                          onPress={() => handleEditarUsuario(usuario)}
                        />
                        <IconButton
                          icon="delete"
                          size={20}
                          color="#FF5252"
                          onPress={() => handleEliminarUsuario(usuario.id)}
                        />
                      </View>
                    )}
                    titleStyle={usuario.activo ? styles.usuarioActivo : styles.usuarioInactivo}
                  />
                  {index < filteredUsuarios.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.emptyState}>
            {usuarios.length === 0 ? (
              <>
                <Text style={styles.emptyStateText}>No hay usuarios registrados</Text>
                <Button mode="outlined" onPress={handleNuevoUsuario}>
                  Crear primer usuario
                </Button>
              </>
            ) : (
              <>
                <Text style={styles.emptyStateText}>
                  No se encontraron usuarios que coincidan con tu búsqueda
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Intenta con otros términos o limpia los filtros
                </Text>
                <Button mode="outlined" onPress={clearSearch} icon="filter-remove">
                  Limpiar filtros
                </Button>
              </>
            )}
          </View>
        )}
      </ScrollView>
      
      <FAB
        style={styles.fab}
        icon="plus"
        label="Nuevo Usuario"
        onPress={handleNuevoUsuario}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 40,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#0066cc',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usuarioActivo: {
    fontWeight: 'bold',
  },
  usuarioInactivo: {
    fontWeight: 'normal',
    color: '#888',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 20,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
  // Estilos para búsqueda y filtros
  searchBar: {
    marginBottom: 16,
    elevation: 2,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 12,
  },
  selectedChipText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  resultsInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
});

export default UsuariosScreen;
