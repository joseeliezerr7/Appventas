const express = require('express');
const router = express.Router();

// GET /api/rutas - Obtener todas las rutas
router.get('/', async (req, res) => {
  try {
    const [rutas] = await req.app.locals.pool.query(`
      SELECT r.*, u.nombre as usuario_nombre
      FROM rutas r
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      ORDER BY r.nombre
    `);
    
    console.log(`Se encontraron ${rutas.length} rutas`);
    res.status(200).json(rutas);
  } catch (error) {
    console.error('Error al obtener rutas:', error);
    res.status(500).json({ message: 'Error al obtener rutas', error: error.message });
  }
});

// GET /api/rutas/:id - Obtener una ruta por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener la ruta
    const [rutas] = await req.app.locals.pool.query(`
      SELECT r.*, u.nombre as usuario_nombre
      FROM rutas r
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.id = ?
    `, [id]);
    
    if (rutas.length === 0) {
      return res.status(404).json({ message: `Ruta con ID ${id} no encontrada` });
    }
    
    const ruta = rutas[0];
    
    // Obtener los clientes de la ruta
    const [clientes] = await req.app.locals.pool.query(`
      SELECT rc.*, 
             c.nombre as cliente_nombre,
             c.direccion as cliente_direccion,
             c.telefono as cliente_telefono
      FROM ruta_clientes rc
      LEFT JOIN clientes c ON rc.cliente_id = c.id
      WHERE rc.ruta_id = ?
      ORDER BY rc.orden
    `, [id]);
    
    // Agregar los clientes a la ruta
    ruta.clientes = clientes;
    
    res.status(200).json(ruta);
  } catch (error) {
    console.error(`Error al obtener ruta con ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al obtener ruta', error: error.message });
  }
});

// POST /api/rutas - Crear una nueva ruta
router.post('/', async (req, res) => {
  try {
    const { 
      nombre, 
      descripcion, 
      usuario_id, 
      dias_visita,
      fecha_inicio,
      fecha_fin,
      estado,
      clientes 
    } = req.body;
    
    // Validar datos requeridos
    if (!nombre || !usuario_id) {
      return res.status(400).json({ 
        message: 'Datos incompletos para crear la ruta. Se requiere nombre y usuario_id.' 
      });
    }
    
    // Iniciar transacción
    const connection = await req.app.locals.pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Insertar la ruta
      const [resultRuta] = await connection.query(`
        INSERT INTO rutas (nombre, descripcion, usuario_id, dias_visita, fecha_inicio, fecha_fin, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        nombre,
        descripcion || null,
        usuario_id,
        dias_visita ? JSON.stringify(dias_visita) : null,
        fecha_inicio || null,
        fecha_fin || null,
        estado || 'activa'
      ]);
      
      const rutaId = resultRuta.insertId;
      console.log(`Ruta creada con ID: ${rutaId}`);
      
      // Si se proporcionaron clientes, insertarlos
      if (clientes && Array.isArray(clientes) && clientes.length > 0) {
        for (let i = 0; i < clientes.length; i++) {
          const cliente = clientes[i];
          
          await connection.query(`
            INSERT INTO ruta_clientes (ruta_id, cliente_id, orden, notas)
            VALUES (?, ?, ?, ?)
          `, [
            rutaId,
            cliente.id || cliente.cliente_id, // Aceptar tanto 'id' como 'cliente_id'
            cliente.orden || i + 1,
            cliente.notas || null
          ]);
        }
        
        console.log(`Se agregaron ${clientes.length} clientes a la ruta ${rutaId}`);
      }
      
      // Confirmar transacción
      await connection.commit();
      
      // Obtener la ruta creada con sus clientes
      const [rutaCreada] = await connection.query(`
        SELECT r.*, u.nombre as usuario_nombre
        FROM rutas r
        LEFT JOIN usuarios u ON r.usuario_id = u.id
        WHERE r.id = ?
      `, [rutaId]);
      
      const [clientesRuta] = await connection.query(`
        SELECT rc.*, 
               c.nombre as cliente_nombre,
               c.direccion as cliente_direccion,
               c.telefono as cliente_telefono
        FROM ruta_clientes rc
        LEFT JOIN clientes c ON rc.cliente_id = c.id
        WHERE rc.ruta_id = ?
        ORDER BY rc.orden
      `, [rutaId]);
      
      // Liberar conexión
      connection.release();
      
      // Devolver respuesta
      res.status(201).json({
        ...rutaCreada[0],
        clientes: clientesRuta
      });
    } catch (error) {
      // Revertir transacción en caso de error
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error al crear ruta:', error);
    res.status(500).json({ message: 'Error al crear ruta', error: error.message });
  }
});

