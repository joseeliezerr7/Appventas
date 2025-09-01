import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, Title, Paragraph, Button, Avatar, Divider, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// Función para formatear fechas de forma amigable
const formatearFecha = (fecha) => {
  if (!fecha) return '';
  
  const ahora = new Date();
  const fechaObj = new Date(fecha);
  
  // Si es hoy
  if (fechaObj.toDateString() === ahora.toDateString()) {
    return `Hoy ${fechaObj.getHours().toString().padStart(2, '0')}:${fechaObj.getMinutes().toString().padStart(2, '0')}`;
  }
  
  // Si es ayer
  const ayer = new Date(ahora);
  ayer.setDate(ahora.getDate() - 1);
  if (fechaObj.toDateString() === ayer.toDateString()) {
    return `Ayer ${fechaObj.getHours().toString().padStart(2, '0')}:${fechaObj.getMinutes().toString().padStart(2, '0')}`;
  }
  
  // Si es de esta semana
  const diffDias = Math.floor((ahora - fechaObj) / (1000 * 60 * 60 * 24));
  if (diffDias < 7) {
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return `${diasSemana[fechaObj.getDay()]} ${fechaObj.getHours().toString().padStart(2, '0')}:${fechaObj.getMinutes().toString().padStart(2, '0')}`;
  }
  
  // Si es de otro momento
  return `${fechaObj.getDate()}/${fechaObj.getMonth() + 1}/${fechaObj.getFullYear()}`;
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user, logout, checkTokenValidity } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    ventasHoy: 0,
    clientesTotal: 0,
    productosInventarioBajo: 0,
    rutasHoy: 0,
    ventasRecientes: [],
    rutaActual: null
  });

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Obtener datos reales desde la API
      const ventasPromise = api.getVentas();
      const clientesPromise = api.getClientes();
      const productosPromise = api.getProductos();
      const rutasPromise = api.getRutas();
      
      // Ejecutar todas las llamadas en paralelo
      const [ventas, clientes, productos, rutas] = await Promise.all([
        ventasPromise,
        clientesPromise,
        productosPromise,
        rutasPromise
      ]);
      
      // Filtrar ventas de hoy
      const hoy = new Date();
      const ventasHoy = ventas.filter(venta => {
        const fechaVenta = new Date(venta.fecha);
        return fechaVenta.toDateString() === hoy.toDateString();
      });
      
      // Filtrar productos con inventario bajo
      const productosBajos = productos.filter(producto => {
        return producto.stock < producto.stock_minimo;
      });
      
      // Filtrar rutas de hoy
      const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
      const diaHoy = diasSemana[hoy.getDay()];
      const rutasHoy = rutas.filter(ruta => {
        // Comprobar si la ruta tiene programación para hoy
        if (!ruta.dias_visita) return false;
        let diasVisita = [];
        try {
          // Intentar parsear dias_visita si es string
          if (typeof ruta.dias_visita === 'string') {
            diasVisita = JSON.parse(ruta.dias_visita);
          } else {
            diasVisita = ruta.dias_visita;
          }
        } catch (e) {
          console.error('Error al parsear dias_visita:', e);
          return false;
        }
        
        // Verificar si el día de hoy está en los días de visita
        return Array.isArray(diasVisita) && diasVisita.includes(diaHoy);
      });
      
      // Obtener las 3 ventas más recientes con datos de cliente
      const ventasRecientes = ventas
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 3)
        .map(venta => {
          // Buscar el cliente asociado a la venta
          const cliente = clientes.find(c => c.id === venta.cliente_id) || { nombre: 'Cliente desconocido' };
          return {
            id: venta.id,
            clienteNombre: cliente.nombre,
            total: venta.total || 0,
            fecha: new Date(venta.fecha)
          };
        });
      
      // Obtener la primera ruta de hoy con sus detalles
      let rutaActual = null;
      if (rutasHoy.length > 0) {
        const primeraRuta = rutasHoy[0];
        // Obtener clientes de la ruta
        const clientesRuta = primeraRuta.clientes || [];
        const totalClientes = clientesRuta.length;
        
        // En una implementación real, aquí obtendríamos las visitas completadas
        // Por ahora simulamos un progreso
        const visitasCompletadas = Math.floor(Math.random() * (totalClientes + 1));
        
        rutaActual = {
          id: primeraRuta.id,
          nombre: primeraRuta.nombre,
          fecha: new Date().toLocaleDateString(),
          totalClientes,
          visitasCompletadas
        };
      }
      
      setDashboardData({
        ventasHoy: ventasHoy.length,
        clientesTotal: clientes.length,
        productosInventarioBajo: productosBajos.length,
        rutasHoy: rutasHoy.length,
        ventasRecientes,
        rutaActual
      });
      
      console.log('Dashboard data cargada correctamente');
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
      
      // Si es un error de autenticación, cerrar sesión automáticamente
      if (error.isAuthError) {
        console.log('Error de autenticación detectado, cerrando sesión...');
        logout();
        return;
      }
      
      // Si hay error, usar datos de respaldo
      setDashboardData({
        ventasHoy: 0,
        clientesTotal: 0,
        productosInventarioBajo: 0,
        rutasHoy: 0
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Verificar la validez del token antes de cargar datos
    const initializeScreen = async () => {
      const isTokenValid = await checkTokenValidity();
      if (isTokenValid) {
        loadDashboardData();
      }
    };
    
    initializeScreen();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    const isTokenValid = await checkTokenValidity();
    if (isTokenValid) {
      loadDashboardData();
    } else {
      setRefreshing(false);
    }
  };

  const navigateTo = (screen, params = {}) => {
    navigation.navigate(screen, params);
  };

  const renderQuickAction = (icon, title, screen, color = '#007bff') => (
    <TouchableOpacity 
      style={styles.quickActionItem} 
      onPress={() => navigateTo(screen)}
    >
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color="white" />
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Bienvenido,</Text>
          <Text style={styles.userName}>{user?.name || 'Usuario'}</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Avatar.Icon size={40} icon="logout" backgroundColor="#f0f0f0" color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Title style={styles.statValue}>{dashboardData.ventasHoy}</Title>
            <Paragraph style={styles.statLabel}>Ventas Hoy</Paragraph>
          </Card.Content>
        </Card>
        
        <Card style={styles.statCard}>
          <Card.Content>
            <Title style={styles.statValue}>{dashboardData.clientesTotal}</Title>
            <Paragraph style={styles.statLabel}>Clientes</Paragraph>
          </Card.Content>
        </Card>
        
        <Card style={styles.statCard}>
          <Card.Content>
            <Title style={styles.statValue}>{dashboardData.productosInventarioBajo}</Title>
            <Paragraph style={styles.statLabel}>Productos Bajos</Paragraph>
          </Card.Content>
        </Card>
        
        <Card style={styles.statCard}>
          <Card.Content>
            <Title style={styles.statValue}>{dashboardData.rutasHoy}</Title>
            <Paragraph style={styles.statLabel}>Rutas Hoy</Paragraph>
          </Card.Content>
        </Card>
      </View>

      <Card style={styles.sectionCard}>
        <Card.Title title="Acciones Rápidas" />
        <Card.Content>
          <View style={styles.quickActionsContainer}>
            {renderQuickAction('cart', 'Nueva Venta', 'Ventas', '#4CAF50')}
            {renderQuickAction('person-add', 'Nuevo Cliente', 'Clientes', '#2196F3')}
            {renderQuickAction('map', 'Nueva Ruta', 'Rutas', '#FF9800')}
            {renderQuickAction('cube', 'Inventario', 'Inventario', '#9C27B0')}
            {renderQuickAction('people', 'Usuarios', 'Usuarios', '#E91E63')}
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.sectionCard}>
        <Card.Title title="Ventas Recientes" />
        <Card.Content>
          {dashboardData.ventasRecientes && dashboardData.ventasRecientes.length > 0 ? (
            dashboardData.ventasRecientes.map((venta, index) => (
              <React.Fragment key={venta.id || index}>
                <View style={styles.listItem}>
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemTitle}>Cliente: {venta.clienteNombre}</Text>
                    <Text style={styles.listItemSubtitle}>Total: ${(venta.total !== undefined && venta.total !== null) ? parseFloat(venta.total).toFixed(2) : '0.00'}</Text>
                  </View>
                  <Text style={styles.listItemDate}>
                    {formatearFecha(venta.fecha)}
                  </Text>
                </View>
                {index < dashboardData.ventasRecientes.length - 1 && <Divider style={styles.divider} />}
              </React.Fragment>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No hay ventas recientes</Text>
            </View>
          )}
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => navigateTo('Ventas')}>Ver todas las ventas</Button>
        </Card.Actions>
      </Card>

      <Card style={styles.sectionCard}>
        <Card.Title title="Ruta de Hoy" />
        <Card.Content>
          {dashboardData.rutaActual ? (
            <View style={styles.routeContainer}>
              <View style={styles.routeHeader}>
                <Text style={styles.routeName}>{dashboardData.rutaActual.nombre} - {dashboardData.rutaActual.fecha}</Text>
                <Text style={styles.routeClients}>{dashboardData.rutaActual.totalClientes} clientes</Text>
              </View>
              
              <View style={styles.routeProgress}>
                <View style={styles.progressBar}>
                  <View 
                    style={[styles.progressFill, { 
                      width: dashboardData.rutaActual.totalClientes > 0 
                        ? `${(dashboardData.rutaActual.visitasCompletadas / dashboardData.rutaActual.totalClientes) * 100}%` 
                        : '0%' 
                    }]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {dashboardData.rutaActual.visitasCompletadas} de {dashboardData.rutaActual.totalClientes} completados
                </Text>
              </View>
              
              <Button 
                mode="contained" 
                onPress={() => navigateTo('DetalleRuta', { rutaId: dashboardData.rutaActual.id })}
                style={styles.routeButton}
              >
                Continuar Ruta
              </Button>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No hay rutas programadas para hoy</Text>
              <Button 
                mode="outlined" 
                onPress={() => navigateTo('Rutas')}
                style={styles.emptyStateButton}
              >
                Ver todas las rutas
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 15,
    textAlign: 'center',
  },
  emptyStateButton: {
    marginTop: 10,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 8,
  },
  statCard: {
    width: '48%',
    marginBottom: 10,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  sectionCard: {
    margin: 8,
    elevation: 2,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  listItemSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  listItemDate: {
    fontSize: 12,
    color: '#999',
  },
  divider: {
    marginVertical: 8,
  },
  routeContainer: {
    padding: 8,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  routeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  routeClients: {
    fontSize: 14,
    color: '#666',
  },
  routeProgress: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 4,
  },
  progressFill: {
    height: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  routeButton: {
    marginTop: 8,
  },
});

export default HomeScreen;
