const express = require('express');
const router = express.Router();

// GET /api/productos - Obtener todos los productos
router.get('/', async (req, res) => {
  try {
    const [productos] = await req.app.locals.pool.query(`
      SELECT p.*, c.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      ORDER BY p.nombre
    `);
    
    console.log(`Se encontraron ${productos.length} productos`);
    res.status(200).json(productos);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ message: 'Error al obtener productos', error: error.message });
  }
});

// GET /api/productos/:id - Obtener un producto por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [productos] = await req.app.locals.pool.query(`
      SELECT p.*, c.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.id = ?
    `, [id]);
    
    if (productos.length === 0) {
      return res.status(404).json({ message: `Producto con ID ${id} no encontrado` });
    }
    
    // Obtener las unidades del producto
    const [unidades] = await req.app.locals.pool.query(`
      SELECT pu.*, um.nombre as unidad_nombre, um.abreviatura
      FROM producto_unidades pu
      LEFT JOIN unidades_medida um ON pu.unidad_id = um.id
      WHERE pu.producto_id = ?
      ORDER BY pu.factor_conversion ASC
    `, [id]);
    
    console.log(`Se encontraron ${unidades.length} unidades para el producto ${id}`);
    
    // Agregar las unidades al objeto del producto
    const productoConUnidades = {
      ...productos[0],
      unidades: unidades
    };
    
    res.status(200).json(productoConUnidades);
  } catch (error) {
    console.error(`Error al obtener producto con ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al obtener producto', error: error.message });
  }
});

// GET /api/productos/:id/unidades - Obtener unidades de un producto
router.get('/:id/unidades', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el producto existe
    const [productoExistente] = await req.app.locals.pool.query(`
      SELECT * FROM productos WHERE id = ?
    `, [id]);
    
    if (productoExistente.length === 0) {
      return res.status(404).json({ message: `Producto con ID ${id} no encontrado` });
    }
    
    // Obtener unidades del producto
    const [unidades] = await req.app.locals.pool.query(`
      SELECT pu.*, um.nombre as unidad_nombre
      FROM producto_unidades pu
      LEFT JOIN unidades_medida um ON pu.unidad_id = um.id
      WHERE pu.producto_id = ?
      ORDER BY pu.factor_conversion ASC
    `, [id]);
    
    console.log(`Se encontraron ${unidades.length} unidades para el producto ${id}`);
    
    res.status(200).json(unidades);
  } catch (error) {
    console.error(`Error al obtener unidades del producto con ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al obtener unidades del producto', error: error.message });
  }
});

// POST /api/productos - Crear un nuevo producto
router.post('/', async (req, res) => {
  try {
    const { 
      codigo, 
      nombre, 
      descripcion, 
      precio_compra, 
      precio_venta, 
      stock_minimo, 
      categoria_id,
      unidades
    } = req.body;
    
    // Validar datos requeridos
    if (!nombre || !codigo) {
      return res.status(400).json({ message: 'El nombre y código del producto son obligatorios' });
    }
    
    // Iniciar transacción
    const connection = await req.app.locals.pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Insertar producto
      const [resultProducto] = await connection.query(`
        INSERT INTO productos (codigo, nombre, descripcion, precio_compra, precio_venta, stock_minimo, categoria_id, stock_total)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0)
      `, [
        codigo, 
        nombre, 
        descripcion || null, 
        precio_compra || 0, 
        precio_venta || 0, 
        stock_minimo || 0, 
        categoria_id || null,
        0
      ]);
      
      const productoId = resultProducto.insertId;
      console.log(`Producto creado con ID: ${productoId}`);
      
      // Si se proporcionaron unidades, insertarlas
      if (unidades && Array.isArray(unidades) && unidades.length > 0) {
        for (const unidad of unidades) {
          await connection.query(`
            INSERT INTO producto_unidades (producto_id, unidad_id, factor_conversion, es_unidad_principal, stock)
            VALUES (?, ?, ?, ?, ?)
          `, [
            productoId,
            unidad.unidad_id,
            unidad.factor_conversion || 1,
            unidad.es_unidad_principal || 0,
            unidad.stock || 0
          ]);
        }
        
        console.log(`Se agregaron ${unidades.length} unidades al producto ${productoId}`);
        
        // Recalcular stock total
        if (typeof req.app.locals.recalcularStockTotal === 'function') {
          await req.app.locals.recalcularStockTotal(connection, productoId);
        }
      }
      
      // Confirmar transacción
      await connection.commit();
      
      // Obtener el producto recién creado
      const [nuevoProducto] = await connection.query(`
        SELECT p.*, c.nombre as categoria_nombre
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        WHERE p.id = ?
      `, [productoId]);
      
      // Obtener las unidades del producto
      const [unidadesProducto] = await connection.query(`
        SELECT pu.*, um.nombre as unidad_nombre
        FROM producto_unidades pu
        LEFT JOIN unidades_medida um ON pu.unidad_id = um.id
        WHERE pu.producto_id = ?
        ORDER BY pu.es_unidad_principal DESC, pu.factor_conversion ASC
      `, [productoId]);
      
      // Liberar conexión
      connection.release();
      
      // Devolver respuesta
      res.status(201).json({
        ...nuevoProducto[0],
        unidades: unidadesProducto
      });
    } catch (error) {
      // Revertir transacción en caso de error
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ message: 'Error al crear producto', error: error.message });
  }
});

// PUT /api/productos/:id - Actualizar un producto
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      codigo, 
      nombre, 
      descripcion, 
      categoria_id,
      codigo_barras,
      notas,
      imagen,
      unidad_principal
    } = req.body;
    
    // Validar datos requeridos
    if (!nombre || !codigo) {
      return res.status(400).json({ message: 'El nombre y código del producto son obligatorios' });
    }
    
    // Verificar que el producto existe
    const [productoExistente] = await req.app.locals.pool.query(`
      SELECT * FROM productos WHERE id = ?
    `, [id]);
    
    if (productoExistente.length === 0) {
      return res.status(404).json({ message: `Producto con ID ${id} no encontrado` });
    }
    
    // Actualizar producto
    await req.app.locals.pool.query(`
      UPDATE productos
      SET codigo = ?, nombre = ?, descripcion = ?, categoria_id = ?, 
          codigo_barras = ?, notas = ?, imagen = ?, unidad_principal = ?
      WHERE id = ?
    `, [
      codigo, 
      nombre, 
      descripcion || null, 
      categoria_id || null,
      codigo_barras || null,
      notas || null,
      imagen || null,
      unidad_principal || null,
      id
    ]);
    
    console.log(`Producto con ID ${id} actualizado`);
    
    // Obtener el producto actualizado
    const [productoActualizado] = await req.app.locals.pool.query(`
      SELECT p.*, c.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.id = ?
    `, [id]);
    
    res.status(200).json(productoActualizado[0]);
  } catch (error) {
    console.error(`Error al actualizar producto con ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al actualizar producto', error: error.message });
  }
});

