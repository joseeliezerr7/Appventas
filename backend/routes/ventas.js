const express = require('express');
const router = express.Router();

// GET /api/ventas - Obtener todas las ventas
router.get('/', async (req, res) => {
  try {
    const [ventas] = await req.app.locals.pool.query(`
      SELECT v.*, 
             c.nombre as cliente_nombre,
             u.nombre as vendedor_nombre,
             COALESCE(SUM(vd.cantidad), 0) as total_productos
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      LEFT JOIN venta_detalles vd ON v.id = vd.venta_id
      GROUP BY v.id, c.nombre, u.nombre
      ORDER BY v.fecha DESC
    `);
    
    // Asegurar que total sea un número en todas las ventas
    for (const venta of ventas) {
      venta.total = parseFloat(venta.total || 0);
    }
    
    console.log(`Se encontraron ${ventas.length} ventas`);
    res.status(200).json(ventas);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ message: 'Error al obtener ventas', error: error.message });
  }
});

// GET /api/ventas/:id - Obtener una venta por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener la venta
    const [ventas] = await req.app.locals.pool.query(`
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
    
    if (ventas.length === 0) {
      return res.status(404).json({ message: `Venta con ID ${id} no encontrada` });
    }
    
    const venta = ventas[0];
    
    // Asegurar que total sea un número
    venta.total = parseFloat(venta.total || 0);
    
    // Obtener los detalles de la venta
    const [detalles] = await req.app.locals.pool.query(`
      SELECT vd.*, 
             p.nombre as producto_nombre,
             p.codigo as producto_codigo,
             COALESCE(vd.unidad_nombre, um.nombre, 'Unidad') as unidad_nombre
      FROM venta_detalles vd
      LEFT JOIN productos p ON vd.producto_id = p.id
      LEFT JOIN unidades_medida um ON vd.unidad_id = um.id
      WHERE vd.venta_id = ?
    `, [id]);
    
    // Agregar los detalles a la venta
    venta.items = detalles;
    
    res.status(200).json(venta);
  } catch (error) {
    console.error(`Error al obtener venta con ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al obtener venta', error: error.message });
  }
});

