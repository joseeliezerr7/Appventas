const mysql = require('mysql2/promise');

async function fixStockManual() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Caracol@2024',
    database: 'ventas_app'
  });

  try {
    console.log('=== CORRIGIENDO STOCK MANUALMENTE ===');
    
    // El estado debería ser:
    // - Se vendió 1 caja (12 unidades)
    // - Se devolvió 1 caja
    // - Stock de cajas debería ser 1
    // - Stock de unidades individuales debería seguir siendo 141
    
    // Corregir stock de la caja (ID 16)
    await connection.query(`
      UPDATE producto_unidades 
      SET stock = 1 
      WHERE id = 16
    `);
    
    console.log('Stock de caja corregido a 1');
    
    // Verificar nuevo estado
    const [unidades] = await connection.query(`
      SELECT pu.*, um.nombre as unidad_nombre
      FROM producto_unidades pu
      LEFT JOIN unidades_medida um ON pu.unidad_id = um.id
      WHERE pu.producto_id = 2
    `);
    
    console.log('ESTADO DESPUÉS DE CORRECCIÓN:');
    console.table(unidades);
    
    // Recalcular stock total
    let stockTotal = 0;
    for (const unidad of unidades) {
      const stockUnidad = parseInt(unidad.stock) || 0;
      const factorConversion = Number(unidad.factor_conversion) || 1;
      const stockEnUnidadesBase = stockUnidad * factorConversion;
      stockTotal += stockEnUnidadesBase;
    }
    
    await connection.query(
      'UPDATE productos SET stock_total = ? WHERE id = 2',
      [stockTotal]
    );
    
    console.log(`Stock total recalculado: ${stockTotal}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

fixStockManual();