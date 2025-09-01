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

// GET /api/devoluciones/venta/:ventaId - Obtener devoluciones por venta ID
router.get('/venta/:ventaId', async (req, res) => {
  try {
    const { ventaId } = req.params;
    
    const [devoluciones] = await req.app.locals.pool.query(`
      SELECT d.*, 
             v.fecha as venta_fecha,
             c.nombre as cliente_nombre,
             u.nombre as usuario_nombre
      FROM devoluciones d
      LEFT JOIN ventas v ON d.venta_id = v.id
      LEFT JOIN clientes c ON v.cliente_id = c.id
      LEFT JOIN usuarios u ON d.usuario_id = u.id
      WHERE d.venta_id = ?
      ORDER BY d.fecha DESC
    `, [ventaId]);
    
    console.log(`Se encontraron ${devoluciones.length} devoluciones para la venta ${ventaId}`);
    res.status(200).json(devoluciones);
  } catch (error) {
    console.error(`Error al obtener devoluciones para venta ${req.params.ventaId}:`, error);
    res.status(500).json({ message: 'Error al obtener devoluciones', error: error.message });
  }
});

// POST /api/devoluciones - Crear una nueva devolución
router.post('/', async (req, res) => {
  try {
    const { venta_id, usuario_id, total, motivo, items } = req.body;
    
    console.log('=== DATOS RECIBIDOS PARA CREAR DEVOLUCIÓN ===');
    console.log('venta_id:', venta_id);
    console.log('usuario_id:', usuario_id);
    console.log('total:', total);
    console.log('motivo:', motivo);
    console.log('items:', JSON.stringify(items, null, 2));
    console.log('items es array:', Array.isArray(items));
    console.log('items length:', items ? items.length : 'N/A');
    
    // Validar datos requeridos
    if (!venta_id || !total || !items || !Array.isArray(items) || items.length === 0) {
      console.log('ERROR: Datos incompletos detectados');
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
      console.log(`Devolución creada con ID: ${devolucionId}`);
      
      console.log(`=== PROCESANDO ${items.length} ITEMS PARA DEVOLUCIÓN ${devolucionId} ===`);
      
      // Insertar los detalles de la devolución y restaurar stock
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        console.log(`--- Procesando item ${i + 1}/${items.length} ---`);
        const { producto_id, cantidad, precio_unitario, unidad_id, factor_conversion } = item;
        
        console.log('Procesando item de devolución:', {
          producto_id, 
          cantidad, 
          precio_unitario, 
          unidad_id, 
          factor_conversion,
          item_completo: JSON.stringify(item, null, 2)
        });
        
        if (!producto_id || !cantidad || !precio_unitario) {
          throw new Error(`Datos incompletos para un item de la devolución: producto_id=${producto_id}, cantidad=${cantidad}, precio_unitario=${precio_unitario}`);
        }
        
        const subtotal = cantidad * precio_unitario;
        
        // PARCHE: Buscar la unidad correcta desde la venta original
        // Obtener la información real de la venta original
        const [ventaOriginal] = await connection.query(`
          SELECT vd.unidad_id as venta_unidad_id, vd.unidad_nombre as venta_unidad_nombre, vd.factor_conversion
          FROM venta_detalles vd
          WHERE vd.venta_id = ? AND vd.producto_id = ?
          ORDER BY vd.id DESC
          LIMIT 1
        `, [venta_id, producto_id]);
        
        let unidad_nombre = item.unidad_nombre || 'Unidad';
        let unidad_medida_id = null;
        let unidad_id_real = unidad_id; // Usar el del frontend por defecto
        
        if (ventaOriginal.length > 0) {
          // Sobrescribir con datos de la venta original
          unidad_id_real = ventaOriginal[0].venta_unidad_id;
          unidad_nombre = ventaOriginal[0].venta_unidad_nombre || unidad_nombre;
          console.log('PARCHE: Usando datos de venta original:', {
            venta_unidad_id: ventaOriginal[0].venta_unidad_id,
            venta_unidad_nombre: ventaOriginal[0].venta_unidad_nombre,
            frontend_unidad_id: unidad_id,
            frontend_unidad_nombre: item.unidad_nombre
          });
        }
        
        console.log('Información de unidad recibida del frontend:', {
          unidad_id,
          unidad_nombre,
          factor_conversion
        });
        
        console.log('Información de unidad REAL a usar:', {
          unidad_id_real,
          unidad_nombre,
          factor_conversion
        });
        
        if (unidad_id_real) {
          // El frontend envía el ID de producto_unidades, obtener la información completa
          try {
            const [prodUnidadInfo] = await connection.query(`
              SELECT pu.unidad_id, um.nombre as unidad_nombre, pu.id as producto_unidad_id, pu.factor_conversion
              FROM producto_unidades pu
              LEFT JOIN unidades_medida um ON pu.unidad_id = um.id
              WHERE pu.id = ?
            `, [unidad_id_real]);
            
            if (prodUnidadInfo.length > 0) {
              unidad_medida_id = prodUnidadInfo[0].unidad_id;
              unidad_nombre = prodUnidadInfo[0].unidad_nombre;
              console.log('Información de unidad obtenida de BD:', { 
                producto_unidad_id: prodUnidadInfo[0].producto_unidad_id,
                unidad_medida_id, 
                unidad_nombre,
                factor_conversion_bd: prodUnidadInfo[0].factor_conversion
              });
            } else {
              console.log('No se encontró información de unidad para unidad_id_real:', unidad_id_real);
              console.log('Usando datos del frontend como fallback');
              // Mantener el unidad_nombre del frontend
              unidad_nombre = item.unidad_nombre || 'Unidad';
            }
          } catch (error) {
            console.error('Error al obtener información de unidad:', error);
            console.log('Usando datos del frontend como fallback');
          }
        } else {
          console.log('No hay unidad_id, usando unidad_nombre del frontend:', unidad_nombre);
        }
        
        // Insertar detalle de devolución
        console.log('Insertando detalle con valores:', {
          devolucionId, 
          producto_id, 
          cantidad, 
          precio_unitario, 
          subtotal, 
          unidad_medida_id: unidad_medida_id || null, 
          factor_conversion: factor_conversion || 1, 
          unidad_nombre
        });
        
        const insertResult = await connection.query(`
          INSERT INTO devolucion_detalles (devolucion_id, producto_id, cantidad, precio_unitario, subtotal, unidad_id, factor_conversion, unidad_nombre)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [devolucionId, producto_id, cantidad, precio_unitario, subtotal, unidad_medida_id || null, factor_conversion || 1, unidad_nombre]);
        
        console.log('Detalle insertado, ID:', insertResult[0].insertId);
        
        // Restaurar stock del producto - usar unidad_id_real
        console.log('=== INICIANDO RESTAURACIÓN DE STOCK ===');
        console.log('unidad_id_real a usar:', unidad_id_real);
        console.log('factor_conversion recibido:', factor_conversion);
        
        let unidadParaRestaurar = null;
        
        if (unidad_id_real) {
          // Usar la unidad real (de la venta original)
          console.log('Buscando unidad para restaurar con ID:', unidad_id_real);
          const [unidadReal] = await connection.query(`
            SELECT * FROM producto_unidades 
            WHERE id = ?
          `, [unidad_id_real]);
          
          if (unidadReal.length > 0) {
            unidadParaRestaurar = unidadReal[0];
            console.log('Unidad encontrada para restaurar:', unidadParaRestaurar);
          } else {
            console.log('No se encontró unidad con ID:', unidad_id_real);
          }
        }
        
        if (unidadParaRestaurar) {
          const nuevoStock = unidadParaRestaurar.stock + cantidad;
          
          // Actualizar stock de la unidad específica
          await connection.query(`
            UPDATE producto_unidades 
            SET stock = ? 
            WHERE id = ?
          `, [nuevoStock, unidadParaRestaurar.id]);
          
          console.log(`✅ Stock restaurado para producto ${producto_id}, unidad ${unidadParaRestaurar.id}: ${unidadParaRestaurar.stock} -> ${nuevoStock}`);
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
            const nuevoStock = unidad.stock + cantidad;
            
            // Actualizar stock de la unidad
            await connection.query(`
              UPDATE producto_unidades 
              SET stock = ? 
              WHERE id = ?
            `, [nuevoStock, unidad.id]);
            
            console.log(`Stock restaurado para producto ${producto_id}, unidad principal ${unidad.id}: ${unidad.stock} -> ${nuevoStock}`);
          }
        }
        
        // Recalcular stock total del producto
        if (typeof req.app.locals.recalcularStockTotal === 'function') {
          await req.app.locals.recalcularStockTotal(connection, producto_id);
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
      
      // Liberar conexión
      connection.release();
      
      const respuesta = {
        ...devolucionCreada[0],
        items: detallesCreados
      };
      
      res.status(201).json(respuesta);
    } catch (error) {
      // Revertir transacción en caso de error
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error al crear devolución:', error);
    res.status(500).json({ message: 'Error al crear devolución', error: error.message });
  }
});

// DELETE /api/devoluciones/:id - Eliminar una devolución
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Iniciar transacción
    const connection = await req.app.locals.pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Obtener la devolución
      const [devoluciones] = await connection.query(`
        SELECT * FROM devoluciones WHERE id = ?
      `, [id]);
      
      if (devoluciones.length === 0) {
        await connection.release();
        return res.status(404).json({ message: `Devolución con ID ${id} no encontrada` });
      }
      
      // Eliminar la devolución
      await connection.query(`
        DELETE FROM devoluciones WHERE id = ?
      `, [id]);
      
      console.log(`Devolución con ID ${id} eliminada`);
      
      // Confirmar transacción
      await connection.commit();
      connection.release();
      
      res.status(200).json({ message: `Devolución con ID ${id} eliminada correctamente` });
    } catch (error) {
      // Revertir transacción en caso de error
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
