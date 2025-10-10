const express = require('express');
const router = express.Router();

// Usaremos el middleware authenticateToken del objeto app.locals

// GET /api/clientes - Obtener todos los clientes
router.get('/', (req, res, next) => req.app.locals.authenticateToken(req, res, next), async (req, res) => {
  try {
    const [clientes] = await req.app.locals.pool.query(`
      SELECT * FROM clientes ORDER BY nombre
    `);
    
    console.log(`Se encontraron ${clientes.length} clientes`);
    res.status(200).json(clientes);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ message: 'Error al obtener clientes', error: error.message });
  }
});

// GET /api/clientes/:id - Obtener un cliente por ID
router.get('/:id', (req, res, next) => req.app.locals.authenticateToken(req, res, next), async (req, res) => {
  try {
    const { id } = req.params;
    const [clientes] = await req.app.locals.pool.query(`
      SELECT * FROM clientes WHERE id = ?
    `, [id]);
    
    if (clientes.length === 0) {
      return res.status(404).json({ message: `Cliente con ID ${id} no encontrado` });
    }
    
    res.status(200).json(clientes[0]);
  } catch (error) {
    console.error(`Error al obtener cliente con ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al obtener cliente', error: error.message });
  }
});

// POST /api/clientes - Crear un nuevo cliente
router.post('/', (req, res, next) => req.app.locals.authenticateToken(req, res, next), async (req, res) => {
  try {
    const { nombre, direccion, telefono, email, ciudad, notas, latitud, longitud } = req.body;
    const creado_por = req.user.id; // Usuario autenticado

    // Validar datos requeridos
    if (!nombre) {
      return res.status(400).json({ message: 'El nombre del cliente es obligatorio' });
    }

    const [result] = await req.app.locals.pool.query(`
      INSERT INTO clientes (nombre, telefono, email, direccion, latitud, longitud, ciudad, notas, creado_por)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [nombre, telefono || null, email || null, direccion || null, latitud || null, longitud || null, ciudad || null, notas || null, creado_por]);
    
    console.log(`Cliente creado con ID: ${result.insertId}`);
    
    // Obtener el cliente recién creado
    const [nuevoCliente] = await req.app.locals.pool.query(`
      SELECT * FROM clientes WHERE id = ?
    `, [result.insertId]);
    
    res.status(201).json(nuevoCliente[0]);
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ message: 'Error al crear cliente', error: error.message });
  }
});

// PUT /api/clientes/:id - Actualizar un cliente
router.put('/:id', (req, res, next) => req.app.locals.authenticateToken(req, res, next), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, direccion, telefono, email, ciudad, notas, latitud, longitud } = req.body;

    // Validar datos requeridos
    if (!nombre) {
      return res.status(400).json({ message: 'El nombre del cliente es obligatorio' });
    }

    // Verificar que el cliente existe
    const [clienteExistente] = await req.app.locals.pool.query(`
      SELECT * FROM clientes WHERE id = ?
    `, [id]);

    if (clienteExistente.length === 0) {
      return res.status(404).json({ message: `Cliente con ID ${id} no encontrado` });
    }

    // Actualizar cliente
    await req.app.locals.pool.query(`
      UPDATE clientes
      SET nombre = ?, telefono = ?, email = ?, direccion = ?, latitud = ?, longitud = ?, ciudad = ?, notas = ?
      WHERE id = ?
    `, [nombre, telefono || null, email || null, direccion || null, latitud || null, longitud || null, ciudad || null, notas || null, id]);
    
    console.log(`Cliente con ID ${id} actualizado`);
    
    // Obtener el cliente actualizado
    const [clienteActualizado] = await req.app.locals.pool.query(`
      SELECT * FROM clientes WHERE id = ?
    `, [id]);
    
    res.status(200).json(clienteActualizado[0]);
  } catch (error) {
    console.error(`Error al actualizar cliente con ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al actualizar cliente', error: error.message });
  }
});

// DELETE /api/clientes/:id - Eliminar un cliente
router.delete('/:id', (req, res, next) => req.app.locals.authenticateToken(req, res, next), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el cliente existe
    const [clienteExistente] = await req.app.locals.pool.query(`
      SELECT * FROM clientes WHERE id = ?
    `, [id]);
    
    if (clienteExistente.length === 0) {
      return res.status(404).json({ message: `Cliente con ID ${id} no encontrado` });
    }
    
    // Eliminar cliente
    await req.app.locals.pool.query(`
      DELETE FROM clientes WHERE id = ?
    `, [id]);
    
    console.log(`Cliente con ID ${id} eliminado`);
    
    res.status(200).json({ message: `Cliente con ID ${id} eliminado correctamente` });
  } catch (error) {
    console.error(`Error al eliminar cliente con ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al eliminar cliente', error: error.message });
  }
});

// GET /api/clientes/:id/ventas - Obtener ventas de un cliente
router.get('/:id/ventas', (req, res, next) => req.app.locals.authenticateToken(req, res, next), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el cliente existe
    const [clienteExistente] = await req.app.locals.pool.query(`
      SELECT * FROM clientes WHERE id = ?
    `, [id]);
    
    if (clienteExistente.length === 0) {
      return res.status(404).json({ message: `Cliente con ID ${id} no encontrado` });
    }
    
    // Obtener ventas del cliente
    const [ventas] = await req.app.locals.pool.query(`
      SELECT v.*, u.nombre as vendedor_nombre
      FROM ventas v
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      WHERE v.cliente_id = ?
      ORDER BY v.fecha DESC
    `, [id]);
    
    console.log(`Se encontraron ${ventas.length} ventas para el cliente ${id}`);
    
    res.status(200).json(ventas);
  } catch (error) {
    console.error(`Error al obtener ventas del cliente con ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al obtener ventas del cliente', error: error.message });
  }
});

module.exports = router;
