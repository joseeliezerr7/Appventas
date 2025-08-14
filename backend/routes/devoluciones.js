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
    
    res.status(200).json(devoluciones[0]);
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
    const { venta_id, usuario_id, total, motivo } = req.body;
    
    // Validar datos requeridos
    if (!venta_id || !total) {
      return res.status(400).json({ 
        message: 'Datos incompletos para crear la devolución. Se requiere venta_id y total.' 
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
      
      // Liberar conexión
      connection.release();
      
      res.status(201).json(devolucionCreada[0]);
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
