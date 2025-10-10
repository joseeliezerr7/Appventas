const express = require('express');
const router = express.Router();

// Obtener configuración del negocio
router.get('/', async (req, res) => {
  const pool = req.app.locals.pool;

  try {
    console.log('Obteniendo configuración del negocio');

    const [rows] = await pool.query(
      'SELECT * FROM configuracion_negocio WHERE id = 1'
    );

    if (rows.length === 0) {
      // Si no existe configuración, crearla con valores por defecto
      await pool.query(
        'INSERT INTO configuracion_negocio (id, nombre_negocio, telefono, direccion) VALUES (1, ?, ?, ?)',
        ['Mi Negocio', '', '']
      );

      const [newRows] = await pool.query(
        'SELECT * FROM configuracion_negocio WHERE id = 1'
      );

      return res.status(200).json(newRows[0]);
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({
      message: 'Error al obtener la configuración del negocio',
      error: error.message
    });
  }
});

// Actualizar configuración del negocio
router.put('/', async (req, res) => {
  const pool = req.app.locals.pool;
  const { nombre_negocio, telefono, direccion, email, rtn } = req.body;

  try {
    console.log('Actualizando configuración del negocio:', req.body);

    // Validar que al menos el nombre del negocio esté presente
    if (!nombre_negocio || nombre_negocio.trim() === '') {
      return res.status(400).json({
        message: 'El nombre del negocio es obligatorio'
      });
    }

    // Actualizar la configuración
    await pool.query(
      `UPDATE configuracion_negocio
       SET nombre_negocio = ?,
           telefono = ?,
           direccion = ?,
           email = ?,
           rtn = ?
       WHERE id = 1`,
      [
        nombre_negocio.trim(),
        telefono || '',
        direccion || '',
        email || '',
        rtn || ''
      ]
    );

    // Obtener la configuración actualizada
    const [rows] = await pool.query(
      'SELECT * FROM configuracion_negocio WHERE id = 1'
    );

    console.log('Configuración actualizada exitosamente');
    res.status(200).json({
      message: 'Configuración actualizada exitosamente',
      configuracion: rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({
      message: 'Error al actualizar la configuración del negocio',
      error: error.message
    });
  }
});

module.exports = router;
