const express = require('express');
const router = express.Router();

// GET /api/unidades - Obtener todas las unidades de medida
router.get('/', async (req, res) => {
  try {
    const [unidades] = await req.app.locals.pool.query(`
      SELECT * FROM unidades_medida
      ORDER BY nombre ASC
    `);
    
    console.log(`Se encontraron ${unidades.length} unidades de medida`);
    res.status(200).json(unidades);
  } catch (error) {
    console.error('Error al obtener unidades de medida:', error);
    res.status(500).json({ message: 'Error al obtener unidades de medida', error: error.message });
  }
});

// GET /api/unidades/:id - Obtener una unidad de medida por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [unidades] = await req.app.locals.pool.query(`
      SELECT * FROM unidades_medida
      WHERE id = ?
    `, [id]);
    
    if (unidades.length === 0) {
      return res.status(404).json({ message: `Unidad de medida con ID ${id} no encontrada` });
    }
    
    res.status(200).json(unidades[0]);
  } catch (error) {
    console.error(`Error al obtener unidad de medida con ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al obtener unidad de medida', error: error.message });
  }
});

// POST /api/unidades - Crear una nueva unidad de medida
router.post('/', async (req, res) => {
  try {
    const { nombre, abreviatura, descripcion } = req.body;
    
    // Validar datos
    if (!nombre) {
      return res.status(400).json({ message: 'El nombre de la unidad es obligatorio' });
    }
    
    const [result] = await req.app.locals.pool.query(`
      INSERT INTO unidades_medida (nombre, abreviatura, descripcion)
      VALUES (?, ?, ?)
    `, [nombre, abreviatura || null, descripcion || null]);
    
    const id = result.insertId;
    
    res.status(201).json({
      id,
      nombre,
      abreviatura,
      descripcion
    });
  } catch (error) {
    console.error('Error al crear unidad de medida:', error);
    res.status(500).json({ message: 'Error al crear unidad de medida', error: error.message });
  }
});

// PUT /api/unidades/:id - Actualizar una unidad de medida
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, abreviatura, descripcion } = req.body;
    
    // Validar datos
    if (!nombre) {
      return res.status(400).json({ message: 'El nombre de la unidad es obligatorio' });
    }
    
    const [result] = await req.app.locals.pool.query(`
      UPDATE unidades_medida
      SET nombre = ?, abreviatura = ?, descripcion = ?
      WHERE id = ?
    `, [nombre, abreviatura || null, descripcion || null, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: `Unidad de medida con ID ${id} no encontrada` });
    }
    
    res.status(200).json({
      id: parseInt(id),
      nombre,
      abreviatura,
      descripcion
    });
  } catch (error) {
    console.error(`Error al actualizar unidad de medida con ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al actualizar unidad de medida', error: error.message });
  }
});

// DELETE /api/unidades/:id - Eliminar una unidad de medida
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si la unidad está siendo utilizada en productos
    const [productosConUnidad] = await req.app.locals.pool.query(`
      SELECT COUNT(*) as count FROM productos_unidades
      WHERE unidad_id = ?
    `, [id]);
    
    if (productosConUnidad[0].count > 0) {
      return res.status(400).json({ 
        message: 'No se puede eliminar esta unidad porque está siendo utilizada por uno o más productos'
      });
    }
    
    const [result] = await req.app.locals.pool.query(`
      DELETE FROM unidades_medida
      WHERE id = ?
    `, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: `Unidad de medida con ID ${id} no encontrada` });
    }
    
    res.status(200).json({ message: `Unidad de medida con ID ${id} eliminada correctamente` });
  } catch (error) {
    console.error(`Error al eliminar unidad de medida con ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al eliminar unidad de medida', error: error.message });
  }
});

module.exports = router;