// DELETE /api/productos/:id - Eliminar un producto
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el producto existe
    const [productoExistente] = await req.app.locals.pool.query(`
      SELECT * FROM productos WHERE id = ?
    `, [id]);
    
    if (productoExistente.length === 0) {
      return res.status(404).json({ message: `Producto con ID ${id} no encontrado` });
    }
    
    // Iniciar transacción
    const connection = await req.app.locals.pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Eliminar unidades del producto
      await connection.query(`
        DELETE FROM producto_unidades WHERE producto_id = ?
      `, [id]);
      
      // Eliminar producto
      await connection.query(`
        DELETE FROM productos WHERE id = ?
      `, [id]);
      
      // Confirmar transacción
      await connection.commit();
      connection.release();
      
      console.log(`Producto con ID ${id} eliminado`);
      
      res.status(200).json({ message: `Producto con ID ${id} eliminado correctamente` });
    } catch (error) {
      // Revertir transacción en caso de error
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error(`Error al eliminar producto con ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al eliminar producto', error: error.message });
  }
});

// PUT /api/productos/:id/unidades/:unidadId - Actualizar una unidad de un producto
router.put('/:id/unidades/:unidadId', async (req, res) => {
  try {
    const { id, unidadId } = req.params;
    const { factor_conversion, es_unidad_principal, stock, precio, costo } = req.body;
    
    // Verificar que el producto existe
    const [productoExistente] = await req.app.locals.pool.query(`
      SELECT * FROM productos WHERE id = ?
    `, [id]);
    
    if (productoExistente.length === 0) {
      return res.status(404).json({ message: `Producto con ID ${id} no encontrado` });
    }
    
    // Verificar que la unidad existe
    const [unidadExistente] = await req.app.locals.pool.query(`
      SELECT * FROM producto_unidades WHERE id = ? AND producto_id = ?
    `, [unidadId, id]);
    
    if (unidadExistente.length === 0) {
      return res.status(404).json({ message: `Unidad con ID ${unidadId} no encontrada para el producto ${id}` });
    }
    
    // Iniciar transacción
    const connection = await req.app.locals.pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Actualizar unidad
      await connection.query(`
        UPDATE producto_unidades
        SET factor_conversion = ?, stock = ?, precio = ?, costo = ?
        WHERE id = ? AND producto_id = ?
      `, [
        factor_conversion || unidadExistente[0].factor_conversion,
        stock !== undefined ? stock : unidadExistente[0].stock,
        precio !== undefined ? precio : unidadExistente[0].precio || 0,
        costo !== undefined ? costo : unidadExistente[0].costo || 0,
        unidadId,
        id
      ]);
      
      console.log(`Unidad ${unidadId} del producto ${id} actualizada`);
      
      // Si es unidad base, actualizar otras unidades
      if (es_unidad_principal) {
        await connection.query(`
          UPDATE producto_unidades
          SET es_unidad_principal = 0
          WHERE producto_id = ? AND id != ?
        `, [id, unidadId]);
        
        console.log(`Se actualizaron otras unidades del producto ${id} para que no sean unidades base`);
      }
      
      // Recalcular stock total
      if (typeof req.app.locals.recalcularStockTotal === 'function') {
        await req.app.locals.recalcularStockTotal(connection, id);
      }
      
      // Confirmar transacción
      await connection.commit();
      
      // Obtener la unidad actualizada
      const [unidadActualizada] = await connection.query(`
        SELECT pu.*, um.nombre as unidad_nombre
        FROM producto_unidades pu
        LEFT JOIN unidades_medida um ON pu.unidad_id = um.id
        WHERE pu.id = ?
      `, [unidadId]);
      
      // Liberar conexión
      connection.release();
      
      res.status(200).json(unidadActualizada[0]);
    } catch (error) {
      // Revertir transacción en caso de error
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error(`Error al actualizar unidad ${req.params.unidadId} del producto ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al actualizar unidad del producto', error: error.message });
  }
});