// PUT /api/rutas/:id - Actualizar una ruta
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nombre, 
      descripcion, 
      usuario_id, 
      dias_visita,
      fecha_inicio,
      fecha_fin,
      estado,
      clientes 
    } = req.body;
    
    // Validar datos requeridos
    if (!nombre || !usuario_id) {
      return res.status(400).json({ 
        message: 'Datos incompletos para actualizar la ruta. Se requiere nombre y usuario_id.' 
      });
    }
    
    // Verificar que la ruta existe
    const [rutaExistente] = await req.app.locals.pool.query(`
      SELECT * FROM rutas WHERE id = ?
    `, [id]);
    
    if (rutaExistente.length === 0) {
      return res.status(404).json({ message: `Ruta con ID ${id} no encontrada` });
    }
    
    // Iniciar transacción
    const connection = await req.app.locals.pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Actualizar la ruta
      await connection.query(`
        UPDATE rutas
        SET nombre = ?, descripcion = ?, usuario_id = ?, dias_visita = ?, fecha_inicio = ?, fecha_fin = ?, estado = ?
        WHERE id = ?
      `, [
        nombre,
        descripcion || null,
        usuario_id,
        dias_visita ? JSON.stringify(dias_visita) : null,
        fecha_inicio || null,
        fecha_fin || null,
        estado || 'activa',
        id
      ]);
      
      console.log(`Ruta con ID ${id} actualizada`);
      
      // Si se proporcionaron clientes, actualizar
      if (clientes && Array.isArray(clientes)) {
        // Eliminar clientes actuales
        await connection.query(`
          DELETE FROM ruta_clientes WHERE ruta_id = ?
        `, [id]);
        
        // Insertar nuevos clientes
        for (let i = 0; i < clientes.length; i++) {
          const cliente = clientes[i];
          
          await connection.query(`
            INSERT INTO ruta_clientes (ruta_id, cliente_id, orden, notas)
            VALUES (?, ?, ?, ?)
          `, [
            id,
            cliente.cliente_id,
            cliente.orden || i + 1,
            cliente.notas || null
          ]);
        }
        
        console.log(`Se actualizaron ${clientes.length} clientes para la ruta ${id}`);
      }
      
      // Confirmar transacción
      await connection.commit();
      
      // Obtener la ruta actualizada con sus clientes
      const [rutaActualizada] = await connection.query(`
        SELECT r.*, u.nombre as usuario_nombre
        FROM rutas r
        LEFT JOIN usuarios u ON r.usuario_id = u.id
        WHERE r.id = ?
      `, [id]);
      
      const [clientesRuta] = await connection.query(`
        SELECT rc.*, 
               c.nombre as cliente_nombre,
               c.direccion as cliente_direccion,
               c.telefono as cliente_telefono
        FROM ruta_clientes rc
        LEFT JOIN clientes c ON rc.cliente_id = c.id
        WHERE rc.ruta_id = ?
        ORDER BY rc.orden
      `, [id]);
      
      // Liberar conexión
      connection.release();
      
      // Devolver respuesta
      res.status(200).json({
        ...rutaActualizada[0],
        clientes: clientesRuta
      });
    } catch (error) {
      // Revertir transacción en caso de error
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error(`Error al actualizar ruta con ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al actualizar ruta', error: error.message });
  }
});

// DELETE /api/rutas/:id - Eliminar una ruta
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que la ruta existe
    const [rutaExistente] = await req.app.locals.pool.query(`
      SELECT * FROM rutas WHERE id = ?
    `, [id]);
    
    if (rutaExistente.length === 0) {
      return res.status(404).json({ message: `Ruta con ID ${id} no encontrada` });
    }
    
    // Iniciar transacción
    const connection = await req.app.locals.pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Eliminar clientes de la ruta
      await connection.query(`
        DELETE FROM ruta_clientes WHERE ruta_id = ?
      `, [id]);
      
      // Eliminar la ruta
      await connection.query(`
        DELETE FROM rutas WHERE id = ?
      `, [id]);
      
      console.log(`Ruta con ID ${id} eliminada`);
      
      // Confirmar transacción
      await connection.commit();
      connection.release();
      
      res.status(200).json({ message: `Ruta con ID ${id} eliminada correctamente` });
    } catch (error) {
      // Revertir transacción en caso de error
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error(`Error al eliminar ruta con ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al eliminar ruta', error: error.message });
  }
});

module.exports = router;
