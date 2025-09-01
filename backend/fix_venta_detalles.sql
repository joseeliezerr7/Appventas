-- Agregar campos de unidad a venta_detalles
USE ventas_app;

-- Crear tabla de unidades de medida si no existe
CREATE TABLE IF NOT EXISTS unidades_medida (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  abreviatura VARCHAR(10),
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de producto_unidades si no existe
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
);

-- Agregar campos de unidad a venta_detalles
ALTER TABLE venta_detalles 
ADD COLUMN IF NOT EXISTS unidad_id INT,
ADD COLUMN IF NOT EXISTS factor_conversion DECIMAL(10,3) DEFAULT 1,
ADD COLUMN IF NOT EXISTS unidad_nombre VARCHAR(50);

-- Agregar foreign key para unidad_id
ALTER TABLE venta_detalles 
ADD CONSTRAINT fk_venta_detalle_unidad 
FOREIGN KEY (unidad_id) REFERENCES unidades_medida(id)
ON DELETE SET NULL;

-- Insertar unidades básicas si no existen
INSERT IGNORE INTO unidades_medida (nombre, abreviatura, descripcion) VALUES 
('Unidad', 'ud', 'Unidad individual'),
('Caja', 'cj', 'Caja con múltiples unidades'),
('Docena', 'dz', 'Grupo de 12 unidades'),
('Paquete', 'pq', 'Paquete con múltiples unidades'),
('Botella', 'bt', 'Botella individual'),
('Litro', 'L', 'Medida de volumen en litros'),
('Kilogramo', 'kg', 'Medida de peso en kilogramos'),
('Gramo', 'g', 'Medida de peso en gramos');

-- Agregar stock_total a productos si no existe
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS stock_total INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS stock_minimo INT DEFAULT 0;