const express = require('express');
const router = express.Router();

// GET /api/devoluciones - Obtener todas las devoluciones
router.get('/', async (req, res) => {
  try {
    const [devoluciones] = await req.app.locals.pool.query(`
      SELECT d.*, 
             v.fecha as venta_fecha,
             c.nombre as cliente_nombre,
             u.nombre as usuario_nombre
      FROM devoluciones d
      LEFT JOIN ventas v ON d.venta_id = v.id
      LEFT JOIN clientes c ON v.cliente_id = c.id
      LEFT JOIN usuarios u ON d.usuario_id = u.id
      ORDER BY d.fecha DESC
    `);
    
    console.log(`Se encontraron ${devoluciones.length} devoluciones`);
    res.status(200).json(devoluciones);
  } catch (error) {
    console.error('Error al obtener devoluciones:', error);
    res.status(500).json({ message: 'Error al obtener devoluciones', error: error.message });
  }
});

// GET /api/devoluciones/:id - Obtener una devolución por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener la devolución
    const [devoluciones] = await req.app.locals.pool.query(`
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
    
    if (devoluciones.length === 0) {
      return res.status(404).json({ message: `Devolución con ID ${id} no encontrada` });
    }
    
    const devolucion = devoluciones[0];
    
    // Obtener los detalles de la devolución
    const [detalles] = await req.app.locals.pool.query(`
      SELECT dd.*, 
             p.nombre as producto_nombre,
             p.codigo as producto_codigo,
             COALESCE(dd.unidad_nombre, um.nombre, 'Unidad') as unidad_nombre
      FROM devolucion_detalles dd
      LEFT JOIN productos p ON dd.producto_id = p.id
      LEFT JOIN unidades_medida um ON dd.unidad_id = um.id
      WHERE dd.devolucion_id = ?
    `, [id]);
    
    // Agregar los detalles a la devolución
    devolucion.items = detalles;
    
    res.status(200).json(devolucion);
  } catch (error) {
    console.error(`Error al obtener devolución con ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al obtener devolución', error: error.message });
  }
});

