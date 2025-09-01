const mysql = require('mysql2/promise');

async function debugStock() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Caracol@2024',
    database: 'ventas_app'
  });

  try {
    console.log('=== DEBUG DE STOCK PRODUCTO 2 (Agua Mineral 1L) ===');
    
    // Ver todas las unidades del producto
    const [unidades] = await connection.query(`
      SELECT pu.*, um.nombre as unidad_nombre
      FROM producto_unidades pu
      LEFT JOIN unidades_medida um ON pu.unidad_id = um.id
      WHERE pu.producto_id = 2
    `);
    
    console.log('UNIDADES DEL PRODUCTO:');
    console.table(unidades);
    
    // Ver el stock total del producto
    const [producto] = await connection.query(`
      SELECT * FROM productos WHERE id = 2
    `);
    
    console.log('PRODUCTO:');
    console.table(producto);
    
    // Ver la última venta
    const [ultimaVenta] = await connection.query(`
      SELECT vd.*, v.fecha, v.estado
      FROM venta_detalles vd
      LEFT JOIN ventas v ON vd.venta_id = v.id
      WHERE vd.producto_id = 2
      ORDER BY v.fecha DESC
      LIMIT 1
    `);
    
    console.log('ÚLTIMA VENTA:');
    console.table(ultimaVenta);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

debugStock();