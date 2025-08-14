-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS ventas_app;
USE ventas_app;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol ENUM('admin', 'vendedor') NOT NULL DEFAULT 'vendedor',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  email VARCHAR(100),
  direccion TEXT,
  ciudad VARCHAR(100),
  notas TEXT,
  creado_por INT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creado_por) REFERENCES usuarios(id)
);

-- Tabla de categorías de productos
CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  precio_compra DECIMAL(10,2) NOT NULL,
  precio_venta DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  categoria_id INT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

-- Tabla de proveedores
CREATE TABLE IF NOT EXISTS proveedores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  contacto VARCHAR(100),
  telefono VARCHAR(20),
  email VARCHAR(100),
  direccion TEXT,
  notas TEXT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de ventas
CREATE TABLE IF NOT EXISTS ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT,
  usuario_id INT NOT NULL,
  fecha DATETIME NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  estado ENUM('completada', 'cancelada', 'pendiente') NOT NULL DEFAULT 'completada',
  metodo_pago ENUM('efectivo', 'tarjeta', 'transferencia', 'credito') NOT NULL DEFAULT 'efectivo',
  notas TEXT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de detalles de venta
CREATE TABLE IF NOT EXISTS venta_detalles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (venta_id) REFERENCES ventas(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Tabla de devoluciones
CREATE TABLE IF NOT EXISTS devoluciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  usuario_id INT NOT NULL,
  fecha DATETIME NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  motivo TEXT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (venta_id) REFERENCES ventas(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de detalles de devolución
CREATE TABLE IF NOT EXISTS devolucion_detalles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  devolucion_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (devolucion_id) REFERENCES devoluciones(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Tabla de rutas
CREATE TABLE IF NOT EXISTS rutas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  usuario_id INT,
  fecha_inicio DATE,
  fecha_fin DATE,
  estado ENUM('pendiente', 'en_progreso', 'completada', 'cancelada') DEFAULT 'pendiente',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de puntos de ruta
CREATE TABLE IF NOT EXISTS ruta_puntos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ruta_id INT NOT NULL,
  cliente_id INT NOT NULL,
  orden INT NOT NULL,
  completado BOOLEAN DEFAULT FALSE,
  notas TEXT,
  FOREIGN KEY (ruta_id) REFERENCES rutas(id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

-- Tabla de cierres de caja
CREATE TABLE IF NOT EXISTS cierres (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  fecha DATETIME NOT NULL,
  total_ventas DECIMAL(10,2) NOT NULL,
  total_devoluciones DECIMAL(10,2) NOT NULL DEFAULT 0,
  efectivo DECIMAL(10,2) NOT NULL DEFAULT 0,
  tarjeta DECIMAL(10,2) NOT NULL DEFAULT 0,
  transferencia DECIMAL(10,2) NOT NULL DEFAULT 0,
  credito DECIMAL(10,2) NOT NULL DEFAULT 0,
  comentarios TEXT,
  estado ENUM('pendiente', 'completado') NOT NULL DEFAULT 'completado',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Insertar datos de prueba

-- Usuario administrador
INSERT INTO usuarios (nombre, email, password, rol) VALUES 
('Administrador', 'admin@ventas-app.com', '$2b$10$JQZJQlv.0jYnYzDqUjRRxuUKVxlsHDRP9xUL3kQ5/i.QKO.QMeOtG', 'admin');
-- La contraseña es 'admin123'

-- Usuario vendedor
INSERT INTO usuarios (nombre, email, password, rol) VALUES 
('Vendedor', 'vendedor@ventas-app.com', '$2b$10$JQZJQlv.0jYnYzDqUjRRxuUKVxlsHDRP9xUL3kQ5/i.QKO.QMeOtG', 'vendedor');
-- La contraseña es 'admin123'

-- Categorías de productos
INSERT INTO categorias (nombre, descripcion) VALUES 
('Bebidas', 'Refrescos, agua, jugos, etc.'),
('Snacks', 'Papas fritas, galletas, chocolates, etc.'),
('Lácteos', 'Leche, queso, yogurt, etc.'),
('Limpieza', 'Productos de limpieza para el hogar'),
('Cuidado Personal', 'Jabón, shampoo, pasta dental, etc.');

-- Productos
INSERT INTO productos (codigo, nombre, descripcion, precio_compra, precio_venta, stock, categoria_id) VALUES 
('P001', 'Refresco Cola 600ml', 'Refresco sabor cola en botella de 600ml', 8.50, 12.00, 100, 1),
('P002', 'Agua Mineral 1L', 'Agua mineral natural en botella de 1 litro', 5.00, 10.00, 150, 1),
('P003', 'Papas Fritas 150g', 'Papas fritas sabor original en bolsa de 150g', 7.50, 15.00, 80, 2),
('P004', 'Galletas Chocolate 200g', 'Galletas con chispas de chocolate', 10.00, 18.00, 60, 2),
('P005', 'Leche Entera 1L', 'Leche entera en envase de 1 litro', 15.00, 22.00, 50, 3),
('P006', 'Queso Fresco 500g', 'Queso fresco en empaque de 500g', 35.00, 55.00, 30, 3),
('P007', 'Detergente Líquido 1L', 'Detergente líquido para ropa', 25.00, 40.00, 40, 4),
('P008', 'Jabón de Baño 3 piezas', 'Paquete de 3 jabones de baño', 18.00, 30.00, 45, 5),
('P009', 'Shampoo 750ml', 'Shampoo para todo tipo de cabello', 30.00, 48.00, 35, 5),
('P010', 'Pasta Dental 100g', 'Pasta dental con flúor', 12.00, 20.00, 60, 5);

-- Clientes
INSERT INTO clientes (nombre, telefono, email, direccion, ciudad, notas, creado_por) VALUES 
('Juan Pérez', '555-1234', 'juan@example.com', 'Calle Principal 123', 'Ciudad Central', 'Cliente frecuente', 1),
('María López', '555-5678', 'maria@example.com', 'Avenida Central 456', 'Ciudad Norte', 'Prefiere entregas por la tarde', 1),
('Carlos Gómez', '555-9012', 'carlos@example.com', 'Boulevard Sur 789', 'Ciudad Sur', 'Paga siempre en efectivo', 1),
('Ana Martínez', '555-3456', 'ana@example.com', 'Calle Secundaria 234', 'Ciudad Este', 'Tiene crédito aprobado', 1),
('Roberto Sánchez', '555-7890', 'roberto@example.com', 'Avenida Oeste 567', 'Ciudad Oeste', 'Nuevo cliente', 1);

-- Proveedores
INSERT INTO proveedores (nombre, contacto, telefono, email, direccion, notas) VALUES 
('Distribuidora Nacional', 'Jorge Ramírez', '555-2468', 'ventas@disnac.com', 'Zona Industrial 1', 'Proveedor principal de bebidas'),
('Importadora Central', 'Laura Torres', '555-1357', 'laura@importcentral.com', 'Zona Industrial 2', 'Proveedor de productos importados'),
('Alimentos del Valle', 'Miguel Ángel', '555-3690', 'miguel@alimentosvalle.com', 'Carretera Norte Km 5', 'Proveedor de lácteos'),
('Productos de Limpieza SA', 'Carmen Díaz', '555-8024', 'carmen@prolimsa.com', 'Zona Industrial 3', 'Proveedor de artículos de limpieza'),
('Distribuidora de Cuidado Personal', 'Fernando Ruiz', '555-6913', 'fernando@distcuidado.com', 'Avenida Industrial 100', 'Proveedor de artículos de cuidado personal');
