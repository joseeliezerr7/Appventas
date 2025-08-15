const express = require('express');
const router = express.Router();

// GET /api/usuarios - Obtener todos los usuarios
router.get('/', async (req, res) => {
  try {
    const [usuarios] = await req.app.locals.pool.query(`
      SELECT id, nombre, email, rol, activo, creado_en
      FROM usuarios
      WHERE activo = 1
      ORDER BY nombre ASC
    `);
    
    console.log(`Se encontraron ${usuarios.length} usuarios`);
    res.status(200).json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
});

// GET /api/usuarios/:id - Obtener un usuario por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [usuarios] = await req.app.locals.pool.query(`
      SELECT id, nombre, email, rol, activo, creado_en
      FROM usuarios
      WHERE id = ? AND activo = 1
    `, [id]);
    
    if (usuarios.length === 0) {
      return res.status(404).json({ message: `Usuario con ID ${id} no encontrado` });
    }
    
    res.status(200).json(usuarios[0]);
  } catch (error) {
    console.error(`Error al obtener usuario con ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al obtener usuario', error: error.message });
  }
});

// POST /api/usuarios - Crear un nuevo usuario
router.post('/', async (req, res) => {
  try {
    const { nombre, email, password, rol = 'vendedor' } = req.body;
    
    if (!nombre || !email || !password) {
      return res.status(400).json({ 
        message: 'Nombre, email y contraseña son requeridos' 
      });
    }
    
    // Verificar si el email ya existe
    const [existingUser] = await req.app.locals.pool.query(`
      SELECT id FROM usuarios WHERE email = ?
    `, [email]);
    
    if (existingUser.length > 0) {
      return res.status(400).json({ 
        message: 'Ya existe un usuario con este email' 
      });
    }
    
    // En un sistema real, deberías hashear la contraseña
    const [result] = await req.app.locals.pool.query(`
      INSERT INTO usuarios (nombre, email, password, rol, activo)
      VALUES (?, ?, ?, ?, 1)
    `, [nombre, email, password, rol]);
    
    console.log(`Usuario creado con ID: ${result.insertId}`);
    res.status(201).json({ 
      id: result.insertId, 
      nombre, 
      email, 
      rol,
      message: 'Usuario creado exitosamente' 
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ message: 'Error al crear usuario', error: error.message });
  }
});

// PUT /api/usuarios/:id - Actualizar un usuario
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, rol } = req.body;
    
    if (!nombre && !email && !rol) {
      return res.status(400).json({ 
        message: 'Se requiere al menos un campo para actualizar' 
      });
    }
    
    // Construir la consulta dinámicamente
    const fields = [];
    const values = [];
    
    if (nombre) {
      fields.push('nombre = ?');
      values.push(nombre);
    }
    if (email) {
      fields.push('email = ?');
      values.push(email);
    }
    if (rol) {
      fields.push('rol = ?');
      values.push(rol);
    }
    
    values.push(id);
    
    const [result] = await req.app.locals.pool.query(`
      UPDATE usuarios 
      SET ${fields.join(', ')}
      WHERE id = ? AND activo = 1
    `, values);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    console.log(`Usuario ID ${id} actualizado`);
    res.status(200).json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error(`Error al actualizar usuario ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });
  }
});

// DELETE /api/usuarios/:id - Desactivar un usuario (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await req.app.locals.pool.query(`
      UPDATE usuarios 
      SET activo = 0
      WHERE id = ?
    `, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    console.log(`Usuario ID ${id} desactivado`);
    res.status(200).json({ message: 'Usuario desactivado exitosamente' });
  } catch (error) {
    console.error(`Error al desactivar usuario ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al desactivar usuario', error: error.message });
  }
});

module.exports = router;