// Script para probar la sintaxis del archivo de devoluciones
try {
  require('./routes/devoluciones.js');
  console.log('✅ Sintaxis correcta en devoluciones.js');
} catch (error) {
  console.error('❌ Error de sintaxis en devoluciones.js:', error.message);
  console.error('Ubicación del error:', error.stack);
}