const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

async function debugDevoluciones() {
  try {
    console.log('Conectando a la base de datos...');
    const connection = await mysql.createConnection(dbConfig);
    
    // Verificar estructura de devoluciones
    console.log('\n=== ESTRUCTURA DE devoluciones ===');
    const [devColumns] = await connection.query('DESCRIBE devoluciones');
    console.table(devColumns);
    
    // Verificar estructura de devolucion_detalles
    console.log('\n=== ESTRUCTURA DE devolucion_detalles ===');
    const [detColumns] = await connection.query('DESCRIBE devolucion_detalles');
    console.table(detColumns);
    
    // Verificar devoluciones existentes
    console.log('\n=== DEVOLUCIONES REGISTRADAS ===');
    const [devoluciones] = await connection.query(`
      SELECT d.*, v.id as venta_id, c.nombre as cliente_nombre
      FROM devoluciones d
      LEFT JOIN ventas v ON d.venta_id = v.id
      LEFT JOIN clientes c ON v.cliente_id = c.id
      ORDER BY d.id DESC
      LIMIT 5
    `);
    console.table(devoluciones);
    
    // Verificar detalles de devoluciones
    if (devoluciones.length > 0) {
      for (const devolucion of devoluciones) {
        console.log(`\n=== DETALLES DE DEVOLUCIÓN ${devolucion.id} ===`);
        const [detalles] = await connection.query(`
          SELECT dd.*, p.nombre as producto_nombre
          FROM devolucion_detalles dd
          LEFT JOIN productos p ON dd.producto_id = p.id
          WHERE dd.devolucion_id = ?
        `, [devolucion.id]);
        console.table(detalles);
      }
    }
    
    // Verificar si hay campos de unidad en devolucion_detalles
    const hasUnidadFields = detColumns.some(col => col.Field === 'unidad_id');
    if (!hasUnidadFields) {
      console.log('\n❌ PROBLEMA: La tabla devolucion_detalles NO tiene campos de unidad');
      console.log('Campos necesarios: unidad_id, factor_conversion, unidad_nombre');
    }
    
    await connection.end();
    console.log('\nDebug de devoluciones completado.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugDevoluciones();