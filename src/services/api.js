import AsyncStorage from '@react-native-async-storage/async-storage';

// Opciones de URL para diferentes entornos
const API_URLS = {
  localhost: 'http://localhost:3001/api',
  emulator: 'http://10.0.2.2:3001/api',  // Para emuladores Android
  device: 'http://192.168.1.100:3001/api'  // Cambia esto a la IP de tu computadora en la red
};

// Usa la URL del emulador por defecto, cambia según sea necesario
const API_URL = API_URLS.emulator;

// Reemplaza la IP anterior con la dirección IP de tu computadora en la red local
// Puedes encontrarla ejecutando 'ipconfig' en Windows o 'ifconfig' en macOS/Linux

const fetchWithToken = async (url, options = {}) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log(`Usando token: ${token.substring(0, 10)}...`);
    } else {
      console.log('No se encontró token de autenticación');
    }
    
    console.log(`Realizando petición a: ${API_URL}${url}`);
    
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers,
    });
    
    // Intentamos parsear la respuesta como JSON
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.log('Respuesta no JSON:', text);
      data = { message: text };
    }
    
    if (!response.ok) {
      const errorMessage = data.message || `Error ${response.status}: ${response.statusText}`;
      console.error(`Error API (${response.status}):`, errorMessage);
      throw new Error(errorMessage);
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    // Mejorar los mensajes de error para problemas comunes
    if (error.message === 'Network request failed') {
      throw new Error('No se pudo conectar al servidor. Verifica tu conexión a internet y que el servidor esté en funcionamiento.');
    }
    
    throw error;
  }
};

