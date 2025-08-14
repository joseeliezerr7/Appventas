const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateRutasTable() {
  let connection;
  try {
    // Crear conexión usando variables de entorno
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('Conectado a la base de datos MySQL');
    
    // Verificar si existen las columnas necesarias y agregarlas si no
    console.log('Verificando y actualizando estructura de la tabla rutas...');
    
    // Obtener la estructura actual de la tabla
    const [columns] = await connection.query('DESCRIBE rutas');
    const columnNames = columns.map(col => col.Field);
    
    // Verificar y agregar columna fecha_inicio si no existe
    if (!columnNames.includes('fecha_inicio')) {
      console.log('Agregando columna fecha_inicio...');
      await connection.execute('ALTER TABLE rutas ADD COLUMN fecha_inicio DATE');
    }
    
    // Verificar y agregar columna fecha_fin si no existe
    if (!columnNames.includes('fecha_fin')) {
      console.log('Agregando columna fecha_fin...');
      await connection.execute('ALTER TABLE rutas ADD COLUMN fecha_fin DATE');
    }
    
    // Verificar y agregar columna dias_visita si no existe
    if (!columnNames.includes('dias_visita')) {
      console.log('Agregando columna dias_visita...');
      await connection.execute('ALTER TABLE rutas ADD COLUMN dias_visita VARCHAR(255)');
    }
    
    // Verificar y modificar columna estado si existe
    if (columnNames.includes('estado')) {
      console.log('Verificando y actualizando columna estado...');
      // Obtener la definición actual de la columna estado
      const [estadoColumn] = await connection.query("SHOW COLUMNS FROM rutas WHERE Field = 'estado'");
      console.log('Definición actual de columna estado:', estadoColumn);
      
      // Si la columna estado es demasiado pequeña o es un ENUM, modificarla
      if (estadoColumn && (estadoColumn[0].Type.includes('enum') || estadoColumn[0].Type.includes('char') && parseInt(estadoColumn[0].Type.match(/\d+/)[0]) < 10)) {
        console.log('Modificando columna estado para aceptar valores más largos...');
        await connection.execute('ALTER TABLE rutas MODIFY COLUMN estado VARCHAR(20)');
      }
    } else {
      // Si la columna estado no existe, crearla
      console.log('Agregando columna estado...');
      await connection.execute('ALTER TABLE rutas ADD COLUMN estado VARCHAR(20) DEFAULT "activa"');
    }
    
    // Crear tabla ruta_clientes si no existe
    console.log('Creando tabla ruta_clientes si no existe...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ruta_clientes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ruta_id INT NOT NULL,
        cliente_id INT NOT NULL,
        orden INT NOT NULL DEFAULT 1,
        completado TINYINT(1) DEFAULT 0,
        notas TEXT,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ruta_id) REFERENCES rutas(id) ON DELETE CASCADE,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
      )
    `);
    
    console.log('¡Estructura de la base de datos actualizada exitosamente!');
    
  } catch (error) {
    console.error('Error al actualizar la estructura de la tabla:', error);
  } finally {
    if (connection) {
      // Cerrar la conexión
      await connection.end();
      console.log('Conexión cerrada');
    }
  }
}

// Ejecutar la función
updateRutasTable();
