const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

async function debugVentas() {
  try {
    console.log('Conectando a la base de datos...');
    const connection = await mysql.createConnection(dbConfig);
    
    // Verificar estructura de venta_detalles
    console.log('\n=== ESTRUCTURA DE venta_detalles ===');
    const [columns] = await connection.query('DESCRIBE venta_detalles');
    console.table(columns);
    
    // Verificar las últimas ventas
    console.log('\n=== ÚLTIMAS VENTAS ===');
    const [ventas] = await connection.query(`
      SELECT v.*, c.nombre as cliente_nombre 
      FROM ventas v 
      LEFT JOIN clientes c ON v.cliente_id = c.id 
      ORDER BY v.id DESC 
      LIMIT 5
    `);
    console.table(ventas);
    
    // Verificar detalles de las últimas 3 ventas
    for (let i = 0; i < Math.min(3, ventas.length); i++) {
      const venta = ventas[i];
      console.log(`\n=== DETALLES DE VENTA ${venta.id} ===`);
      const [detalles] = await connection.query(`
        SELECT vd.*, 
               p.nombre as producto_nombre,
               um.nombre as unidad_medida_nombre,
               COALESCE(vd.unidad_nombre, um.nombre, 'Sin unidad') as unidad_display
        FROM venta_detalles vd
        LEFT JOIN productos p ON vd.producto_id = p.id
        LEFT JOIN unidades_medida um ON vd.unidad_id = um.id
        WHERE vd.venta_id = ?
      `, [venta.id]);
      console.table(detalles);
    }
    
    // Verificar unidades de medida disponibles
    console.log('\n=== UNIDADES DE MEDIDA ===');
    const [unidades] = await connection.query('SELECT * FROM unidades_medida LIMIT 10');
    console.table(unidades);
    
    // Verificar producto_unidades para el primer producto
    console.log('\n=== PRODUCTO_UNIDADES (ejemplo) ===');
    const [prodUnidades] = await connection.query(`
      SELECT pu.*, um.nombre as unidad_nombre, p.nombre as producto_nombre
      FROM producto_unidades pu
      LEFT JOIN unidades_medida um ON pu.unidad_id = um.id
      LEFT JOIN productos p ON pu.producto_id = p.id
      LIMIT 10
    `);
    console.table(prodUnidades);
    
    await connection.end();
    console.log('\nDebug completado.');
    
  } catch (error) {
    console.error('Error en debug:', error);
  }
}

debugVentas();