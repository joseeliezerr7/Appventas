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

async function cleanupDevoluciones() {
  const pool = mysql.createPool(dbConfig);
  
  try {
    console.log('🧹 INICIANDO LIMPIEZA DE DEVOLUCIONES DUPLICADAS');
    
    // Verificar devoluciones para venta 26
    const [devoluciones] = await pool.query(`
      SELECT d.id, d.venta_id, d.total, d.fecha,
             COUNT(dd.id) as num_items
      FROM devoluciones d
      LEFT JOIN devolucion_detalles dd ON d.id = dd.devolucion_id
      WHERE d.venta_id = 26
      GROUP BY d.id
      ORDER BY d.id
    `);
    
    console.log('Devoluciones encontradas para venta 26:');
    console.log(devoluciones);
    
    if (devoluciones.length > 1) {
      console.log(`\n⚠️  Se encontraron ${devoluciones.length} devoluciones para la misma venta`);
      
      // Mantener solo la primera devolución y eliminar las duplicadas
      const devolucionesAEliminar = devoluciones.slice(1);
      
      for (const devolucion of devolucionesAEliminar) {
        console.log(`🗑️  Eliminando devolución duplicada ID: ${devolucion.id}`);
        
        // Eliminar detalles primero
        await pool.query('DELETE FROM devolucion_detalles WHERE devolucion_id = ?', [devolucion.id]);
        
        // Eliminar devolución
        await pool.query('DELETE FROM devoluciones WHERE id = ?', [devolucion.id]);
        
        console.log(`✅ Devolución ${devolucion.id} eliminada`);
      }
    }
    
    // Verificar el stock del producto 2 y corregirlo si es necesario
    const [ventaOriginal] = await pool.query(`
      SELECT cantidad FROM venta_detalles 
      WHERE venta_id = 26 AND producto_id = 2
    `);
    
    const [devolucionesRestantes] = await pool.query(`
      SELECT SUM(dd.cantidad) as total_devuelto
      FROM devolucion_detalles dd
      JOIN devoluciones d ON dd.devolucion_id = d.id
      WHERE d.venta_id = 26 AND dd.producto_id = 2
    `);
    
    const cantidadOriginal = parseFloat(ventaOriginal[0]?.cantidad || 0);
    const totalDevuelto = parseFloat(devolucionesRestantes[0]?.total_devuelto || 0);
    
    console.log(`\n📊 RESUMEN FINAL:`);
    console.log(`Cantidad original vendida: ${cantidadOriginal}`);
    console.log(`Total devuelto después de limpieza: ${totalDevuelto}`);
    
    if (totalDevuelto > cantidadOriginal) {
      console.log('⚠️  Aún hay inconsistencias en las devoluciones');
    } else {
      console.log('✅ Las devoluciones están ahora consistentes');
    }
    
    await pool.end();
    console.log('\n✅ LIMPIEZA COMPLETADA');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    await pool.end();
    process.exit(1);
  }
}

cleanupDevoluciones();