const express = require('express');
const router = express.Router();

// GET /api/reportes/ventas-por-producto - Reporte de ventas por producto
router.get('/ventas-por-producto', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, producto_id } = req.query;
    
    let whereConditions = '1=1';
    let params = [];
    
    if (fecha_inicio && fecha_fin) {
      whereConditions += ' AND v.fecha BETWEEN ? AND ?';
      params.push(fecha_inicio, fecha_fin);
    }
    
    if (producto_id) {
      whereConditions += ' AND vd.producto_id = ?';
      params.push(producto_id);
    }
    
    const [ventas] = await req.app.locals.pool.query(`
      SELECT 
        p.id,
        p.nombre as producto_nombre,
        p.codigo as producto_codigo,
        SUM(vd.cantidad) as total_cantidad_vendida,
        SUM(vd.subtotal) as total_ingresos,
        COUNT(DISTINCT v.id) as numero_ventas,
        AVG(vd.precio_unitario) as precio_promedio,
        um.nombre as unidad_principal
      FROM venta_detalles vd
      JOIN ventas v ON vd.venta_id = v.id
      JOIN productos p ON vd.producto_id = p.id
      LEFT JOIN unidades_medida um ON vd.unidad_id = um.id
      WHERE ${whereConditions}
      GROUP BY p.id, p.nombre, p.codigo, um.nombre
      ORDER BY total_ingresos DESC
    `, params);
    
    console.log(`Reporte ventas por producto generado: ${ventas.length} productos`);
    res.status(200).json(ventas);
  } catch (error) {
    console.error('Error al generar reporte de ventas por producto:', error);
    res.status(500).json({ message: 'Error al generar reporte', error: error.message });
  }
});

// GET /api/reportes/ventas-por-cliente - Reporte de ventas por cliente
router.get('/ventas-por-cliente', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, cliente_id } = req.query;
    
    let whereConditions = '1=1';
    let params = [];
    
    if (fecha_inicio && fecha_fin) {
      whereConditions += ' AND v.fecha BETWEEN ? AND ?';
      params.push(fecha_inicio, fecha_fin);
    }
    
    if (cliente_id) {
      whereConditions += ' AND v.cliente_id = ?';
      params.push(cliente_id);
    }
    
    const [ventas] = await req.app.locals.pool.query(`
      SELECT 
        c.id,
        c.nombre as cliente_nombre,
        c.direccion,
        c.telefono,
        COUNT(v.id) as numero_compras,
        SUM(v.total) as total_gastado,
        AVG(v.total) as ticket_promedio,
        MAX(v.fecha) as ultima_compra,
        MIN(v.fecha) as primera_compra
      FROM ventas v
      JOIN clientes c ON v.cliente_id = c.id
      WHERE ${whereConditions}
      GROUP BY c.id, c.nombre, c.direccion, c.telefono
      ORDER BY total_gastado DESC
    `, params);
    
    console.log(`Reporte ventas por cliente generado: ${ventas.length} clientes`);
    res.status(200).json(ventas);
  } catch (error) {
    console.error('Error al generar reporte de ventas por cliente:', error);
    res.status(500).json({ message: 'Error al generar reporte', error: error.message });
  }
});

// GET /api/reportes/ventas-por-vendedor - Reporte de ventas por vendedor
router.get('/ventas-por-vendedor', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, usuario_id } = req.query;
    
    let whereConditions = '1=1';
    let params = [];
    
    if (fecha_inicio && fecha_fin) {
      whereConditions += ' AND v.fecha BETWEEN ? AND ?';
      params.push(fecha_inicio, fecha_fin);
    }
    
    if (usuario_id) {
      whereConditions += ' AND v.usuario_id = ?';
      params.push(usuario_id);
    }
    
    const [ventas] = await req.app.locals.pool.query(`
      SELECT 
        u.id,
        u.nombre as vendedor_nombre,
        u.email,
        COUNT(v.id) as numero_ventas,
        SUM(v.total) as total_vendido,
        AVG(v.total) as ticket_promedio,
        MAX(v.fecha) as ultima_venta,
        MIN(v.fecha) as primera_venta,
        COUNT(DISTINCT v.cliente_id) as clientes_atendidos
      FROM ventas v
      JOIN usuarios u ON v.usuario_id = u.id
      WHERE ${whereConditions}
      GROUP BY u.id, u.nombre, u.email
      ORDER BY total_vendido DESC
    `, params);
    
    console.log(`Reporte ventas por vendedor generado: ${ventas.length} vendedores`);
    res.status(200).json(ventas);
  } catch (error) {
    console.error('Error al generar reporte de ventas por vendedor:', error);
    res.status(500).json({ message: 'Error al generar reporte', error: error.message });
  }
});

// GET /api/reportes/inventario - Reporte de inventario
router.get('/inventario', async (req, res) => {
  try {
    const { categoria_id, stock_minimo } = req.query;

    let whereConditions = '1=1';
    let params = [];

    if (categoria_id) {
      whereConditions += ' AND p.categoria_id = ?';
      params.push(categoria_id);
    }

    // Consulta simplificada primero, sin JOINs complejos
    const sqlQuery = `
      SELECT
        p.id,
        p.nombre as producto_nombre,
        COALESCE(p.codigo, '') as producto_codigo,
        COALESCE(p.precio_venta, 0) as precio,
        COALESCE(c.nombre, 'Sin categoría') as categoria_nombre,
        p.stock as stock_total,
        0 as vendido_mes_actual,
        0 as devuelto_mes_actual
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE ${whereConditions}
      ${stock_minimo ? `AND p.stock <= ${parseInt(stock_minimo)}` : ''}
      ORDER BY p.stock ASC
    `;

    const [inventario] = await req.app.locals.pool.query(sqlQuery, params);
    
    console.log(`Reporte de inventario generado: ${inventario.length} productos`);
    res.status(200).json(inventario);
  } catch (error) {
    console.error('Error al generar reporte de inventario:', error);
    res.status(500).json({ message: 'Error al generar reporte', error: error.message });
  }
});

