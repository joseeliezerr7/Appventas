const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

async function createCajaUnits() {
  try {
    console.log('Conectando a la base de datos...');
    const connection = await mysql.createConnection(dbConfig);
    
    // Buscar ID de unidad Caja
    const [cajaUnidad] = await connection.query('SELECT id FROM unidades_medida WHERE nombre = "Caja"');
    
    if (cajaUnidad.length === 0) {
      console.log('Unidad "Caja" no encontrada, creándola...');
      await connection.query('INSERT INTO unidades_medida (nombre, abreviatura, descripcion) VALUES ("Caja", "cj", "Caja con múltiples unidades")');
      const [newCaja] = await connection.query('SELECT id FROM unidades_medida WHERE nombre = "Caja"');
      var cajaId = newCaja[0].id;
    } else {
      var cajaId = cajaUnidad[0].id;
    }
    
    console.log(`ID de unidad Caja: ${cajaId}`);
    
    // Verificar productos que necesitan unidad Caja
    const [productos] = await connection.query(`
      SELECT p.id, p.nombre, p.precio_venta 
      FROM productos p 
      WHERE p.nombre LIKE '%Agua%' OR p.nombre LIKE '%agua%'
    `);
    
    console.log('Productos de agua encontrados:', productos);
    
    for (const producto of productos) {
      // Verificar si ya tiene unidad Caja
      const [existingCaja] = await connection.query(`
        SELECT id FROM producto_unidades 
        WHERE producto_id = ? AND unidad_id = ?
      `, [producto.id, cajaId]);
      
      if (existingCaja.length === 0) {
        // Crear unidad Caja para este producto (1 caja = 12 unidades)
        const precioCaja = Math.round(producto.precio_venta * 12 * 0.9); // 10% descuento por caja
        const stockCaja = 20; // Stock inicial de cajas
        
        await connection.query(`
          INSERT INTO producto_unidades (producto_id, unidad_id, factor_conversion, es_unidad_principal, stock, precio_venta)
          VALUES (?, ?, 12, FALSE, ?, ?)
        `, [producto.id, cajaId, stockCaja, precioCaja]);
        
        console.log(`✓ Unidad Caja creada para ${producto.nombre}: ${stockCaja} cajas a $${precioCaja} c/u`);
      } else {
        console.log(`✓ Unidad Caja ya existe para ${producto.nombre}`);
      }
    }
    
    // Mostrar estado final
    console.log('\n=== UNIDADES FINALES PARA AGUA MINERAL ===');
    const [finalUnits] = await connection.query(`
      SELECT pu.*, um.nombre as unidad_nombre, p.nombre as producto_nombre
      FROM producto_unidades pu
      LEFT JOIN unidades_medida um ON pu.unidad_id = um.id
      LEFT JOIN productos p ON pu.producto_id = p.id
      WHERE p.nombre LIKE '%Agua%' OR p.nombre LIKE '%agua%'
    `);
    console.table(finalUnits);
    
    await connection.end();
    console.log('\n🎉 Unidades de Caja configuradas exitosamente!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createCajaUnits();