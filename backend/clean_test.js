const mysql = require('mysql2/promise');

async function cleanTest() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Caracol@2024',
    database: 'ventas_app'
  });

  try {
    await connection.query('DELETE FROM devolucion_detalles WHERE devolucion_id = 8');
    console.log('Datos de prueba eliminados');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

cleanTest();