// POST /api/ventas - Crear una nueva venta
router.post('/', async (req, res) => {
  try {
    const { 
      cliente_id, 
      usuario_id, 
      fecha, 
      total, 
      metodo_pago, 
      estado, 
      notas, 
      items 
    } = req.body;
    
    // Validar datos requeridos
    if (!cliente_id || !usuario_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        message: 'Datos incompletos para crear la venta. Se requiere cliente_id, usuario_id e items.' 
      });
    }
    
    // Iniciar transacción
    const connection = await req.app.locals.pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Insertar la venta
      const [resultVenta] = await connection.query(`
        INSERT INTO ventas (cliente_id, usuario_id, fecha, total, metodo_pago, estado, notas)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        cliente_id,
        usuario_id,
        fecha || new Date(),
        total || 0,
        metodo_pago || 'Efectivo',
        estado || 'completada',
        notas || null
      ]);
      
      const ventaId = resultVenta.insertId;
      console.log(`Venta creada con ID: ${ventaId}`);
      
      // Insertar los detalles de la venta y actualizar stock
      let totalCalculado = 0;
      
      for (const item of items) {
        const { producto_id, cantidad, precio_unitario, unidad_id, factor_conversion } = item;
        
        // console.log('=== PROCESANDO ITEM DE VENTA ===');
        // console.log('Item completo:', JSON.stringify(item, null, 2));
        
        if (!producto_id || !cantidad || !precio_unitario) {
          throw new Error('Datos incompletos para un item de la venta');
        }
        
        const subtotal = cantidad * precio_unitario;
        totalCalculado += subtotal;
        
        // Obtener información de la unidad
        let unidad_nombre = null;
        let unidad_medida_id = null;
        
        if (unidad_id) {
          // El frontend envía el ID de producto_unidades, necesitamos obtener el unidad_id real
          const [prodUnidadInfo] = await connection.query(`
            SELECT pu.unidad_id, um.nombre as unidad_nombre
            FROM producto_unidades pu
            LEFT JOIN unidades_medida um ON pu.unidad_id = um.id
            WHERE pu.id = ?
          `, [unidad_id]);
          
          if (prodUnidadInfo.length > 0) {
            unidad_medida_id = prodUnidadInfo[0].unidad_id;
            unidad_nombre = prodUnidadInfo[0].unidad_nombre;
            // console.log(`Unidad encontrada: ID=${unidad_medida_id}, Nombre=${unidad_nombre}`);
          }
        }
        
        // Insertar detalle de venta con información de unidad
        const insertValues = [ventaId, producto_id, cantidad, precio_unitario, subtotal, unidad_medida_id || null, factor_conversion || 1, unidad_nombre];
        // console.log('=== INSERTANDO EN venta_detalles ===');
        // console.log('Valores a insertar:', insertValues);
        
        await connection.query(`
          INSERT INTO venta_detalles (venta_id, producto_id, cantidad, precio_unitario, subtotal, unidad_id, factor_conversion, unidad_nombre)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, insertValues);
        
        // Actualizar stock del producto
        if (unidad_id && factor_conversion) {
          // Actualizar stock de la unidad específica que se vendió (usando el ID de producto_unidades)
          const [unidadEspecifica] = await connection.query(`
            SELECT * FROM producto_unidades 
            WHERE id = ?
          `, [unidad_id]);
          
          if (unidadEspecifica.length > 0) {
            const unidad = unidadEspecifica[0];
            const nuevoStock = Math.max(0, unidad.stock - cantidad);
            
            // Actualizar stock de la unidad específica
            await connection.query(`
              UPDATE producto_unidades 
              SET stock = ? 
              WHERE id = ?
            `, [nuevoStock, unidad.id]);
            
            console.log(`Stock actualizado para producto ${producto_id}, unidad específica ${unidad.id} (${unidad_nombre}): ${unidad.stock} -> ${nuevoStock}`);
          }
        } else {
          // Fallback: usar unidad principal si no se especificó unidad
          const [unidades] = await connection.query(`
            SELECT * FROM producto_unidades 
            WHERE producto_id = ? 
            ORDER BY es_unidad_principal DESC, factor_conversion ASC 
            LIMIT 1
          `, [producto_id]);
          
          if (unidades.length > 0) {
            const unidad = unidades[0];
            const nuevoStock = Math.max(0, unidad.stock - cantidad);
            
            // Actualizar stock de la unidad
            await connection.query(`
              UPDATE producto_unidades 
              SET stock = ? 
              WHERE id = ?
            `, [nuevoStock, unidad.id]);
            
            console.log(`Stock actualizado para producto ${producto_id}, unidad principal ${unidad.id}: ${unidad.stock} -> ${nuevoStock}`);
          }
        }
        
        // Recalcular stock total del producto
        if (typeof req.app.locals.recalcularStockTotal === 'function') {
          await req.app.locals.recalcularStockTotal(connection, producto_id);
        }
      }
      
      // Actualizar el total de la venta si es diferente al calculado
      if (total !== totalCalculado) {
        await connection.query(`
          UPDATE ventas SET total = ? WHERE id = ?
        `, [totalCalculado, ventaId]);
        
        console.log(`Total de venta ${ventaId} actualizado a ${totalCalculado}`);
      }
      
      // Confirmar transacción
      await connection.commit();
      
      // Obtener la venta completa con sus detalles
      const [ventaCreada] = await connection.query(`
        SELECT v.*, 
               c.nombre as cliente_nombre,
               c.direccion as cliente_direccion,
               c.telefono as cliente_telefono,
               u.nombre as vendedor_nombre
        FROM ventas v
        LEFT JOIN clientes c ON v.cliente_id = c.id
        LEFT JOIN usuarios u ON v.usuario_id = u.id
        WHERE v.id = ?
      `, [ventaId]);
      
      const [detallesCreados] = await connection.query(`
        SELECT vd.*, 
               p.nombre as producto_nombre,
               p.codigo as producto_codigo,
               COALESCE(vd.unidad_nombre, um.nombre, 'Unidad') as unidad_nombre
        FROM venta_detalles vd
        LEFT JOIN productos p ON vd.producto_id = p.id
        LEFT JOIN unidades_medida um ON vd.unidad_id = um.id
        WHERE vd.venta_id = ?
      `, [ventaId]);
      
      // Liberar conexión
      connection.release();
      
      // Devolver respuesta
      res.status(201).json({
        ...ventaCreada[0],
        items: detallesCreados
      });
    } catch (error) {
      // Revertir transacción en caso de error
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error al crear venta:', error);
    res.status(500).json({ message: 'Error al crear venta', error: error.message });
  }
});

