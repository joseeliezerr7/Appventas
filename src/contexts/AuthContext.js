import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verificar si hay un token guardado
    const loadStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('userToken');
        
        if (storedUser && token) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.log('Error al cargar usuario:', e);
      } finally {
        setLoading(false);
      }
    };
    
    loadStoredUser();
  }, []);

  // Constante para habilitar el modo de desarrollo offline
  const DEV_MODE = false; // Usando autenticación real con el servidor

  const login = async (username, password) => {
    try {
      setError(null);
      setLoading(true);
      
      // Si estamos en modo de desarrollo, simular una autenticación exitosa
      if (DEV_MODE) {
        console.log('Modo de desarrollo activado: Simulando inicio de sesión exitoso');
        
        // Usuario simulado para desarrollo
        const mockUser = {
          id: 1,
          email: username,
          nombre: 'Usuario de Prueba',
          rol: 'admin'
        };
        
        const mockToken = 'dev-token-12345';
        
        await AsyncStorage.setItem('userToken', mockToken);
        await AsyncStorage.setItem('user', JSON.stringify(mockUser));
        
        setUser(mockUser);
        return true;
      }
      
      // Código normal para producción
      const response = await api.login(username, password);
      
      await AsyncStorage.setItem('userToken', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      
      setUser(response.user);
      return true;
    } catch (e) {
      console.error('Error de inicio de sesión:', e);
      setError(e.message || 'Error al iniciar sesión');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (e) {
      console.log('Error al cerrar sesión:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext;
