const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  // Crear conexión a la base de datos
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ventas_app',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log('Iniciando actualización de tablas para el módulo de ventas...');

    // Crear tabla de ventas si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ventas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cliente_id INT NOT NULL,
        usuario_id INT NOT NULL,
        fecha DATETIME NOT NULL,
        total DECIMAL(10,2) NOT NULL DEFAULT 0,
        metodo_pago VARCHAR(50) DEFAULT 'Efectivo',
        estado VARCHAR(20) DEFAULT 'completada',
        notas TEXT,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      )
    `);
    console.log('Tabla ventas verificada/creada');

    // Crear tabla de detalles de venta si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS venta_detalles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        venta_id INT NOT NULL,
        producto_id INT NOT NULL,
        cantidad INT NOT NULL,
        precio_unitario DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
        FOREIGN KEY (producto_id) REFERENCES productos(id)
      )
    `);
    console.log('Tabla venta_detalles verificada/creada');

    // Crear tabla de devoluciones si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS devoluciones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        venta_id INT NOT NULL,
        usuario_id INT NOT NULL,
        fecha DATETIME NOT NULL,
        total DECIMAL(10,2) NOT NULL DEFAULT 0,
        motivo TEXT,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (venta_id) REFERENCES ventas(id),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      )
    `);
    console.log('Tabla devoluciones verificada/creada');

    // Crear tabla de detalles de devolución si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS devolucion_detalles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        devolucion_id INT NOT NULL,
        producto_id INT NOT NULL,
        cantidad INT NOT NULL,
        precio_unitario DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (devolucion_id) REFERENCES devoluciones(id) ON DELETE CASCADE,
        FOREIGN KEY (producto_id) REFERENCES productos(id)
      )
    `);
    console.log('Tabla devolucion_detalles verificada/creada');

    console.log('Actualización de tablas para el módulo de ventas completada con éxito');
  } catch (error) {
    console.error('Error al actualizar tablas:', error);
  } finally {
    await pool.end();
  }
}

main();
