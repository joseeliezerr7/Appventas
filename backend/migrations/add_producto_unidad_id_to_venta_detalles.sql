-- Migración para agregar producto_unidad_id a venta_detalles
-- Esta columna almacena el ID específico de producto_unidades para rastrear
-- exactamente de qué unidad se rebajó el stock

-- Agregar la columna producto_unidad_id
ALTER TABLE venta_detalles
ADD COLUMN producto_unidad_id INT NULL AFTER unidad_id,
ADD FOREIGN KEY (producto_unidad_id) REFERENCES producto_unidades(id);

-- Nota: La columna es NULL para mantener compatibilidad con registros anteriores
-- Los registros nuevos siempre deben tener este valor
