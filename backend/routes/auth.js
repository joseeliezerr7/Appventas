const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// POST /api/auth/login - Iniciar sesión
router.post('/login', async (req, res) => {
  try {
    // Aceptar tanto 'email' como 'username' para compatibilidad con el frontend
    const email = req.body.email || req.body.username;
    const { password } = req.body;
    
    console.log('Intento de login con:', { email, passwordProvided: !!password });
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }
    
    // Buscar el usuario en la base de datos
    const [usuarios] = await req.app.locals.pool.query(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );
    
    if (usuarios.length === 0) {
      console.log(`Intento de inicio de sesión fallido: Usuario ${email} no encontrado`);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    const usuario = usuarios[0];
    
    // Verificar la contraseña
    // Para desarrollo, permitir contraseña "admin" para el usuario admin@ventas-app.com
    let passwordIsValid = false;
    
    if (email === 'admin@ventas-app.com' && password === 'admin') {
      passwordIsValid = true;
      console.log('Inicio de sesión con credenciales de desarrollo');
    } else if (usuario.password) {
      // Verificar contraseña con hash (si se implementa en el futuro)
      passwordIsValid = await bcrypt.compare(password, usuario.password);
    }
    
    if (!passwordIsValid) {
      console.log(`Intento de inicio de sesión fallido: Contraseña incorrecta para ${email}`);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    // Crear token JWT
    const token = jwt.sign(
      { 
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol || 'usuario'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log(`Usuario ${email} ha iniciado sesión exitosamente`);
    
    // Devolver información del usuario y token en el formato que espera el frontend
    res.status(200).json({
      user: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol || 'usuario'
      },
      token
    });
  } catch (error) {
    console.error('Error en inicio de sesión:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

// GET /api/auth/perfil - Obtener perfil del usuario autenticado
router.get('/perfil', async (req, res) => {
  try {
    // Usar el middleware de autenticación
    req.app.locals.authenticateToken(req, res, async () => {
      const userId = req.user.id;
      
      // Obtener datos del usuario
      const [usuarios] = await req.app.locals.pool.query(
        'SELECT id, nombre, email, rol, created_at, updated_at FROM usuarios WHERE id = ?',
        [userId]
      );
      
      if (usuarios.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      res.status(200).json(usuarios[0]);
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

module.exports = router;
