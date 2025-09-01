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

async function debugStockIssue() {
  const pool = mysql.createPool(dbConfig);
  
  try {
    console.log('🔍 INVESTIGANDO PROBLEMA DE STOCK - PRODUCTO 2');
    console.log('=' * 60);
    
    // 1. Verificar todas las unidades del producto 2
    const [unidades] = await pool.query(`
      SELECT pu.*, um.nombre as unidad_nombre
      FROM producto_unidades pu
      LEFT JOIN unidades_medida um ON pu.unidad_id = um.id
      WHERE pu.producto_id = 2
      ORDER BY pu.id
    `);
    
    console.log('\n📦 TODAS LAS UNIDADES DEL PRODUCTO 2:');
    unidades.forEach(unidad => {
      console.log(`  - ID: ${unidad.id}, Unidad: ${unidad.unidad_nombre}, Stock: ${unidad.stock}, Factor: ${unidad.factor_conversion}, Unidad_ID: ${unidad.unidad_id}`);
    });
    
    // 2. Verificar las ventas recientes del producto 2
    const [ventas] = await pool.query(`
      SELECT vd.*, v.id as venta_id, v.fecha
      FROM venta_detalles vd
      JOIN ventas v ON vd.venta_id = v.id
      WHERE vd.producto_id = 2
      ORDER BY v.id DESC
      LIMIT 5
    `);
    
    console.log('\n🛒 VENTAS RECIENTES DEL PRODUCTO 2:');
    ventas.forEach(venta => {
      console.log(`  - Venta ID: ${venta.venta_id}, Cantidad: ${venta.cantidad}, Unidad ID: ${venta.unidad_id}, Unidad: ${venta.unidad_nombre}, Fecha: ${venta.fecha}`);
    });
    
    // 3. Verificar las devoluciones del producto 2
    const [devoluciones] = await pool.query(`
      SELECT dd.*, d.venta_id, d.fecha, d.id as devolucion_id
      FROM devolucion_detalles dd
      JOIN devoluciones d ON dd.devolucion_id = d.id
      WHERE dd.producto_id = 2
      ORDER BY d.id DESC
      LIMIT 5
    `);
    
    console.log('\n↩️  DEVOLUCIONES RECIENTES DEL PRODUCTO 2:');
    devoluciones.forEach(dev => {
      console.log(`  - Devolución ID: ${dev.devolucion_id}, Venta ID: ${dev.venta_id}, Cantidad: ${dev.cantidad}, Unidad ID: ${dev.unidad_id}, Unidad: ${dev.unidad_nombre}, Fecha: ${dev.fecha}`);
    });
    
    // 4. Hacer una consulta específica del ID 10 que aparece en los logs
    const [unidad10] = await pool.query(`
      SELECT pu.*, um.nombre as unidad_nombre
      FROM producto_unidades pu
      LEFT JOIN unidades_medida um ON pu.unidad_id = um.id
      WHERE pu.id = 10
    `);
    
    console.log('\n🎯 INFORMACIÓN ESPECÍFICA DE LA UNIDAD ID 10:');
    if (unidad10.length > 0) {
      const u = unidad10[0];
      console.log(`  - ID: ${u.id}, Producto ID: ${u.producto_id}, Unidad: ${u.unidad_nombre}, Stock: ${u.stock}, Factor: ${u.factor_conversion}, Unidad_Medida_ID: ${u.unidad_id}`);
    } else {
      console.log('  - ❌ No se encontró ninguna unidad con ID 10');
    }
    
    // 5. Buscar si hay duplicados de unidades de medida "Caja" para el producto 2
    const [cajas] = await pool.query(`
      SELECT pu.*, um.nombre as unidad_nombre
      FROM producto_unidades pu
      LEFT JOIN unidades_medida um ON pu.unidad_id = um.id
      WHERE pu.producto_id = 2 AND um.nombre = 'Caja'
    `);
    
    console.log('\n📦 TODAS LAS UNIDADES "CAJA" DEL PRODUCTO 2:');
    cajas.forEach(caja => {
      console.log(`  - ID: ${caja.id}, Stock: ${caja.stock}, Factor: ${caja.factor_conversion}, Unidad_Medida_ID: ${caja.unidad_id}`);
    });
    
    await pool.end();
    console.log('\n✅ INVESTIGACIÓN COMPLETADA');
    
  } catch (error) {
    console.error('❌ Error durante la investigación:', error);
    await pool.end();
    process.exit(1);
  }
}

debugStockIssue();