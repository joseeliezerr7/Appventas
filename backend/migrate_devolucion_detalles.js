const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

async function migrateDevolucionDetalles() {
  try {
    console.log('Conectando a la base de datos...');
    const connection = await mysql.createConnection(dbConfig);
    
    console.log('\n=== AGREGANDO CAMPOS DE UNIDAD A devolucion_detalles ===');
    
    // Verificar si las columnas ya existen
    const [columns] = await connection.query('DESCRIBE devolucion_detalles');
    const existingColumns = columns.map(col => col.Field);
    
    if (!existingColumns.includes('unidad_id')) {
      await connection.query('ALTER TABLE devolucion_detalles ADD COLUMN unidad_id INT NULL');
      console.log('✓ Columna unidad_id agregada');
    } else {
      console.log('✓ Columna unidad_id ya existe');
    }
    
    if (!existingColumns.includes('factor_conversion')) {
      await connection.query('ALTER TABLE devolucion_detalles ADD COLUMN factor_conversion DECIMAL(10,3) DEFAULT 1');
      console.log('✓ Columna factor_conversion agregada');
    } else {
      console.log('✓ Columna factor_conversion ya existe');
    }
    
    if (!existingColumns.includes('unidad_nombre')) {
      await connection.query('ALTER TABLE devolucion_detalles ADD COLUMN unidad_nombre VARCHAR(50) NULL');
      console.log('✓ Columna unidad_nombre agregada');
    } else {
      console.log('✓ Columna unidad_nombre ya existe');
    }
    
    // Agregar foreign key para unidad_id
    try {
      await connection.query(`
        ALTER TABLE devolucion_detalles 
        ADD CONSTRAINT fk_devolucion_detalle_unidad 
        FOREIGN KEY (unidad_id) REFERENCES unidades_medida(id)
        ON DELETE SET NULL
      `);
      console.log('✓ Foreign key para unidad_id agregada');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('✓ Foreign key para unidad_id ya existe');
      } else {
        console.log('⚠️ Error al agregar foreign key:', error.message);
      }
    }
    
    // Mostrar estructura final
    console.log('\n=== ESTRUCTURA FINAL DE devolucion_detalles ===');
    const [finalColumns] = await connection.query('DESCRIBE devolucion_detalles');
    console.table(finalColumns);
    
    await connection.end();
    console.log('\n🎉 Migración de devolucion_detalles completada!');
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
  }
}

migrateDevolucionDetalles();