// POST /api/devoluciones - Crear una nueva devolución
router.post('/', async (req, res) => {
  try {
    const { venta_id, usuario_id, total, motivo, items } = req.body;
    
    console.log('🔄 CREANDO DEVOLUCIÓN AUTOMÁTICA');
    console.log('venta_id:', venta_id, 'items:', items?.length || 0);
    
    // Validar datos requeridos
    if (!venta_id || !total || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        message: 'Datos incompletos para crear la devolución. Se requiere venta_id, total e items.' 
      });
    }
    
    // Iniciar transacción
    const connection = await req.app.locals.pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Verificar que la venta existe
      const [ventas] = await connection.query(`
        SELECT * FROM ventas WHERE id = ?
      `, [venta_id]);
      
      if (ventas.length === 0) {
        await connection.release();
        return res.status(404).json({ message: `Venta con ID ${venta_id} no encontrada` });
      }
      
      // Insertar la devolución
      const [resultDevolucion] = await connection.query(`
        INSERT INTO devoluciones (venta_id, usuario_id, total, motivo, fecha, creado_en)
        VALUES (?, ?, ?, ?, NOW(), NOW())
      `, [venta_id, usuario_id || req.user?.id, total, motivo || null]);
      
      const devolucionId = resultDevolucion.insertId;
      console.log(`✅ Devolución creada con ID: ${devolucionId}`);
      
      // Procesar cada item
      for (const item of items) {
        const { producto_id, cantidad, precio_unitario } = item;
        
        if (!producto_id || !cantidad || !precio_unitario) {
          throw new Error('Datos incompletos para un item de la devolución');
        }
        
        const subtotal = cantidad * precio_unitario;
        
        console.log(`🔍 Procesando producto ${producto_id}, cantidad: ${cantidad}`);
        
        // PASO 1: Buscar la unidad de la venta original AUTOMÁTICAMENTE
        const [ventaOriginal] = await connection.query(`
          SELECT vd.unidad_id, vd.unidad_nombre, vd.factor_conversion, um.nombre as unidad_medida_nombre
          FROM venta_detalles vd
          LEFT JOIN unidades_medida um ON vd.unidad_id = um.id
          WHERE vd.venta_id = ? AND vd.producto_id = ?
          ORDER BY vd.id DESC
          LIMIT 1
        `, [venta_id, producto_id]);
        
        let unidad_id_correcta = null;
        let unidad_nombre_correcta = 'Unidad';
        let unidad_medida_id = null;
        
        if (ventaOriginal.length > 0) {
          unidad_id_correcta = ventaOriginal[0].unidad_id;
          unidad_nombre_correcta = ventaOriginal[0].unidad_nombre || ventaOriginal[0].unidad_medida_nombre || 'Unidad';
          
          // Obtener el unidad_medida_id
          const [unidadInfo] = await connection.query(`
            SELECT pu.unidad_id
            FROM producto_unidades pu
            WHERE pu.id = ?
          `, [unidad_id_correcta]);
          
          if (unidadInfo.length > 0) {
            unidad_medida_id = unidadInfo[0].unidad_id;
          }
          
          console.log(`🎯 UNIDAD ENCONTRADA AUTOMÁTICAMENTE: ${unidad_nombre_correcta} (ID: ${unidad_id_correcta})`);
        } else {
          console.log('⚠️  No se encontró la venta original, usando unidad por defecto');
        }
        
        // PASO 2: Insertar detalle con la unidad correcta
        await connection.query(`
          INSERT INTO devolucion_detalles (devolucion_id, producto_id, cantidad, precio_unitario, subtotal, unidad_id, factor_conversion, unidad_nombre)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [devolucionId, producto_id, cantidad, precio_unitario, subtotal, unidad_medida_id, item.factor_conversion || 1, unidad_nombre_correcta]);
        
        console.log(`📝 Detalle guardado con unidad: ${unidad_nombre_correcta}`);
        
        // PASO 3: Restaurar stock AUTOMÁTICAMENTE en la unidad correcta
        if (unidad_id_correcta) {
          const [unidadStock] = await connection.query(`
            SELECT * FROM producto_unidades WHERE id = ?
          `, [unidad_id_correcta]);
          
          if (unidadStock.length > 0) {
            const stockActual = unidadStock[0].stock;
            const nuevoStock = stockActual + cantidad;
            
            await connection.query(`
              UPDATE producto_unidades 
              SET stock = ? 
              WHERE id = ?
            `, [nuevoStock, unidad_id_correcta]);
            
            console.log(`🔄 STOCK RESTAURADO AUTOMÁTICAMENTE: ${unidad_nombre_correcta} de ${stockActual} a ${nuevoStock}`);
          }
        } else {
          console.log('⚠️  No se pudo restaurar el stock - unidad no encontrada');
        }
        
        // PASO 4: Recalcular stock total
        if (typeof req.app.locals.recalcularStockTotal === 'function') {
          await req.app.locals.recalcularStockTotal(connection, producto_id);
          console.log(`📊 Stock total recalculado para producto ${producto_id}`);
        }
      }
      
      // Confirmar transacción
      await connection.commit();
      
      // Obtener la devolución creada con datos adicionales
      const [devolucionCreada] = await connection.query(`
        SELECT d.*, 
               v.fecha as venta_fecha,
               c.nombre as cliente_nombre,
               u.nombre as usuario_nombre
        FROM devoluciones d
        LEFT JOIN ventas v ON d.venta_id = v.id
        LEFT JOIN clientes c ON v.cliente_id = c.id
        LEFT JOIN usuarios u ON d.usuario_id = u.id
        WHERE d.id = ?
      `, [devolucionId]);
      
      // Obtener los detalles creados
      const [detallesCreados] = await connection.query(`
        SELECT dd.*, 
               p.nombre as producto_nombre,
               p.codigo as producto_codigo,
               COALESCE(dd.unidad_nombre, um.nombre, 'Unidad') as unidad_nombre
        FROM devolucion_detalles dd
        LEFT JOIN productos p ON dd.producto_id = p.id
        LEFT JOIN unidades_medida um ON dd.unidad_id = um.id
        WHERE dd.devolucion_id = ?
      `, [devolucionId]);
      
      connection.release();
      
      const respuesta = {
        ...devolucionCreada[0],
        items: detallesCreados
      };
      
      console.log(`✅ DEVOLUCIÓN COMPLETADA AUTOMÁTICAMENTE: ID ${devolucionId}`);
      res.status(201).json(respuesta);
      
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('❌ Error al crear devolución:', error);
    res.status(500).json({ message: 'Error al crear devolución', error: error.message });
  }
});

// DELETE /api/devoluciones/:id - Eliminar una devolución
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const connection = await req.app.locals.pool.getConnection();
    await connection.beginTransaction();
    
    try {
      const [devoluciones] = await connection.query(`
        SELECT * FROM devoluciones WHERE id = ?
      `, [id]);
      
      if (devoluciones.length === 0) {
        await connection.release();
        return res.status(404).json({ message: `Devolución con ID ${id} no encontrada` });
      }
      
      await connection.query(`
        DELETE FROM devoluciones WHERE id = ?
      `, [id]);
      
      console.log(`Devolución con ID ${id} eliminada`);
      
      await connection.commit();
      connection.release();
      
      res.status(200).json({ message: `Devolución con ID ${id} eliminada correctamente` });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error(`Error al eliminar devolución con ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al eliminar devolución', error: error.message });
  }
});

module.exports = router;