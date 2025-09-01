const mysql = require('mysql2/promise');

async function testVentaApi() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Caracol@2024',
    database: 'ventas_app',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log('=== PRUEBA DIRECTA DE CONSULTA VENTA ===');
    
    const id = 19; // ID de la venta que se usó para la devolución
    
    // Simulando la consulta exacta del endpoint GET /api/ventas/:id
    const [ventas] = await pool.query(`
      SELECT v.*, 
             c.nombre as cliente_nombre,
             c.direccion as cliente_direccion,
             c.telefono as cliente_telefono,
             u.nombre as vendedor_nombre
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      WHERE v.id = ?
    `, [id]);
    
    console.log('VENTA:', ventas[0]);
    
    // Obtener los detalles de la venta
    const [detalles] = await pool.query(`
      SELECT vd.*, 
             p.nombre as producto_nombre,
             p.codigo as producto_codigo,
             COALESCE(vd.unidad_nombre, um.nombre, 'Unidad') as unidad_nombre
      FROM venta_detalles vd
      LEFT JOIN productos p ON vd.producto_id = p.id
      LEFT JOIN unidades_medida um ON vd.unidad_id = um.id
      WHERE vd.venta_id = ?
    `, [id]);
    
    console.log('DETALLES DE VENTA:', JSON.stringify(detalles, null, 2));
    
    const venta = ventas[0];
    venta.items = detalles;
    
    console.log('RESPUESTA COMPLETA VENTA:', JSON.stringify(venta, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

testVentaApi();