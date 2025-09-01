const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

async function migrateUnidades() {
  try {
    console.log('Conectando a la base de datos...');
    const connection = await mysql.createConnection(dbConfig);
    
    console.log('\n=== CREANDO TABLAS DE UNIDADES ===');
    
    // Crear tabla de unidades de medida si no existe
    await connection.query(`
      CREATE TABLE IF NOT EXISTS unidades_medida (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL,
        abreviatura VARCHAR(10),
        descripcion TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Tabla unidades_medida verificada/creada');
    
    // Crear tabla de producto_unidades si no existe
    await connection.query(`
      CREATE TABLE IF NOT EXISTS producto_unidades (
        id INT AUTO_INCREMENT PRIMARY KEY,
        producto_id INT NOT NULL,
        unidad_id INT NOT NULL,
        factor_conversion DECIMAL(10,3) NOT NULL DEFAULT 1,
        es_unidad_principal BOOLEAN NOT NULL DEFAULT FALSE,
        stock INT NOT NULL DEFAULT 0,
        precio DECIMAL(10,2),
        costo DECIMAL(10,2),
        precio_venta DECIMAL(10,2),
        stock_minimo INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
        FOREIGN KEY (unidad_id) REFERENCES unidades_medida(id)
      )
    `);
    console.log('✓ Tabla producto_unidades verificada/creada');
    
    console.log('\n=== AGREGANDO CAMPOS A VENTA_DETALLES ===');
    
    // Verificar si las columnas ya existen
    const [columns] = await connection.query('DESCRIBE venta_detalles');
    const existingColumns = columns.map(col => col.Field);
    
    if (!existingColumns.includes('unidad_id')) {
      await connection.query('ALTER TABLE venta_detalles ADD COLUMN unidad_id INT NULL');
      console.log('✓ Columna unidad_id agregada');
    } else {
      console.log('✓ Columna unidad_id ya existe');
    }
    
    if (!existingColumns.includes('factor_conversion')) {
      await connection.query('ALTER TABLE venta_detalles ADD COLUMN factor_conversion DECIMAL(10,3) DEFAULT 1');
      console.log('✓ Columna factor_conversion agregada');
    } else {
      console.log('✓ Columna factor_conversion ya existe');
    }
    
    if (!existingColumns.includes('unidad_nombre')) {
      await connection.query('ALTER TABLE venta_detalles ADD COLUMN unidad_nombre VARCHAR(50) NULL');
      console.log('✓ Columna unidad_nombre agregada');
    } else {
      console.log('✓ Columna unidad_nombre ya existe');
    }
    
    console.log('\n=== INSERTANDO UNIDADES BÁSICAS ===');
    
    // Verificar si ya existen unidades
    const [existingUnidades] = await connection.query('SELECT COUNT(*) as count FROM unidades_medida');
    
    if (existingUnidades[0].count === 0) {
      await connection.query(`
        INSERT INTO unidades_medida (nombre, abreviatura, descripcion) VALUES 
        ('Unidad', 'ud', 'Unidad individual'),
        ('Caja', 'cj', 'Caja con múltiples unidades'),
        ('Docena', 'dz', 'Grupo de 12 unidades'),
        ('Paquete', 'pq', 'Paquete con múltiples unidades'),
        ('Botella', 'bt', 'Botella individual'),
        ('Litro', 'L', 'Medida de volumen en litros'),
        ('Kilogramo', 'kg', 'Medida de peso en kilogramos'),
        ('Gramo', 'g', 'Medida de peso en gramos')
      `);
      console.log('✓ Unidades básicas insertadas');
    } else {
      console.log('✓ Unidades ya existen en la base de datos');
    }
    
    console.log('\n=== AGREGANDO CAMPOS A PRODUCTOS ===');
    
    // Verificar campos en productos
    const [productColumns] = await connection.query('DESCRIBE productos');
    const existingProductColumns = productColumns.map(col => col.Field);
    
    if (!existingProductColumns.includes('stock_total')) {
      await connection.query('ALTER TABLE productos ADD COLUMN stock_total INT DEFAULT 0');
      console.log('✓ Columna stock_total agregada a productos');
    } else {
      console.log('✓ Columna stock_total ya existe en productos');
    }
    
    if (!existingProductColumns.includes('stock_minimo')) {
      await connection.query('ALTER TABLE productos ADD COLUMN stock_minimo INT DEFAULT 0');
      console.log('✓ Columna stock_minimo agregada a productos');
    } else {
      console.log('✓ Columna stock_minimo ya existe en productos');
    }
    
    console.log('\n=== CREANDO UNIDADES PARA PRODUCTOS EXISTENTES ===');
    
    // Obtener productos que no tienen unidades
    const [productosParaUnidades] = await connection.query(`
      SELECT p.id, p.nombre, p.stock, p.precio_venta
      FROM productos p
      LEFT JOIN producto_unidades pu ON p.id = pu.producto_id
      WHERE pu.producto_id IS NULL
    `);
    
    if (productosParaUnidades.length > 0) {
      console.log(`Creando unidades para ${productosParaUnidades.length} productos...`);
      
      for (const producto of productosParaUnidades) {
        // Crear unidad básica (Unidad)
        await connection.query(`
          INSERT INTO producto_unidades (producto_id, unidad_id, factor_conversion, es_unidad_principal, stock, precio_venta)
          VALUES (?, 1, 1, TRUE, ?, ?)
        `, [producto.id, producto.stock || 0, producto.precio_venta || 0]);
        
        // Crear unidad caja (ejemplo: 1 caja = 12 unidades)
        await connection.query(`
          INSERT INTO producto_unidades (producto_id, unidad_id, factor_conversion, es_unidad_principal, stock, precio_venta)
          VALUES (?, 2, 12, FALSE, ?, ?)
        `, [producto.id, Math.floor((producto.stock || 0) / 12), (producto.precio_venta || 0) * 12 * 0.9]);
        
        console.log(`✓ Unidades creadas para producto: ${producto.nombre}`);
      }
    } else {
      console.log('✓ Todos los productos ya tienen unidades definidas');
    }
    
    await connection.end();
    console.log('\n🎉 Migración completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
  }
}

migrateUnidades();