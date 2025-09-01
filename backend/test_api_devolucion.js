const mysql = require('mysql2/promise');

async function testApiDevolucion() {
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
    console.log('=== PRUEBA DIRECTA DE CONSULTA DEVOLUCIÓN ===');
    
    const id = 9; // ID de la devolución que acabamos de crear
    
    // Obtener la devolución
    const [devoluciones] = await pool.query(`
      SELECT d.*, 
             v.fecha as venta_fecha,
             c.nombre as cliente_nombre,
             u.nombre as usuario_nombre
      FROM devoluciones d
      LEFT JOIN ventas v ON d.venta_id = v.id
      LEFT JOIN clientes c ON v.cliente_id = c.id
      LEFT JOIN usuarios u ON d.usuario_id = u.id
      WHERE d.id = ?
    `, [id]);
    
    console.log('DEVOLUCIÓN:', devoluciones[0]);
    
    // Obtener los detalles
    const [detalles] = await pool.query(`
      SELECT dd.*, 
             p.nombre as producto_nombre,
             p.codigo as producto_codigo,
             COALESCE(dd.unidad_nombre, um.nombre, 'Unidad') as unidad_nombre
      FROM devolucion_detalles dd
      LEFT JOIN productos p ON dd.producto_id = p.id
      LEFT JOIN unidades_medida um ON dd.unidad_id = um.id
      WHERE dd.devolucion_id = ?
    `, [id]);
    
    console.log('DETALLES:', JSON.stringify(detalles, null, 2));
    
    const devolucion = devoluciones[0];
    devolucion.items = detalles;
    
    console.log('RESPUESTA COMPLETA:', JSON.stringify(devolucion, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

testApiDevolucion();