// POST /api/productos/:id/unidades - Crear una nueva unidad para un producto
router.post('/:id/unidades', async (req, res) => {
  try {
    const { id } = req.params;
    const { unidad_id, factor_conversion, es_unidad_principal, stock, precio, costo } = req.body;
    
    // Validar datos requeridos
    if (!unidad_id) {
      return res.status(400).json({ message: 'El ID de la unidad de medida es obligatorio' });
    }
    
    // Verificar que el producto existe
    const [productoExistente] = await req.app.locals.pool.query(`
      SELECT * FROM productos WHERE id = ?
    `, [id]);
    
    if (productoExistente.length === 0) {
      return res.status(404).json({ message: `Producto con ID ${id} no encontrado` });
    }
    
    // Iniciar transacción
    const connection = await req.app.locals.pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Insertar unidad
      const [resultUnidad] = await connection.query(`
        INSERT INTO producto_unidades (producto_id, unidad_id, factor_conversion, es_unidad_principal, stock, precio, costo)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        unidad_id,
        factor_conversion || 1,
        es_unidad_principal || 0,
        stock || 0,
        precio || 0,
        costo || 0
      ]);
      
      const unidadId = resultUnidad.insertId;
      console.log(`Unidad creada con ID: ${unidadId} para el producto ${id}`);
      
      // Si es unidad base, actualizar otras unidades
      if (es_unidad_principal) {
        await connection.query(`
          UPDATE producto_unidades
          SET es_unidad_principal = 0
          WHERE producto_id = ? AND id != ?
        `, [id, unidadId]);
        
        console.log(`Se actualizaron otras unidades del producto ${id} para que no sean unidades base`);
      }
      
      // Recalcular stock total
      if (typeof req.app.locals.recalcularStockTotal === 'function') {
        await req.app.locals.recalcularStockTotal(connection, id);
      }
      
      // Confirmar transacción
      await connection.commit();
      
      // Obtener la unidad creada
      const [nuevaUnidad] = await connection.query(`
        SELECT pu.*, um.nombre as unidad_nombre
        FROM producto_unidades pu
        LEFT JOIN unidades_medida um ON pu.unidad_id = um.id
        WHERE pu.id = ?
      `, [unidadId]);
      
      // Liberar conexión
      connection.release();
      
      res.status(201).json(nuevaUnidad[0]);
    } catch (error) {
      // Revertir transacción en caso de error
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error(`Error al crear unidad para el producto ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al crear unidad para el producto', error: error.message });
  }
});

module.exports = router;
