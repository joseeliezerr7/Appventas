const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

// Importar rutas
const clientesRoutes = require('./routes/clientes');
const productosRoutes = require('./routes/productos');
const ventasRoutes = require('./routes/ventas');
const rutasRoutes = require('./routes/rutas');
const devolucionesRoutes = require('./routes/devoluciones');
const unidadesRoutes = require('./routes/unidades');
const categoriasRoutes = require('./routes/categorias');
const usuariosRoutes = require('./routes/usuarios');
const authRoutes = require('./routes/auth');
const reportesRoutes = require('./routes/reportes');

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de la conexión a la base de datos
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Hacer el pool disponible para los routers
app.locals.pool = pool;

// Middleware para verificar token JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    console.log('Error de autenticación: Token no proporcionado');
    return res.status(401).json({ message: 'Token no proporcionado' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Error de autenticación:', err.message);
      return res.status(403).json({ message: 'Token inválido', error: err.message });
    }
    
    req.user = user;
    console.log(`Usuario autenticado: ${user.email} (${user.rol})`);
    next();
  });
};

// Función para recalcular el stock total de un producto basado en sus unidades
async function recalcularStockTotal(connection, productoId) {
  try {
    console.log(`Recalculando stock total para producto ID: ${productoId}`);
    
    // Usar la conexión proporcionada o crear una nueva si no se proporciona
    const conn = connection || await pool.getConnection();
    
    // Obtener todas las unidades del producto
    const [unidades] = await conn.query(`
      SELECT pu.*, um.nombre as unidad_nombre
      FROM producto_unidades pu
      LEFT JOIN unidades_medida um ON pu.unidad_id = um.id
      WHERE pu.producto_id = ?
    `, [productoId]);
    
    // Calcular el stock total basado en las unidades y sus factores de conversión
    let stockTotal = 0;
    for (const unidad of unidades) {
      const stockUnidad = parseInt(unidad.stock) || 0;
      const factorConversion = Number(unidad.factor_conversion) || 1;
      const stockEnUnidadesBase = stockUnidad * factorConversion;
      stockTotal += stockEnUnidadesBase;
      
      console.log(`Unidad: ${unidad.unidad_nombre || 'Desconocida'}, Stock: ${stockUnidad}, Factor: ${factorConversion}, Stock en unidades base: ${stockEnUnidadesBase}`);
    }
    
    // Actualizar el stock_total en la tabla productos
    await conn.query(
      'UPDATE productos SET stock_total = ? WHERE id = ?',
      [stockTotal, productoId]
    );
    
    console.log(`Stock total actualizado para producto ${productoId}: ${stockTotal}`);
    
    // Si creamos una nueva conexión, liberarla
    if (!connection) {
      conn.release();
    }
    
    return stockTotal;
  } catch (error) {
    console.error(`Error al recalcular stock total para producto ${productoId}:`, error);
    throw error;
  }
}

// Hacer disponible la función authenticateToken para los routers
app.locals.authenticateToken = authenticateToken;

// Hacer disponible la función recalcularStockTotal para los routers
app.locals.recalcularStockTotal = recalcularStockTotal;

