const mysql = require('mysql2/promise');

async function debugVenta23() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Caracol@2024',
    database: 'ventas_app'
  });

  try {
    console.log('=== DEBUG VENTA 23 ===');
    
    // Ver la venta completa
    const [ventas] = await connection.query(`
      SELECT * FROM ventas WHERE id = 23
    `);
    
    console.log('VENTA 23:');
    console.table(ventas);
    
    // Ver los detalles de la venta
    const [detalles] = await connection.query(`
      SELECT vd.*, 
             p.nombre as producto_nombre,
             p.codigo as producto_codigo,
             COALESCE(vd.unidad_nombre, um.nombre, 'Unidad') as unidad_nombre_calculado
      FROM venta_detalles vd
      LEFT JOIN productos p ON vd.producto_id = p.id
      LEFT JOIN unidades_medida um ON vd.unidad_id = um.id
      WHERE vd.venta_id = 23
    `);
    
    console.log('DETALLES VENTA 23:');
    console.table(detalles);
    
    // Ver el stock actual del producto
    const [stock] = await connection.query(`
      SELECT pu.*, um.nombre as unidad_nombre
      FROM producto_unidades pu
      LEFT JOIN unidades_medida um ON pu.unidad_id = um.id
      WHERE pu.producto_id = 2
    `);
    
    console.log('STOCK ACTUAL PRODUCTO 2:');
    console.table(stock);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

debugVenta23();