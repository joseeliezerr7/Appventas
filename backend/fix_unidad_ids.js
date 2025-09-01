const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ventas_app'
};

async function fixUnidadIds() {
  const pool = mysql.createPool(dbConfig);
  
  try {
    console.log('🔧 CORRIGIENDO IDs DE UNIDADES EN VENTAS');
    console.log('=' * 50);
    
    // 1. Encontrar ventas con IDs incorrectos para producto 2
    const [ventasIncorrectas] = await pool.query(`
      SELECT vd.*, v.fecha
      FROM venta_detalles vd
      JOIN ventas v ON vd.venta_id = v.id
      WHERE vd.producto_id = 2 
      AND vd.unidad_id = 10  -- ID de unidades_medida en lugar de producto_unidades
    `);
    
    console.log(`\n📋 Ventas con IDs incorrectos encontradas: ${ventasIncorrectas.length}`);
    
    for (const venta of ventasIncorrectas) {
      console.log(`\n🔍 Corrigiendo venta ID ${venta.venta_id}:`);
      console.log(`  - Producto: ${venta.producto_id}`);
      console.log(`  - Unidad ID actual (incorrecto): ${venta.unidad_id}`);
      console.log(`  - Unidad nombre: ${venta.unidad_nombre}`);
      
      // Buscar el ID correcto en producto_unidades
      const [unidadCorrecta] = await pool.query(`
        SELECT pu.id
        FROM producto_unidades pu
        JOIN unidades_medida um ON pu.unidad_id = um.id
        WHERE pu.producto_id = ? AND um.nombre = ?
      `, [venta.producto_id, venta.unidad_nombre]);
      
      if (unidadCorrecta.length > 0) {
        const nuevoId = unidadCorrecta[0].id;
        console.log(`  - Nuevo ID correcto: ${nuevoId}`);
        
        // Actualizar el venta_detalles
        await pool.query(`
          UPDATE venta_detalles 
          SET unidad_id = ?
          WHERE id = ?
        `, [nuevoId, venta.id]);
        
        console.log(`  ✅ Venta_detalle ID ${venta.id} actualizado`);
        
        // También actualizar cualquier devolución relacionada
        const [devolucionesRelacionadas] = await pool.query(`
          SELECT dd.*, d.venta_id
          FROM devolucion_detalles dd
          JOIN devoluciones d ON dd.devolucion_id = d.id
          WHERE d.venta_id = ? AND dd.producto_id = ?
        `, [venta.venta_id, venta.producto_id]);
        
        for (const devolucion of devolucionesRelacionadas) {
          if (devolucion.unidad_id !== nuevoId) {
            await pool.query(`
              UPDATE devolucion_detalles 
              SET unidad_id = ?
              WHERE id = ?
            `, [nuevoId, devolucion.id]);
            
            console.log(`  ✅ Devolución_detalle ID ${devolucion.id} también actualizado`);
          }
        }
        
      } else {
        console.log(`  ❌ No se encontró unidad correcta para ${venta.unidad_nombre}`);
      }
    }
    
    // 2. Restaurar el stock correcto
    console.log('\n🔄 Restaurando stock correcto para producto 2...');
    
    // Resetear el stock de la unidad Caja del producto 2
    const [unidadCaja] = await pool.query(`
      SELECT pu.id
      FROM producto_unidades pu
      JOIN unidades_medida um ON pu.unidad_id = um.id
      WHERE pu.producto_id = 2 AND um.nombre = 'Caja'
    `);
    
    if (unidadCaja.length > 0) {
      const cajaId = unidadCaja[0].id;
      
      // Calcular cuánto stock debería haber basado en ventas y devoluciones
      const [ventasTotal] = await pool.query(`
        SELECT COALESCE(SUM(vd.cantidad), 0) as total_vendido
        FROM venta_detalles vd
        WHERE vd.producto_id = 2 AND vd.unidad_id = ?
      `, [cajaId]);
      
      const [devolucionesTotal] = await pool.query(`
        SELECT COALESCE(SUM(dd.cantidad), 0) as total_devuelto
        FROM devolucion_detalles dd
        JOIN devoluciones d ON dd.devolucion_id = d.id
        WHERE dd.producto_id = 2 AND dd.unidad_id IN (1, ?)  -- Considerar ambos IDs por si acaso
      `, [cajaId]);
      
      const vendido = parseInt(ventasTotal[0].total_vendido || 0);
      const devuelto = parseInt(devolucionesTotal[0].total_devuelto || 0);
      
      // Asumir que empezamos con algún stock inicial (ajustar según necesidad)
      const stockInicial = 75; // Estimación basada en los logs
      const stockCorregido = stockInicial - vendido + devuelto;
      
      console.log(`📊 Cálculo de stock para Caja (ID ${cajaId}):`);
      console.log(`  - Stock inicial estimado: ${stockInicial}`);
      console.log(`  - Total vendido: ${vendido}`);
      console.log(`  - Total devuelto: ${devuelto}`);
      console.log(`  - Stock correcto: ${stockCorregido}`);
      
      await pool.query(`
        UPDATE producto_unidades 
        SET stock = ?
        WHERE id = ?
      `, [stockCorregido, cajaId]);
      
      console.log(`✅ Stock de Caja corregido a ${stockCorregido}`);
    }
    
    await pool.end();
    console.log('\n✅ CORRECCIÓN COMPLETADA');
    
  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
    await pool.end();
    process.exit(1);
  }
}

fixUnidadIds();