const api = {
  // Autenticación
  login: async (email, password) => {
    console.log(`Intentando iniciar sesión con: ${email}`);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });
      
      console.log('Respuesta del servidor:', response.status);
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error de inicio de sesión:', data.message);
        throw new Error(data.message || 'Error al iniciar sesión');
      }
      
      console.log('Inicio de sesión exitoso:', data.user.email);
      return data;
    } catch (error) {
      console.error('Error en la petición de login:', error);
      throw error;
    }
  },
  
  // Clientes
  getClientes: () => fetchWithToken('/clientes'),
  getClienteVentas: (clienteId) => fetchWithToken(`/clientes/${clienteId}/ventas`),
  createCliente: async (clienteData) => {
    console.log('Creando cliente con datos:', clienteData);
    try {
      const response = await fetchWithToken('/clientes', {
        method: 'POST',
        body: JSON.stringify(clienteData),
      });
      console.log('Respuesta de creación de cliente:', response);
      return response;
    } catch (error) {
      console.error('Error al crear cliente:', error);
      throw error;
    }
  },
  updateCliente: async (id, clienteData) => {
    console.log(`Actualizando cliente ID ${id} con datos:`, clienteData);
    try {
      const response = await fetchWithToken(`/clientes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(clienteData),
      });
      console.log('Respuesta de actualización de cliente:', response);
      return response;
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      throw error;
    }
  },
  
  deleteCliente: async (id) => {
    console.log(`Eliminando cliente ID ${id}`);
    try {
      const response = await fetchWithToken(`/clientes/${id}`, {
        method: 'DELETE',
      });
      console.log('Respuesta de eliminación de cliente:', response);
      return response;
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      throw error;
    }
  },
  
  // Productos
  getProductos: async () => {
    console.log('Obteniendo lista de productos');
    try {
      const response = await fetchWithToken('/productos');
      console.log('Productos obtenidos:', response);
      return response;
    } catch (error) {
      console.error('Error al obtener productos:', error);
      throw error;
    }
  },
  
  getProducto: async (id) => {
    console.log(`Obteniendo producto con ID: ${id}`);
    try {
      const response = await fetchWithToken(`/productos/${id}`);
      console.log('Respuesta de producto:', response);
      return response;
    } catch (error) {
      console.error(`Error al obtener producto ${id}:`, error);
      throw error;
    }
  },
  
  getProductoUnidades: async (id) => {
    console.log(`Obteniendo unidades del producto con ID: ${id}`);
    try {
      const response = await fetchWithToken(`/productos/${id}/unidades`);
      console.log('Respuesta de unidades del producto:', response);
      return response;
    } catch (error) {
      console.error(`Error al obtener unidades del producto ${id}:`, error);
      throw error;
    }
  },
  
  createProducto: async (productoData) => {
    console.log('Creando producto con datos:', productoData);
    try {
      const response = await fetchWithToken('/productos', {
        method: 'POST',
        body: JSON.stringify(productoData),
      });
      console.log('Respuesta de creación de producto:', response);
      return response;
    } catch (error) {
      console.error('Error al crear producto:', error);
      throw error;
    }
  },
  
  updateProducto: async (id, productoData) => {
    console.log(`Actualizando producto ID ${id} con datos:`, JSON.stringify(productoData));
    try {
      // Asegurarse de que el ID sea un número
      const numericId = parseInt(id);
      if (isNaN(numericId)) {
        throw new Error(`ID de producto inválido: ${id}`);
      }
      
      // Realizar la petición al servidor
      const response = await fetchWithToken(`/productos/${numericId}`, {
        method: 'PUT',
        body: JSON.stringify(productoData),
      });
      
      console.log('Respuesta de actualización de producto:', response);
      return response;
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      throw error;
    }
  },
  
  // Actualizar una unidad específica de un producto
  updateUnidadProducto: async (productoId, unidadId, unidadData) => {
    console.log(`Actualizando unidad ${unidadId} del producto ${productoId}:`, JSON.stringify(unidadData));
    try {
      const response = await fetchWithToken(`/productos/${productoId}/unidades/${unidadId}`, {
        method: 'PUT',
        body: JSON.stringify(unidadData),
      });
      console.log(`Respuesta de actualización de unidad ${unidadId}:`, response);
      return response;
    } catch (error) {
      console.error(`Error al actualizar unidad ${unidadId}:`, error);
      throw error;
    }
  },
  
  // Crear una nueva unidad para un producto
  createUnidadProducto: async (productoId, unidadData) => {
    console.log(`Creando nueva unidad para producto ${productoId}:`, JSON.stringify(unidadData));
    try {
      const response = await fetchWithToken(`/productos/${productoId}/unidades`, {
        method: 'POST',
        body: JSON.stringify(unidadData),
      });
      console.log('Respuesta de creación de unidad:', response);
      return response;
    } catch (error) {
      console.error('Error al crear unidad:', error);
      throw error;
    }
  },
  
  // Obtener todas las categorías
  getCategorias: async () => {
    console.log('Obteniendo categorías');
    try {
      const response = await fetchWithToken('/categorias');
      console.log('Categorías obtenidas:', response);
      return response;
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      throw error;
    }
  },
  
  // Crear una nueva categoría
  createCategoria: async (categoriaData) => {
    console.log('Creando nueva categoría:', JSON.stringify(categoriaData));
    try {
      const response = await fetchWithToken('/categorias', {
        method: 'POST',
        body: JSON.stringify(categoriaData),
      });
      console.log('Respuesta de creación de categoría:', response);
      return response;
    } catch (error) {
      console.error('Error al crear categoría:', error);
      throw error;
    }
  },
  
  deleteProducto: async (id) => {
    console.log(`Eliminando producto ID ${id}`);
    try {
      const response = await fetchWithToken(`/productos/${id}`, {
        method: 'DELETE',
      });
      console.log('Respuesta de eliminación de producto:', response);
      return response;
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      throw error;
    }
  },
  
  // Unidades de Medida
  getUnidadesMedida: async () => {
    console.log('Obteniendo unidades de medida');
    try {
      const response = await fetchWithToken('/unidades-medida');
      console.log('Unidades de medida obtenidas:', response);
      return response;
    } catch (error) {
      console.error('Error al obtener unidades de medida:', error);
      throw error;
    }
  },
  
  createUnidadMedida: async (unidadData) => {
    console.log('Creando unidad de medida con datos:', unidadData);
    try {
      const response = await fetchWithToken('/unidades-medida', {
        method: 'POST',
        body: JSON.stringify(unidadData),
      });
      console.log('Respuesta de creación de unidad de medida:', response);
      return response;
    } catch (error) {
      console.error('Error al crear unidad de medida:', error);
      throw error;
    }
  },
  
  // Proveedores
  getProveedores: () => fetchWithToken('/proveedores'),
  createProveedor: (proveedorData) => {
    return fetchWithToken('/proveedores', {
      method: 'POST',
      body: JSON.stringify(proveedorData),
    });
  },
  
  // Ventas
  getVentas: () => fetchWithToken('/ventas'),
  getVenta: (id) => fetchWithToken(`/ventas/${id}`),
  createVenta: (ventaData) => {
    return fetchWithToken('/ventas', {
      method: 'POST',
      body: JSON.stringify(ventaData),
    });
  },
  cancelarVenta: (id) => {
    return fetchWithToken(`/ventas/${id}/cancelar`, {
      method: 'PUT'
    });
  },
  
  // Devoluciones
  getDevoluciones: () => {
    console.log('Obteniendo devoluciones');
    return fetchWithToken('/devoluciones');
  },
  
  getDevolucion: (id) => {
    console.log(`Obteniendo devolución con ID: ${id}`);
    return fetchWithToken(`/devoluciones/${id}`);
  },
  
  createDevolucion: async (devolucionData) => {
    console.log('Creando devolución con datos:', devolucionData);
    
    // 1. Crear la devolución
    const devolucionResponse = await fetchWithToken('/devoluciones', {
      method: 'POST',
      body: JSON.stringify(devolucionData),
    });
    
    if (!devolucionResponse.id) {
      throw new Error('Error al crear la devolución: No se recibió ID de devolución');
    }
    
    // 2. Actualizar la venta (reducir el total y actualizar cantidades)
    try {
      await fetchWithToken(`/ventas/${devolucionData.venta_id}/actualizar-por-devolucion`, {
        method: 'PUT',
        body: JSON.stringify({
          items_devueltos: devolucionData.items,
          devolucion_id: devolucionResponse.id
        }),
      });
    } catch (error) {
      console.error('Error al actualizar la venta:', error);
      // No lanzamos error para no interrumpir el flujo, pero lo registramos
    }
    
    // 3. Actualizar el stock de los productos
    try {
      // Asegurarnos de que cada item tenga la información necesaria del producto y unidad
      const itemsConInfo = devolucionData.items.map(item => ({
        ...item,
        // Asegurarnos de que estos campos estén presentes
        producto_nombre: item.producto_nombre || 'Producto sin nombre',
        producto_codigo: item.producto_codigo || `PROD-${item.producto_id}`,
        producto_id: parseInt(item.producto_id),
        // Información de la unidad - siempre usar la unidad base (ID 1) para evitar problemas
        unidad_id: 1, // Usar siempre 1 como la unidad base para evitar problemas con unidades no existentes
        unidad_nombre: 'Unidad'
      }));
      
      console.log('Enviando items para actualizar stock:', JSON.stringify(itemsConInfo, null, 2));
      
      await fetchWithToken('/productos/actualizar-stock-por-devolucion', {
        method: 'PUT',
        body: JSON.stringify({
          items: itemsConInfo,
          devolucion_id: devolucionResponse.id,
          venta_id: devolucionData.venta_id // Añadimos el ID de la venta para poder obtener las unidades correctas
        }),
      });
    } catch (error) {
      console.error('Error al actualizar el stock:', error);
      // No lanzamos error para no interrumpir el flujo, pero lo registramos
    }
    
    return devolucionResponse;
  },
  
  // Cierres del día
  getCierres: () => fetchWithToken('/cierres'),
  createCierre: (cierreData) => {
    return fetchWithToken('/cierres', {
      method: 'POST',
      body: JSON.stringify(cierreData),
    });
  },
  
  // Reportes
  getVentasPorPeriodo: (fechaInicio, fechaFin) => {
    return fetchWithToken(`/reportes/ventas-por-periodo?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
  },
  getProductosMasVendidos: (fechaInicio, fechaFin) => {
    return fetchWithToken(`/reportes/productos-mas-vendidos?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
  },
  getInventarioBajo: () => fetchWithToken('/reportes/inventario-bajo'),
  
  // Rutas
  getRutas: () => fetchWithToken('/rutas'),
  getRuta: (id) => fetchWithToken(`/rutas/${id}`),
  createRuta: (rutaData) => {
    return fetchWithToken('/rutas', {
      method: 'POST',
      body: JSON.stringify(rutaData),
    });
  },
  updateRuta: (id, rutaData) => {
    return fetchWithToken(`/rutas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rutaData),
    });
  },
  deleteRuta: (id) => {
    return fetchWithToken(`/rutas/${id}`, {
      method: 'DELETE',
    });
  },
  
  // Visitas
  getVisitas() {
    return fetchWithToken('/visitas');
  },
  createVisita(visitaData) {
    return fetchWithToken('/visitas', {
      method: 'POST',
      body: JSON.stringify(visitaData)
    });
  },
  updateVisita(id, visitaData) {
    return fetchWithToken(`/visitas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(visitaData)
    });
  },
  
  // Usuarios
  getUsuarios() {
    return fetchWithToken('/usuarios');
  },
  getUsuario(id) {
    return fetchWithToken(`/usuarios/${id}`);
  },
  createUsuario(usuarioData) {
    return fetchWithToken('/usuarios', {
      method: 'POST',
      body: JSON.stringify(usuarioData)
    });
  },
  updateUsuario(id, usuarioData) {
    return fetchWithToken(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(usuarioData)
    });
  },
  deleteUsuario(id) {
    return fetchWithToken(`/usuarios/${id}`, {
      method: 'DELETE'
    });
  },
};

export default api;
