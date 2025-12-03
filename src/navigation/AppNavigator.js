import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

// Pantallas de autenticación
import LoginScreen from '../screens/auth/LoginScreen';

// Pantallas principales
import HomeScreen from '../screens/HomeScreen';
import ClientesScreen from '../screens/clientes/ClientesScreen';
import ClienteDetalleScreen from '../screens/clientes/ClienteDetalleScreen';
import NuevoClienteScreen from '../screens/clientes/NuevoClienteScreen';
import VentasScreen from '../screens/ventas/VentasScreen';
import NuevaVentaScreen from '../screens/ventas/NuevaVentaScreen';
import DetalleVentaScreen from '../screens/ventas/DetalleVentaScreen';
import DevolucionesScreen from '../screens/devoluciones/Devoluciones';
import NuevaDevolucionScreen from '../screens/devoluciones/NuevaDevolucionScreen';
import DetalleDevolucionScreen from '../screens/devoluciones/DetalleDevolucionScreenNew2';
import InventarioScreen from '../screens/inventario/InventarioScreen';
import ProductoDetalleScreen from '../screens/inventario/ProductoDetalleScreen';
import NuevoProductoScreen from '../screens/inventario/NuevoProductoScreen';
import EditarProductoScreen from '../screens/inventario/EditarProductoScreen';
import RutasScreen from '../screens/rutas/RutasScreen';
import NuevaRutaScreen from '../screens/rutas/NuevaRutaScreen';
import DetalleRutaScreen from '../screens/rutas/DetalleRutaScreen';
import EditarRutaScreen from '../screens/rutas/EditarRutaScreen';
import ProveedoresScreen from '../screens/proveedores/ProveedoresScreen';
import NuevoProveedorScreen from '../screens/proveedores/NuevoProveedorScreen';
import ProveedorDetalleScreen from '../screens/proveedores/ProveedorDetalleScreen';
import ReportesScreen from '../screens/reportes/ReportesScreen';
import ReporteGananciasScreen from '../screens/reportes/ReporteGananciasScreen';
import ReporteVentasProductoScreen from '../screens/reportes/ReporteVentasProductoScreen';
import ReporteVentasClienteScreen from '../screens/reportes/ReporteVentasClienteScreen';
import ReporteVentasVendedorScreen from '../screens/reportes/ReporteVentasVendedorScreen';
import ReporteInventarioScreen from '../screens/reportes/ReporteInventarioScreen';
import CierreScreen from '../screens/cierres/CierreScreen';
import NuevoCierreScreen from '../screens/cierres/NuevoCierreScreen';

// Pantallas de usuarios
import UsuariosScreen from '../screens/usuarios/UsuariosScreen';
import NuevoUsuarioScreen from '../screens/usuarios/NuevoUsuarioScreen';
import EditarUsuarioScreen from '../screens/usuarios/EditarUsuarioScreen';

// Pantallas de ajustes
import AjustesScreen from '../screens/ajustes/AjustesScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Navigator para clientes
const ClientesNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="ClientesList" component={ClientesScreen} options={{ title: 'Clientes' }} />
    <Stack.Screen name="ClienteDetalle" component={ClienteDetalleScreen} options={{ title: 'Detalle del Cliente' }} />
    <Stack.Screen name="NuevoCliente" component={NuevoClienteScreen} options={{ title: 'Nuevo Cliente' }} />
  </Stack.Navigator>
);

// Navigator para ventas
const VentasNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="VentasList" component={VentasScreen} options={{ title: 'Ventas' }} />
    <Stack.Screen name="NuevaVenta" component={NuevaVentaScreen} options={{ title: 'Nueva Venta' }} />
    <Stack.Screen name="DetalleVenta" component={DetalleVentaScreen} options={{ title: 'Detalle de Venta' }} />
    <Stack.Screen name="NuevaDevolucion" component={NuevaDevolucionScreen} options={{ title: 'Nueva Devolución' }} />
  </Stack.Navigator>
);

// Navigator para inventario
const InventarioNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="InventarioList" component={InventarioScreen} options={{ title: 'Inventario' }} />
    <Stack.Screen name="ProductoDetalle" component={ProductoDetalleScreen} options={{ title: 'Detalle del Producto' }} />
    <Stack.Screen name="NuevoProducto" component={NuevoProductoScreen} options={{ title: 'Nuevo Producto' }} />
    <Stack.Screen name="EditarProducto" component={EditarProductoScreen} options={{ title: 'Editar Producto' }} />
  </Stack.Navigator>
);

