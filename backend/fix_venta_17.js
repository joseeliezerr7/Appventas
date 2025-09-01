const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

async function fixVenta17() {
  try {
    console.log('Conectando a la base de datos...');
    const connection = await mysql.createConnection(dbConfig);
    
    // Identificar el problema en venta_detalles
    console.log('\n=== DETALLES ACTUALES DE VENTA 17 ===');
    const [detallesActuales] = await connection.query(`
      SELECT vd.*, p.nombre as producto_nombre
      FROM venta_detalles vd
      LEFT JOIN productos p ON vd.producto_id = p.id
      WHERE vd.venta_id = 17
    `);
    console.table(detallesActuales);
    
    // Obtener la información correcta para unidad_id = 16 (que es producto_unidades.id)
    console.log('\n=== INFORMACIÓN CORRECTA PARA PRODUCTO_UNIDADES ID 16 ===');
    const [infoCorrecta] = await connection.query(`
      SELECT pu.*, um.nombre as unidad_nombre
      FROM producto_unidades pu
      LEFT JOIN unidades_medida um ON pu.unidad_id = um.id
      WHERE pu.id = 16
    `);
    console.table(infoCorrecta);
    
    if (infoCorrecta.length > 0) {
      const unidadCorrecta = infoCorrecta[0];
      const unidadMedidaId = unidadCorrecta.unidad_id; // 10 (Caja)
      const unidadNombre = unidadCorrecta.unidad_nombre; // "Caja"
      
      console.log(`\n=== CORRIGIENDO VENTA 17 ===`);
      console.log(`Cambiar unidad_id de 16 a ${unidadMedidaId}`);
      console.log(`Agregar unidad_nombre: "${unidadNombre}"`);
      
      // Actualizar el registro de venta_detalles
      await connection.query(`
        UPDATE venta_detalles 
        SET unidad_id = ?, unidad_nombre = ?
        WHERE venta_id = 17
      `, [unidadMedidaId, unidadNombre]);
      
      console.log('✅ Venta 17 corregida exitosamente');
      
      // Verificar el resultado
      console.log('\n=== DETALLES CORREGIDOS DE VENTA 17 ===');
      const [detallesCorregidos] = await connection.query(`
        SELECT vd.*, 
               p.nombre as producto_nombre,
               um.nombre as unidad_medida_nombre,
               COALESCE(vd.unidad_nombre, um.nombre, 'Sin unidad') as unidad_display
        FROM venta_detalles vd
        LEFT JOIN productos p ON vd.producto_id = p.id
        LEFT JOIN unidades_medida um ON vd.unidad_id = um.id
        WHERE vd.venta_id = 17
      `);
      console.table(detallesCorregidos);
    }
    
    await connection.end();
    console.log('\n🎉 Corrección completada!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixVenta17();