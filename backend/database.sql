-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS ventas_app;
USE ventas_app;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'vendedor') NOT NULL DEFAULT 'vendedor',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  direccion VARCHAR(255),
  telefono VARCHAR(20),
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de proveedores
CREATE TABLE IF NOT EXISTS proveedores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  contacto VARCHAR(100),
  telefono VARCHAR(20),
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  proveedor_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
);

-- Tabla de ventas
CREATE TABLE IF NOT EXISTS ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  fecha DATETIME NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  usuario_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de detalles de ventas
CREATE TABLE IF NOT EXISTS venta_detalles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (venta_id) REFERENCES ventas(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Tabla de devoluciones
CREATE TABLE IF NOT EXISTS devoluciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  fecha DATETIME NOT NULL,
  motivo TEXT,
  usuario_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (venta_id) REFERENCES ventas(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de detalles de devoluciones
CREATE TABLE IF NOT EXISTS devolucion_detalles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  devolucion_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL,
  FOREIGN KEY (devolucion_id) REFERENCES devoluciones(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Tabla de rutas
CREATE TABLE IF NOT EXISTS rutas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  fecha DATE NOT NULL,
  usuario_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de clientes en rutas
CREATE TABLE IF NOT EXISTS ruta_clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ruta_id INT NOT NULL,
  cliente_id INT NOT NULL,
  orden INT NOT NULL,
  FOREIGN KEY (ruta_id) REFERENCES rutas(id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

-- Tabla de cierres del día
CREATE TABLE IF NOT EXISTS cierres_dia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATE NOT NULL,
  total_ventas DECIMAL(10, 2) NOT NULL,
  total_devoluciones DECIMAL(10, 2) NOT NULL,
  efectivo DECIMAL(10, 2) NOT NULL,
  tarjeta DECIMAL(10, 2) NOT NULL,
  otros DECIMAL(10, 2) NOT NULL,
  comentarios TEXT,
  usuario_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Insertar usuario administrador por defecto (contraseña: admin123)
INSERT INTO usuarios (username, password, name, role) VALUES 
('admin', '$2b$10$1JnV9Gt8d8sFAOuchOD1UOHsYl1ncWrNLxLXgUZ3vYM2YJjk0lJVa', 'Administrador', 'admin');

-- Insertar algunos datos de ejemplo para clientes
INSERT INTO clientes (nombre, direccion, telefono, email) VALUES
('Cliente Ejemplo 1', 'Calle Principal 123', '555-1234', 'cliente1@ejemplo.com'),
('Cliente Ejemplo 2', 'Avenida Central 456', '555-5678', 'cliente2@ejemplo.com'),
('Cliente Ejemplo 3', 'Boulevard Norte 789', '555-9012', 'cliente3@ejemplo.com');

-- Insertar algunos datos de ejemplo para proveedores
INSERT INTO proveedores (nombre, contacto, telefono, email) VALUES
('Proveedor Ejemplo 1', 'Juan Pérez', '555-2468', 'proveedor1@ejemplo.com'),
('Proveedor Ejemplo 2', 'María Gómez', '555-1357', 'proveedor2@ejemplo.com');

-- Insertar algunos datos de ejemplo para productos
INSERT INTO productos (nombre, descripcion, precio, stock, proveedor_id) VALUES
('Producto 1', 'Descripción del producto 1', 10.50, 100, 1),
('Producto 2', 'Descripción del producto 2', 25.75, 50, 1),
('Producto 3', 'Descripción del producto 3', 5.25, 200, 2),
('Producto 4', 'Descripción del producto 4', 15.00, 75, 2);