// PUT /api/ventas/:id/cancelar - Cancelar una venta
router.put('/:id/cancelar', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que la venta existe
    const [ventaExistente] = await req.app.locals.pool.query(`
      SELECT * FROM ventas WHERE id = ?
    `, [id]);
    
    if (ventaExistente.length === 0) {
      return res.status(404).json({ message: `Venta con ID ${id} no encontrada` });
    }
    
    // Verificar que la venta no esté ya cancelada
    if (ventaExistente[0].estado === 'cancelada') {
      return res.status(400).json({ message: `La venta con ID ${id} ya está cancelada` });
    }
    
    // Iniciar transacción
    const connection = await req.app.locals.pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Obtener los detalles de la venta
      const [detalles] = await connection.query(`
        SELECT * FROM venta_detalles WHERE venta_id = ?
      `, [id]);
      
      // Restaurar el stock de los productos
      for (const detalle of detalles) {
        const { producto_id, cantidad } = detalle;
        
        // Obtener la unidad base del producto
        const [unidades] = await connection.query(`
          SELECT * FROM producto_unidades 
          WHERE producto_id = ? 
          ORDER BY es_unidad_principal DESC, factor_conversion ASC 
          LIMIT 1
        `, [producto_id]);
        
        if (unidades.length > 0) {
          const unidad = unidades[0];
          const nuevoStock = unidad.stock + cantidad;
          
          // Actualizar stock de la unidad
          await connection.query(`
            UPDATE producto_unidades 
            SET stock = ? 
            WHERE id = ?
          `, [nuevoStock, unidad.id]);
          
          console.log(`Stock restaurado para producto ${producto_id}, unidad ${unidad.id}: ${unidad.stock} -> ${nuevoStock}`);
          
          // Recalcular stock total
          if (typeof req.app.locals.recalcularStockTotal === 'function') {
            await req.app.locals.recalcularStockTotal(connection, producto_id);
          }
        }
      }
      
      // Actualizar estado de la venta
      await connection.query(`
        UPDATE ventas SET estado = 'cancelada' WHERE id = ?
      `, [id]);
      
      console.log(`Venta con ID ${id} cancelada`);
      
      // Confirmar transacción
      await connection.commit();
      
      // Obtener la venta actualizada
      const [ventaActualizada] = await connection.query(`
        SELECT v.*, 
               c.nombre as cliente_nombre,
               u.nombre as vendedor_nombre
        FROM ventas v
        LEFT JOIN clientes c ON v.cliente_id = c.id
        LEFT JOIN usuarios u ON v.usuario_id = u.id
        WHERE v.id = ?
      `, [id]);
      
      // Liberar conexión
      connection.release();
      
      res.status(200).json({
        ...ventaActualizada[0],
        message: `Venta con ID ${id} cancelada correctamente`
      });
    } catch (error) {
      // Revertir transacción en caso de error
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error(`Error al cancelar venta con ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al cancelar venta', error: error.message });
  }
});

// PUT /api/ventas/:id/actualizar-por-devolucion - Actualizar una venta por devolución
router.put('/:id/actualizar-por-devolucion', async (req, res) => {
  try {
    const { id } = req.params;
    const { items_devueltos } = req.body;
    
    // Validar datos requeridos
    if (!items_devueltos || !Array.isArray(items_devueltos) || items_devueltos.length === 0) {
      return res.status(400).json({ message: 'Se requieren los items devueltos' });
    }
    
    // Verificar que la venta existe
    const [ventaExistente] = await req.app.locals.pool.query(`
      SELECT * FROM ventas WHERE id = ?
    `, [id]);
    
    if (ventaExistente.length === 0) {
      return res.status(404).json({ message: `Venta con ID ${id} no encontrada` });
    }
    
    // Iniciar transacción
    const connection = await req.app.locals.pool.getConnection();
    await connection.beginTransaction();
    
    try {
      let totalDevuelto = 0;
      
      // Procesar cada item devuelto
      for (const item of items_devueltos) {
        const { producto_id, cantidad, precio_unitario } = item;
        
        if (!producto_id || !cantidad || !precio_unitario) {
          throw new Error('Datos incompletos para un item devuelto');
        }
        
        const subtotal = cantidad * precio_unitario;
        totalDevuelto += subtotal;
      }
      
      // Actualizar el total de la venta y cambiar estado a devuelto
      const nuevoTotal = Math.max(0, ventaExistente[0].total - totalDevuelto);
      
      // Determinar el nuevo estado: si el total llega a 0, es "devuelto", sino "parcialmente_devuelto"
      let nuevoEstado = ventaExistente[0].estado;
      if (nuevoTotal === 0) {
        nuevoEstado = 'devuelto';
      } else if (totalDevuelto > 0) {
        nuevoEstado = 'parcialmente_devuelto';
      }
      
      await connection.query(`
        UPDATE ventas SET total = ?, estado = ? WHERE id = ?
      `, [nuevoTotal, nuevoEstado, id]);
      
      console.log(`Venta ${id} actualizada: total ${ventaExistente[0].total} -> ${nuevoTotal}, estado -> ${nuevoEstado}`);
      
      // Confirmar transacción
      await connection.commit();
      
      // Obtener la venta actualizada
      const [ventaActualizada] = await connection.query(`
        SELECT v.*, 
               c.nombre as cliente_nombre,
               u.nombre as vendedor_nombre
        FROM ventas v
        LEFT JOIN clientes c ON v.cliente_id = c.id
        LEFT JOIN usuarios u ON v.usuario_id = u.id
        WHERE v.id = ?
      `, [id]);
      
      // Liberar conexión
      connection.release();
      
      res.status(200).json({
        ...ventaActualizada[0],
        message: `Venta con ID ${id} actualizada por devolución correctamente`
      });
    } catch (error) {
      // Revertir transacción en caso de error
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error(`Error al actualizar venta con ID ${req.params.id} por devolución:`, error);
    res.status(500).json({ message: 'Error al actualizar venta por devolución', error: error.message });
  }
});

module.exports = router;
