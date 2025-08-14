import AsyncStorage from '@react-native-async-storage/async-storage';

// Opciones de URL para diferentes entornos
const API_URLS = {
  localhost: 'http://localhost:3001/api',
  emulator: 'http://10.0.2.2:3001/api',  // Para emuladores Android
  device: 'http://192.168.1.100:3001/api'  // Cambia esto a la IP de tu computadora en la red
};

// Usa la URL del emulador por defecto
const API_URL = API_URLS.emulator;

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

// Exportamos un objeto con todas las funciones necesarias para la pantalla de edición de productos
const productosApi = {
  // Productos
  getProductos: async () => {
    console.log('Obteniendo lista de productos');
    try {
      const response = await fetchWithToken('/productos');
      console.log(`Se obtuvieron ${response.length} productos`);
      
      // Depurar datos de categoría
      response.forEach(producto => {
        console.log(`Producto ${producto.id} - ${producto.nombre}:`);
        console.log(`  categoria_id: ${producto.categoria_id}`);
        console.log(`  categoria_nombre: ${producto.categoria_nombre}`);
      });
      
      // Asegurarse de que cada producto tenga el nombre de categoría
      const productosConCategorias = response.map(producto => {
        // Si el producto tiene categoria_id pero no tiene categoria_nombre, buscar el nombre
        if (producto.categoria_id && !producto.categoria_nombre) {
          // Asignar un nombre de categoría basado en el ID conocido
          switch(producto.categoria_id) {
            case 1: producto.categoria_nombre = 'Bebidas'; break;
            case 2: producto.categoria_nombre = 'Snacks'; break;
            case 3: producto.categoria_nombre = 'Lácteos'; break;
            case 4: producto.categoria_nombre = 'Limpieza'; break;
            case 5: producto.categoria_nombre = 'Cuidado Personal'; break;
            case 7: producto.categoria_nombre = 'Alimentos'; break;
            default: producto.categoria_nombre = `Categoría ${producto.categoria_id}`;
          }
          console.log(`  Asignado nombre de categoría: ${producto.categoria_nombre}`);
        }
        return producto;
      });
      
      return productosConCategorias;
    } catch (error) {
      console.error('Error al obtener productos:', error);
      throw error;
    }
  },
  
  getProducto: async (id) => {
    console.log(`Obteniendo producto con ID ${id}`);
    try {
      const response = await fetchWithToken(`/productos/${id}`);
      console.log('Producto obtenido:', response);
      
      // Depurar datos de categoría
      console.log(`Producto ${response.id} - ${response.nombre}:`);
      console.log(`  categoria_id: ${response.categoria_id}`);
      console.log(`  categoria_nombre: ${response.categoria_nombre}`);
      
      // Si el producto tiene categoria_id pero no tiene categoria_nombre, asignar un nombre
      if (response.categoria_id && !response.categoria_nombre) {
        // Asignar un nombre de categoría basado en el ID conocido
        switch(response.categoria_id) {
          case 1: response.categoria_nombre = 'Bebidas'; break;
          case 2: response.categoria_nombre = 'Snacks'; break;
          case 3: response.categoria_nombre = 'Lácteos'; break;
          case 4: response.categoria_nombre = 'Limpieza'; break;
          case 5: response.categoria_nombre = 'Cuidado Personal'; break;
          case 7: response.categoria_nombre = 'Alimentos'; break;
          default: response.categoria_nombre = `Categoría ${response.categoria_id}`;
        }
        console.log(`  Asignado nombre de categoría: ${response.categoria_nombre}`);
      }
      
      return response;
    } catch (error) {
      console.error('Error al obtener producto:', error);
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
  
  // Unidades de medida
  getUnidadesMedida: async () => {
    console.log('Obteniendo unidades de medida');
    try {
      const response = await fetchWithToken('/unidades');
      console.log('Unidades de medida obtenidas:', response);
      return response;
    } catch (error) {
      console.error('Error al obtener unidades de medida:', error);
      // Si el endpoint falla, devolver unidades de medida de ejemplo
      console.log('Usando unidades de medida de ejemplo');
      return [
        { id: 1, nombre: 'Unidad', abreviatura: 'UN', descripcion: 'Unidad individual' },
        { id: 2, nombre: 'Caja', abreviatura: 'CJ', descripcion: 'Caja con múltiples unidades' },
        { id: 3, nombre: 'Paquete', abreviatura: 'PQ', descripcion: 'Paquete con múltiples unidades' },
        { id: 4, nombre: 'Kilogramo', abreviatura: 'KG', descripcion: 'Medida de peso' },
        { id: 5, nombre: 'Litro', abreviatura: 'L', descripcion: 'Medida de volumen' }
      ];
    }
  },
  
  // Actualizar una unidad específica de un producto
  updateUnidadProducto: async (productoId, unidadId, unidadData) => {
    console.log(`Actualizando unidad ${unidadId} del producto ${productoId}:`, JSON.stringify(unidadData));
    try {
      // Validar que los IDs sean números válidos
      const numericProductoId = parseInt(productoId);
      const numericUnidadId = parseInt(unidadId);
      
      if (isNaN(numericProductoId) || isNaN(numericUnidadId)) {
        throw new Error(`ID de producto o unidad inválido: producto=${productoId}, unidad=${unidadId}`);
      }
      
      // Validar que unidad_id sea un número válido
      if (!unidadData.unidad_id || isNaN(parseInt(unidadData.unidad_id))) {
        unidadData.unidad_id = 1; // Usar unidad base como fallback
        console.log(`Corrigiendo unidad_id inválido a valor por defecto: 1`);
      }
      
      // Eliminar el campo es_unidad_base ya que no existe en la base de datos
      if (unidadData.hasOwnProperty('es_unidad_base')) {
        console.log('Eliminando campo es_unidad_base que no existe en la base de datos');
        delete unidadData.es_unidad_base;
      }
      
      const response = await fetchWithToken(`/productos/${numericProductoId}/unidades/${numericUnidadId}`, {
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
      // Validar que el ID del producto sea un número válido
      const numericProductoId = parseInt(productoId);
      
      if (isNaN(numericProductoId)) {
        throw new Error(`ID de producto inválido: ${productoId}`);
      }
      
      // Validar que unidad_id sea un número válido
      if (!unidadData.unidad_id || isNaN(parseInt(unidadData.unidad_id))) {
        unidadData.unidad_id = 1; // Usar unidad base como fallback
        console.log(`Corrigiendo unidad_id inválido a valor por defecto: 1`);
      }
      
      // Asegurarse de que todos los campos numéricos sean números válidos
      unidadData.factor_conversion = parseFloat(unidadData.factor_conversion) || 1;
      unidadData.precio = parseFloat(unidadData.precio) || 0;
      unidadData.costo = parseFloat(unidadData.costo) || 0;
      unidadData.stock = parseInt(unidadData.stock) || 0;
      
      // Eliminar el campo es_unidad_base ya que no existe en la base de datos
      if (unidadData.hasOwnProperty('es_unidad_base')) {
        console.log('Eliminando campo es_unidad_base que no existe en la base de datos');
        delete unidadData.es_unidad_base;
      }
      
      const response = await fetchWithToken(`/productos/${numericProductoId}/unidades`, {
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
  
  // Categorías
  getCategorias: async () => {
    console.log('Obteniendo lista de categorías');
    try {
      const response = await fetchWithToken('/categorias');
      console.log('Categorías obtenidas:', response);
      return response;
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      throw error;
    }
  },
  
  getCategoriaById: async (id) => {
    console.log(`Obteniendo categoría con ID ${id}`);
    try {
      const response = await fetchWithToken(`/categorias/${id}`);
      console.log(`Categoría ${id} obtenida:`, response);
      return response;
    } catch (error) {
      console.error(`Error al obtener categoría ${id}:`, error);
      throw error;
    }
  },
  
  createCategoria: async (categoriaData) => {
    console.log('Creando categoría:', JSON.stringify(categoriaData));
    try {
      const response = await fetchWithToken('/categorias', {
        method: 'POST',
        body: JSON.stringify(categoriaData),
      });
      console.log('Categoría creada:', response);
      return response;
    } catch (error) {
      console.error('Error al crear categoría:', error);
      throw error;
    }
  },
  
  // Crear un nuevo producto
  createProducto: async (productoData) => {
    console.log('Creando producto:', JSON.stringify(productoData));
    try {
      const response = await fetchWithToken('/productos', {
        method: 'POST',
        body: JSON.stringify(productoData),
      });
      console.log('Producto creado:', response);
      return response;
    } catch (error) {
      console.error('Error al crear producto:', error);
      throw error;
    }
  }
};

export default productosApi;