// Endpoint para recalcular el stock total de todos los productos o uno específico
app.get('/api/productos/recalcular-stock-total/:id?', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    let productosActualizados = 0;
    
    if (id) {
      // Recalcular stock para un producto específico
      console.log(`Recalculando stock total para producto ID: ${id}`);
      
      // Obtener todas las unidades del producto
      const [unidades] = await pool.query(`
        SELECT pu.*, um.nombre as unidad_nombre
        FROM producto_unidades pu
        LEFT JOIN unidades_medida um ON pu.unidad_id = um.id
        WHERE pu.producto_id = ?
      `, [id]);
      
      // Calcular el stock total basado en las unidades y sus factores de conversión
      let stockTotal = 0;
      for (const unidad of unidades) {
        const stockUnidad = parseInt(unidad.stock) || 0;
        const factorConversion = Number(unidad.factor_conversion) || 1;
        const stockEnUnidadesBase = stockUnidad * factorConversion;
        stockTotal += stockEnUnidadesBase;
        
        console.log(`Unidad: ${unidad.unidad_nombre}, Stock: ${stockUnidad}, Factor: ${factorConversion}, Stock en unidades base: ${stockEnUnidadesBase}`);
      }
      
      // Actualizar el stock_total en la tabla productos
      await pool.query(
        'UPDATE productos SET stock_total = ? WHERE id = ?',
        [stockTotal, id]
      );
      
      console.log(`Stock total actualizado para producto ${id}: ${stockTotal}`);
      productosActualizados = 1;
      
      res.status(200).json({ 
        message: `Stock total recalculado para el producto ID: ${id}`,
        stock_total: stockTotal,
        productos_actualizados: productosActualizados
      });
    } else {
      // Recalcular stock para todos los productos
      console.log('Recalculando stock total para todos los productos');
      
      // Obtener todos los productos
      const [productos] = await pool.query('SELECT id FROM productos');
      
      // Recalcular el stock total para cada producto
      for (const producto of productos) {
        const productoId = producto.id;
        
        // Obtener todas las unidades del producto
        const [unidades] = await pool.query(`
          SELECT pu.*, um.nombre as unidad_nombre
          FROM producto_unidades pu
          LEFT JOIN unidades_medida um ON pu.unidad_id = um.id
          WHERE pu.producto_id = ?
        `, [productoId]);
        
        // Calcular el stock total basado en las unidades y sus factores de conversión
        let stockTotal = 0;
        for (const unidad of unidades) {
          const stockUnidad = parseInt(unidad.stock) || 0;
          const factorConversion = Number(unidad.factor_conversion) || 1;
          const stockEnUnidadesBase = stockUnidad * factorConversion;
          stockTotal += stockEnUnidadesBase;
        }
        
        // Actualizar el stock_total en la tabla productos
        await pool.query(
          'UPDATE productos SET stock_total = ? WHERE id = ?',
          [stockTotal, productoId]
        );
        
        console.log(`Stock total actualizado para producto ${productoId}: ${stockTotal}`);
        productosActualizados++;
      }
      
      res.status(200).json({ 
        message: 'Stock total recalculado para todos los productos',
        productos_actualizados: productosActualizados
      });
    }
  } catch (error) {
    console.error('Error al recalcular stock total:', error);
    res.status(500).json({ message: 'Error al recalcular stock total', error: error.message });
  }
});

// Configurar rutas
app.use('/api/clientes', clientesRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/rutas', rutasRoutes);
app.use('/api/devoluciones', devolucionesRoutes);
app.use('/api/unidades', unidadesRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reportes', reportesRoutes);

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
  
  // Recalcular el stock total para todos los productos al iniciar el servidor
  try {
    console.log('Recalculando stock total para todos los productos al iniciar el servidor...');
    
    // Obtener todos los productos
    const [productos] = await pool.query('SELECT id, nombre, codigo FROM productos');
    
    // Recalcular el stock total para cada producto
    for (const producto of productos) {
      const productoId = producto.id;
      
      try {
        // Obtener todas las unidades del producto
        const [unidades] = await pool.query(`
          SELECT pu.*, um.nombre as unidad_nombre
          FROM producto_unidades pu
          LEFT JOIN unidades_medida um ON pu.unidad_id = um.id
          WHERE pu.producto_id = ?
        `, [productoId]);
        
        // Calcular el stock total basado en las unidades y sus factores de conversión
        let stockTotal = 0;
        for (const unidad of unidades) {
          const stockUnidad = parseInt(unidad.stock) || 0;
          const factorConversion = Number(unidad.factor_conversion) || 1;
          const stockEnUnidadesBase = stockUnidad * factorConversion;
          stockTotal += stockEnUnidadesBase;
          
        }
        
        // Actualizar el stock_total en la tabla productos
        await pool.query(
          'UPDATE productos SET stock_total = ? WHERE id = ?',
          [stockTotal, productoId]
        );
      } catch (error) {
        console.error(`Error al recalcular stock para producto ${producto.codigo} (${producto.nombre}):`, error);
      }
    }
    
  } catch (error) {
    console.error('Error al recalcular stock total al iniciar el servidor:', error);
  }
});

module.exports = app;