// GET /api/reportes/resumen-dashboard - Resumen para el dashboard de reportes
router.get('/resumen-dashboard', async (req, res) => {
  try {
    const { periodo = 'este_mes' } = req.query;
    
    let fechaCondicion = '';
    let params = [];
    
    switch (periodo.toLowerCase()) {
      case 'hoy':
        fechaCondicion = 'AND DATE(v.fecha) = CURDATE()';
        break;
      case 'esta_semana':
        fechaCondicion = 'AND YEARWEEK(v.fecha, 1) = YEARWEEK(CURDATE(), 1)';
        break;
      case 'este_mes':
        fechaCondicion = 'AND MONTH(v.fecha) = MONTH(CURDATE()) AND YEAR(v.fecha) = YEAR(CURDATE())';
        break;
      case 'ultimo_trimestre':
        fechaCondicion = 'AND v.fecha >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)';
        break;
      case 'este_año':
        fechaCondicion = 'AND YEAR(v.fecha) = YEAR(CURDATE())';
        break;
      default:
        fechaCondicion = 'AND MONTH(v.fecha) = MONTH(CURDATE()) AND YEAR(v.fecha) = YEAR(CURDATE())';
    }
    
    // Total de ventas
    const [totalVentas] = await req.app.locals.pool.query(`
      SELECT 
        COALESCE(SUM(v.total), 0) as total_ventas,
        COUNT(v.id) as numero_ventas,
        COUNT(DISTINCT v.cliente_id) as clientes_atendidos,
        COALESCE(AVG(v.total), 0) as ticket_promedio
      FROM ventas v
      WHERE 1=1 ${fechaCondicion}
    `, params);
    
    // Total de productos vendidos
    const [totalProductos] = await req.app.locals.pool.query(`
      SELECT COALESCE(SUM(vd.cantidad), 0) as total_productos
      FROM venta_detalles vd
      JOIN ventas v ON vd.venta_id = v.id
      WHERE 1=1 ${fechaCondicion}
    `, params);
    
    // Comparación con periodo anterior
    let fechaComparacion = '';
    switch (periodo.toLowerCase()) {
      case 'hoy':
        fechaComparacion = 'AND DATE(v.fecha) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)';
        break;
      case 'esta_semana':
        fechaComparacion = 'AND YEARWEEK(v.fecha, 1) = YEARWEEK(DATE_SUB(CURDATE(), INTERVAL 1 WEEK), 1)';
        break;
      case 'este_mes':
        fechaComparacion = 'AND MONTH(v.fecha) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(v.fecha) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))';
        break;
      default:
        fechaComparacion = 'AND MONTH(v.fecha) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(v.fecha) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))';
    }
    
    const [ventasAnterior] = await req.app.locals.pool.query(`
      SELECT COALESCE(SUM(v.total), 0) as total_ventas_anterior
      FROM ventas v
      WHERE 1=1 ${fechaComparacion}
    `, params);
    
    const ventasActuales = parseFloat(totalVentas[0].total_ventas || 0);
    const ventasPrevias = parseFloat(ventasAnterior[0].total_ventas_anterior || 0);
    const comparacionAnterior = ventasPrevias > 0 
      ? ((ventasActuales - ventasPrevias) / ventasPrevias) * 100 
      : 0;
    
    const resumen = {
      totalVentas: ventasActuales,
      totalProductos: parseInt(totalProductos[0].total_productos || 0),
      clientesAtendidos: parseInt(totalVentas[0].clientes_atendidos || 0),
      ticketPromedio: parseFloat(totalVentas[0].ticket_promedio || 0),
      numeroVentas: parseInt(totalVentas[0].numero_ventas || 0),
      comparacionAnterior: parseFloat(comparacionAnterior.toFixed(2)),
      periodo: periodo
    };
    
    console.log(`Resumen dashboard generado para periodo: ${periodo}`);
    res.status(200).json(resumen);
  } catch (error) {
    console.error('Error al generar resumen dashboard:', error);
    res.status(500).json({ message: 'Error al generar resumen', error: error.message });
  }
});

// GET /api/reportes/debug-productos - Endpoint de debug para ver productos
router.get('/debug-productos', async (req, res) => {
  try {
    console.log('=== DEBUG PRODUCTOS ===');

    // Verificar productos básicos
    const [productos] = await req.app.locals.pool.query(`
      SELECT id, nombre, codigo, precio_venta, stock, categoria_id
      FROM productos
      LIMIT 10
    `);

    console.log('Productos encontrados:', productos.length);
    console.log('Productos:', productos);

    // Verificar categorías
    const [categorias] = await req.app.locals.pool.query(`
      SELECT id, nombre FROM categorias LIMIT 10
    `);

    console.log('Categorías encontradas:', categorias.length);
    console.log('Categorías:', categorias);

    // Verificar estructura de tablas
    const [tablas] = await req.app.locals.pool.query(`
      SHOW TABLES
    `);

    console.log('Tablas en la BD:', tablas);

    res.json({
      productos: productos,
      categorias: categorias,
      tablas: tablas
    });

  } catch (error) {
    console.error('Error en debug productos:', error);
    res.status(500).json({ message: 'Error en debug', error: error.message });
  }
});

module.exports = router;