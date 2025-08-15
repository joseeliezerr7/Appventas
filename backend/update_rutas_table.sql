-- Script para actualizar la estructura de la tabla rutas

USE ventas_app;

-- Agregar las columnas faltantes a la tabla rutas
ALTER TABLE rutas 
ADD COLUMN IF NOT EXISTS dias_visita JSON,
ADD COLUMN IF NOT EXISTS fecha_inicio DATE,
ADD COLUMN IF NOT EXISTS fecha_fin DATE,
ADD COLUMN IF NOT EXISTS estado ENUM('activa', 'inactiva', 'completada') DEFAULT 'activa';

-- Actualizar registros existentes si los hay
UPDATE rutas 
SET fecha_inicio = fecha, 
    estado = 'activa' 
WHERE fecha_inicio IS NULL;

-- Eliminar la columna fecha antigua si existe (renombrar a fecha_inicio)
-- ALTER TABLE rutas DROP COLUMN fecha;

DESCRIBE rutas;