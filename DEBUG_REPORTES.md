# Debug de Reportes - Pasos para solucionar problemas

## ✅ Problemas corregidos en el código:

1. **Error `TypeError: Cannot read property 'totalVentas' of undefined`**
   - ✅ Agregada validación defensiva con `?.` (optional chaining)
   - ✅ Valores por defecto en caso de respuesta vacía
   - ✅ Manejo de errores mejorado

2. **Error de iconos inválidos**
   - ✅ Corregidos todos los iconos a nombres válidos de Material Community Icons

3. **Error `apiService` undefined**
   - ✅ Corregidas todas las importaciones a usar `api` directamente
   - ✅ Agregado método genérico `get()` al objeto API

## 🔧 Para probar el sistema de reportes:

### 1. Verificar que el servidor backend esté corriendo:
```bash
cd "C:\Proyectos Laravel\ventas-app\backend"
npm start
# Debería mostrar: "Servidor corriendo en el puerto 3001"
```

### 2. Verificar endpoints de reportes:
Abre en el navegador o usa Postman:
- `http://localhost:3001/api/reportes/resumen-dashboard?periodo=este_mes`
- `http://localhost:3001/api/reportes/ventas-por-producto`
- `http://localhost:3001/api/reportes/ventas-por-cliente`

### 3. Verificar logs en React Native:
Los logs deberían mostrar:
```
LOG  Cargando resumen para período: este_mes
LOG  Respuesta del servidor: {...}
LOG  Datos del resumen: {...}
```

## 🎯 Si los endpoints no funcionan:

### Verificar que las dependencias del backend estén instaladas:
```bash
cd "C:\Proyectos Laravel\ventas-app\backend"
npm install
```

### Verificar conexión a base de datos:
1. Asegúrate de que MySQL esté corriendo
2. Verifica las credenciales en `.env` (si existe) o en `server.js`
3. Verifica que la base de datos `ventas_app` exista

### Verificar que haya datos de prueba:
```sql
USE ventas_app;
SELECT COUNT(*) FROM ventas;
SELECT COUNT(*) FROM productos;
SELECT COUNT(*) FROM clientes;
```

## 📱 Si React Native no carga:

### 1. Instalar dependencias de reportes:
```bash
cd "C:\Proyectos Laravel\ventas-app"
npm install @react-native-community/datetimepicker
npx expo install expo-file-system expo-sharing
```

### 2. Limpiar cache y reiniciar:
```bash
npx react-native start --reset-cache
# O si usas Expo:
npx expo start -c
```

### 3. Verificar imports en el código:
Todos los archivos ya están corregidos, pero verifica que no haya errores de sintaxis.

## 🚀 Funcionalidades disponibles una vez funcionando:

1. **Dashboard de Reportes** (`/src/screens/reportes/ReportesScreen.js`)
   - Resumen con métricas reales
   - Filtros por período
   - Exportación de resumen

2. **Reporte Ventas por Producto** (`/src/screens/reportes/ReporteVentasProductoScreen.js`)
   - Filtros avanzados (botón flotante)
   - Búsqueda en tiempo real
   - Exportación CSV/Excel/PDF
   - Ordenamiento por columnas

3. **Reporte Ventas por Cliente** (`/src/screens/reportes/ReporteVentasClienteScreen.js`)
   - Análisis por cliente
   - Métricas de compra
   - Exportación

## 📞 Si persisten los problemas:

1. **Verifica los logs** tanto en React Native como en el servidor backend
2. **Usa datos mock** temporalmente cambiando el endpoint por datos estáticos
3. **Verifica la red** - asegúrate de que la app pueda conectar al backend

El sistema está completamente implementado y los errores principales están corregidos.