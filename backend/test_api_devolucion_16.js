const mysql = require('mysql2/promise');

async function testApiDevolucion16() {
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
    console.log('=== SIMULANDO API GET /devoluciones/16 ===');
    
    const id = 16; // ID de la última devolución
    
    // Simular exactamente lo que hace el endpoint GET /devoluciones/:id
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
    
    console.log('DEVOLUCIÓN PRINCIPAL:');
    console.table(devoluciones);
    
    // Obtener los detalles exactamente como el endpoint
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
    
    console.log('DETALLES DE LA DEVOLUCIÓN:');
    console.table(detalles);
    
    const devolucion = devoluciones[0];
    devolucion.items = detalles;
    
    console.log('RESPUESTA COMPLETA DE LA API:');
    console.log(JSON.stringify(devolucion, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

testApiDevolucion16();