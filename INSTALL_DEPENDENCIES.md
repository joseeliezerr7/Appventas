# Dependencias adicionales para Reportes

Para que funcione correctamente la funcionalidad de reportes con filtros y exportación, necesitas instalar las siguientes dependencias:

## React Native Community DateTimePicker
```bash
npm install @react-native-community/datetimepicker
```

## Expo FileSystem y Sharing
```bash
npx expo install expo-file-system expo-sharing
```


## Instrucciones de instalación:

1. Navega al directorio del proyecto React Native:
   ```bash
   cd /ruta/al/proyecto/ventas-app
   ```

2. Ejecuta los comandos de instalación:
   ```bash
   npm install @react-native-community/datetimepicker
   npx expo install expo-file-system expo-sharing
   ```

3. Si estás usando React Native CLI (no Expo), también necesitarás:
   ```bash
   cd ios && pod install
   ```

4. Reinicia el servidor de desarrollo:
   ```bash
   npm start
   ```

## Funcionalidades implementadas:

### Filtros Avanzados:
- ✅ Filtros por fecha (inicio y fin)
- ✅ Filtros por categoría de producto
- ✅ Filtros por cliente específico
- ✅ Filtros por vendedor
- ✅ Filtros por estado de venta
- ✅ Contador de filtros activos
- ✅ Interfaz intuitiva con radio buttons y checkboxes

### Exportación:
- ✅ Exportación a CSV
- ✅ Exportación a Excel (formato compatible)
- ✅ Exportación a PDF (HTML convertible)
- ✅ Formateo automático de monedas y fechas
- ✅ Nombres de archivo con timestamp
- ✅ Compartir archivos con aplicaciones del sistema

### Mejoras en Reportes:
- ✅ Búsqueda en tiempo real
- ✅ Ordenamiento por columnas
- ✅ Botón flotante para filtros
- ✅ Resumen con métricas clave
- ✅ Estados de carga
- ✅ Manejo de errores

## Uso:

1. **Filtros Avanzados**: Presiona el botón flotante "Filtros" en cualquier reporte
2. **Exportación**: Usa el menú "Exportar" en la parte superior de cada reporte
3. **Búsqueda**: Usa la barra de búsqueda para filtrar resultados en tiempo real
4. **Ordenamiento**: Toca los encabezados de las columnas para ordenar

## Notas técnicas:

- Los archivos se guardan en el directorio de documentos de la aplicación
- La funcionalidad de compartir utiliza las aplicaciones nativas del sistema
- Los filtros se aplican en el backend para mejor rendimiento
- El formateo de datos respeta la configuración regional de México