// Navigator para rutas
const RutasNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="RutasList" component={RutasScreen} options={{ title: 'Rutas' }} />
    <Stack.Screen name="NuevaRuta" component={NuevaRutaScreen} options={{ title: 'Nueva Ruta' }} />
    <Stack.Screen name="DetalleRuta" component={DetalleRutaScreen} options={{ title: 'Detalle de Ruta' }} />
    <Stack.Screen name="EditarRuta" component={EditarRutaScreen} options={{ title: 'Editar Ruta' }} />
  </Stack.Navigator>
);

// Navigator para devoluciones
const DevolucionesNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="DevolucionesList" component={DevolucionesScreen} options={{ title: 'Devoluciones' }} />
    <Stack.Screen name="DetalleDevolucion" component={DetalleDevolucionScreen} options={{ title: 'Detalle de Devolución' }} />
    <Stack.Screen name="NuevaDevolucion" component={NuevaDevolucionScreen} options={{ title: 'Nueva Devolución' }} />
  </Stack.Navigator>
);

// Navigator para reportes
const ReportesNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="ReportesList" component={ReportesScreen} options={{ title: 'Reportes' }} />
    <Stack.Screen name="ReporteGanancias" component={ReporteGananciasScreen} options={{ title: 'Reporte de Ganancias' }} />
    <Stack.Screen name="ReporteVentasProducto" component={ReporteVentasProductoScreen} options={{ title: 'Ventas por Producto' }} />
    <Stack.Screen name="ReporteVentasCliente" component={ReporteVentasClienteScreen} options={{ title: 'Ventas por Cliente' }} />
    <Stack.Screen name="ReporteVentasVendedor" component={ReporteVentasVendedorScreen} options={{ title: 'Ventas por Vendedor' }} />
    <Stack.Screen name="ReporteInventario" component={ReporteInventarioScreen} options={{ title: 'Reporte de Inventario' }} />
    <Stack.Screen name="ReporteCuentasCobrar" component={ReporteInventarioScreen} options={{ title: 'Cuentas por Cobrar' }} />
    <Stack.Screen name="Proveedores" component={ProveedoresScreen} options={{ title: 'Proveedores' }} />
    <Stack.Screen name="NuevoProveedor" component={NuevoProveedorScreen} options={{ title: 'Nuevo Proveedor' }} />
    <Stack.Screen name="ProveedorDetalle" component={ProveedorDetalleScreen} options={{ title: 'Detalle del Proveedor' }} />
    <Stack.Screen name="Cierres" component={CierreScreen} options={{ title: 'Cierres del Día' }} />
    <Stack.Screen name="NuevoCierre" component={NuevoCierreScreen} options={{ title: 'Nuevo Cierre' }} />
  </Stack.Navigator>
);

// Navigator para usuarios
const UsuariosNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="UsuariosList" component={UsuariosScreen} options={{ title: 'Usuarios' }} />
    <Stack.Screen name="NuevoUsuario" component={NuevoUsuarioScreen} options={{ title: 'Nuevo Usuario' }} />
    <Stack.Screen name="EditarUsuario" component={EditarUsuarioScreen} options={{ title: 'Editar Usuario' }} />
  </Stack.Navigator>
);

// Tab Navigator principal
const TabNavigator = () => {
  const { user } = useAuth();

  // Determinar si el usuario puede acceder a reportes
  const canAccessReports = user && (user.rol === 'admin' || user.rol === 'supervisor' || user.rol === 'gerente');

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Clientes') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Ventas') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Inventario') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Rutas') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Reportes') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'Devoluciones') {
            iconName = focused ? 'return-down-back' : 'return-down-back-outline';
          } else if (route.name === 'Ajustes') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Clientes" component={ClientesNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Ventas" component={VentasNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Devoluciones" component={DevolucionesNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Inventario" component={InventarioNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Rutas" component={RutasNavigator} options={{ headerShown: false }} />
      {canAccessReports && (
        <Tab.Screen name="Reportes" component={ReportesNavigator} options={{ headerShown: false }} />
      )}
      <Tab.Screen name="Ajustes" component={AjustesScreen} options={{ headerShown: true, title: 'Ajustes' }} />
    </Tab.Navigator>
  );
};

// Navigator principal
const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // O una pantalla de carga
  }

  // Determinar si el usuario puede gestionar usuarios
  const canManageUsers = user && (user.rol === 'admin' || user.rol === 'supervisor');

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          {canManageUsers && (
            <Stack.Screen name="Usuarios" component={UsuariosNavigator} />
          )}
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
