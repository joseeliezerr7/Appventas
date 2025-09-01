const mysql = require('mysql2/promise');

async function testDevolucionInsert() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Caracol@2024',
    database: 'ventas_app'
  });

  try {
    console.log('=== PROBANDO INSERCIÓN DIRECTA EN devolucion_detalles ===');
    
    // Probar inserción directa
    const testInsert = await connection.query(`
      INSERT INTO devolucion_detalles 
      (devolucion_id, producto_id, cantidad, precio_unitario, subtotal, unidad_id, factor_conversion, unidad_nombre)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [8, 1, 2, 25.50, 51.00, null, 1, 'Unidad']);
    
    console.log('Inserción exitosa:', testInsert[0]);
    
    // Verificar que se insertó
    const [result] = await connection.query(`
      SELECT * FROM devolucion_detalles WHERE devolucion_id = 8
    `);
    
    console.log('Registros encontrados:', result);
    
  } catch (error) {
    console.error('Error en la inserción:', error);
  } finally {
    await connection.end();
  }
}

testDevolucionInsert();