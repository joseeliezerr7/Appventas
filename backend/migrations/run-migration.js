const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function runMigration() {
  let connection;
  try {
    // Configuración de la base de datos
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ventas_db',
      multipleStatements: true
    };

    console.log('Conectando a la base de datos...');
    console.log(`Host: ${dbConfig.host}`);
    console.log(`Database: ${dbConfig.database}`);
    console.log(`User: ${dbConfig.user}`);

    // Crear conexión
    connection = await mysql.createConnection(dbConfig);
    console.log('Conexión establecida exitosamente\n');

    // Leer el archivo de migración
    const migrationFile = path.join(__dirname, 'add_producto_unidad_id_to_venta_detalles.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log('Ejecutando migración...');
    console.log('SQL:', sql);
    console.log('');

    // Ejecutar la migración
    await connection.query(sql);

    console.log('✓ Migración ejecutada exitosamente');
    console.log('✓ Columna producto_unidad_id agregada a venta_detalles');

  } catch (error) {
    console.error('Error al ejecutar la migración:', error.message);
    console.error('Detalles:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nConexión cerrada');
    }
  }
}

// Ejecutar migración
runMigration();
