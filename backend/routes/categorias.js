const express = require('express');
const router = express.Router();

// GET /api/categorias - Obtener todas las categorías
router.get('/', async (req, res) => {
  try {
    const [categorias] = await req.app.locals.pool.query(`
      SELECT * FROM categorias
      ORDER BY nombre ASC
    `);
    
    console.log(`Se encontraron ${categorias.length} categorías`);
    res.status(200).json(categorias);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ message: 'Error al obtener categorías', error: error.message });
  }
});

// GET /api/categorias/:id - Obtener una categoría por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [categorias] = await req.app.locals.pool.query(`
      SELECT * FROM categorias
      WHERE id = ?
    `, [id]);
    
    if (categorias.length === 0) {
      return res.status(404).json({ message: `Categoría con ID ${id} no encontrada` });
    }
    
    res.status(200).json(categorias[0]);
  } catch (error) {
    console.error(`Error al obtener categoría con ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al obtener categoría', error: error.message });
  }
});

// POST /api/categorias - Crear una nueva categoría
router.post('/', async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    
    // Validar datos
    if (!nombre) {
      return res.status(400).json({ message: 'El nombre de la categoría es obligatorio' });
    }
    
    const [result] = await req.app.locals.pool.query(`
      INSERT INTO categorias (nombre, descripcion)
      VALUES (?, ?)
    `, [nombre, descripcion || null]);
    
    const id = result.insertId;
    
    res.status(201).json({
      id,
      nombre,
      descripcion
    });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({ message: 'Error al crear categoría', error: error.message });
  }
});

// PUT /api/categorias/:id - Actualizar una categoría
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    
    // Validar datos
    if (!nombre) {
      return res.status(400).json({ message: 'El nombre de la categoría es obligatorio' });
    }
    
    const [result] = await req.app.locals.pool.query(`
      UPDATE categorias
      SET nombre = ?, descripcion = ?
      WHERE id = ?
    `, [nombre, descripcion || null, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: `Categoría con ID ${id} no encontrada` });
    }
    
    res.status(200).json({
      id: parseInt(id),
      nombre,
      descripcion
    });
  } catch (error) {
    console.error(`Error al actualizar categoría con ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al actualizar categoría', error: error.message });
  }
});

// DELETE /api/categorias/:id - Eliminar una categoría
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si la categoría está siendo utilizada en productos
    const [productosConCategoria] = await req.app.locals.pool.query(`
      SELECT COUNT(*) as count FROM productos
      WHERE categoria_id = ?
    `, [id]);
    
    if (productosConCategoria[0].count > 0) {
      return res.status(400).json({ 
        message: 'No se puede eliminar esta categoría porque está siendo utilizada por uno o más productos'
      });
    }
    
    const [result] = await req.app.locals.pool.query(`
      DELETE FROM categorias
      WHERE id = ?
    `, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: `Categoría con ID ${id} no encontrada` });
    }
    
    res.status(200).json({ message: `Categoría con ID ${id} eliminada correctamente` });
  } catch (error) {
    console.error(`Error al eliminar categoría con ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al eliminar categoría', error: error.message });
  }
});

module.exports = router;
