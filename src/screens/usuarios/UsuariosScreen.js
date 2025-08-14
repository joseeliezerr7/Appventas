import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, FAB, List, Divider, ActivityIndicator, Button, IconButton } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

const UsuariosScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usuarios, setUsuarios] = useState([]);

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
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Ya no necesitamos este useEffect inicial porque useFocusEffect lo reemplaza
  // y se ejecutará tanto al montar el componente como al volver a él
  
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
        
        {usuarios.length > 0 ? (
          <Card style={styles.card}>
            <Card.Content>
              {usuarios.map((usuario, index) => (
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
                  {index < usuarios.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No hay usuarios registrados</Text>
            <Button mode="outlined" onPress={handleNuevoUsuario}>
              Crear primer usuario
            </Button>
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
});

export default UsuariosScreen;
