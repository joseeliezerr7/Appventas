const mysql = require('mysql2/promise');

async function debugVenta21() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Caracol@2024',
    database: 'ventas_app'
  });

  try {
    console.log('=== DEBUG VENTA 21 ===');
    
    // Ver la venta completa como la ve el frontend
    const [ventas] = await connection.query(`
      SELECT v.*, 
             c.nombre as cliente_nombre,
             c.direccion as cliente_direccion,
             c.telefono as cliente_telefono,
             u.nombre as vendedor_nombre
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      WHERE v.id = 21
    `);
    
    console.log('VENTA 21:');
    console.table(ventas);
    
    // Ver los detalles como los ve el frontend
    const [detalles] = await connection.query(`
      SELECT vd.*, 
             p.nombre as producto_nombre,
             p.codigo as producto_codigo,
             COALESCE(vd.unidad_nombre, um.nombre, 'Unidad') as unidad_nombre
      FROM venta_detalles vd
      LEFT JOIN productos p ON vd.producto_id = p.id
      LEFT JOIN unidades_medida um ON vd.unidad_id = um.id
      WHERE vd.venta_id = 21
    `);
    
    console.log('DETALLES VENTA 21 (como los ve el frontend):');
    console.table(detalles);
    
    // Ver las unidades disponibles del producto
    const [unidades] = await connection.query(`
      SELECT pu.*, um.nombre as unidad_nombre
      FROM producto_unidades pu
      LEFT JOIN unidades_medida um ON pu.unidad_id = um.id
      WHERE pu.producto_id = 2
    `);
    
    console.log('UNIDADES DISPONIBLES PRODUCTO 2:');
    console.table(unidades);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

debugVenta21();