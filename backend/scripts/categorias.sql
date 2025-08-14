-- Crear tabla de categorías si no existe
CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Modificar la tabla productos para usar categoria_id en lugar de categoria
ALTER TABLE productos 
ADD COLUMN categoria_id INT NULL,
ADD CONSTRAINT fk_producto_categoria 
FOREIGN KEY (categoria_id) 
REFERENCES categorias(id)
ON DELETE SET NULL;

-- Insertar algunas categorías de ejemplo
INSERT INTO categorias (nombre) VALUES 
('Bebidas'),
('Alimentos'),
('Limpieza'),
('Papelería'),
('Electrónica');

-- Actualizar los productos existentes para usar categoria_id
-- Esto asume que el campo 'categoria' contiene el nombre de la categoría
UPDATE productos p
JOIN categorias c ON p.categoria = c.nombre
SET p.categoria_id = c.id
WHERE p.categoria IS NOT NULL;

-- Opcional: Eliminar la columna categoria después de migrar los datos
-- ALTER TABLE productos DROP COLUMN categoria;
