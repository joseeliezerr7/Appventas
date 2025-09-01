const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

async function debugUnidad16() {
  try {
    console.log('Conectando a la base de datos...');
    const connection = await mysql.createConnection(dbConfig);
    
    // Verificar todas las unidades de medida
    console.log('\n=== TODAS LAS UNIDADES DE MEDIDA ===');
    const [unidades] = await connection.query('SELECT * FROM unidades_medida ORDER BY id');
    console.table(unidades);
    
    // Verificar si existe unidad ID 16
    console.log('\n=== VERIFICAR UNIDAD ID 16 ===');
    const [unidad16] = await connection.query('SELECT * FROM unidades_medida WHERE id = 16');
    if (unidad16.length > 0) {
      console.log('Unidad 16 encontrada:', unidad16[0]);
    } else {
      console.log('❌ Unidad ID 16 NO EXISTE en unidades_medida');
    }
    
    // Verificar todas las producto_unidades para ver sus IDs
    console.log('\n=== PRODUCTO_UNIDADES PARA AGUA MINERAL ===');
    const [prodUnidades] = await connection.query(`
      SELECT pu.*, um.nombre as unidad_nombre
      FROM producto_unidades pu
      LEFT JOIN unidades_medida um ON pu.unidad_id = um.id
      WHERE pu.producto_id = 2
    `);
    console.table(prodUnidades);
    
    // Buscar si unidad_id 16 es de producto_unidades
    console.log('\n=== VERIFICAR SI 16 ES DE PRODUCTO_UNIDADES ===');
    const [prodUnidad16] = await connection.query('SELECT * FROM producto_unidades WHERE id = 16');
    if (prodUnidad16.length > 0) {
      console.log('✅ ID 16 encontrado en producto_unidades:', prodUnidad16[0]);
    } else {
      console.log('❌ ID 16 NO EXISTE en producto_unidades');
    }
    
    await connection.end();
    console.log('\nDebug completado.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugUnidad16();