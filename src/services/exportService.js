import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { formatCurrency, formatDate } from '../utils/formatters';

class ExportService {
  
  // Exportar a CSV
  async exportToCSV(data, filename, headers) {
    try {
      if (!data || data.length === 0) {
        Alert.alert('Error', 'No hay datos para exportar');
        return;
      }

      // Crear encabezados CSV
      const csvHeaders = headers.join(',');
      
      // Convertir datos a CSV
      const csvRows = data.map(row => {
        return headers.map(header => {
          const key = this.getKeyFromHeader(header);
          let value = row[key] || '';
          
          // Formatear valores especiales
          if (key.includes('fecha') && value) {
            value = formatDate(value);
          } else if (key.includes('total') || key.includes('precio') || key.includes('ingresos')) {
            value = parseFloat(value || 0).toFixed(2);
          }
          
          // Escapar comillas y comas
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          
          return value;
        }).join(',');
      });

      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      // Guardar archivo
      const fileUri = FileSystem.documentDirectory + `${filename}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Compartir archivo
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Éxito', `Archivo guardado en: ${fileUri}`);
      }

    } catch (error) {
      console.error('Error al exportar CSV:', error);
      Alert.alert('Error', 'No se pudo exportar el archivo CSV');
    }
  }

  // Exportar a Excel (formato CSV compatible con Excel)
  async exportToExcel(data, filename, headers) {
    try {
      if (!data || data.length === 0) {
        Alert.alert('Error', 'No hay datos para exportar');
        return;
      }

      // Usar BOM para UTF-8 para compatibilidad con Excel
      const BOM = '\uFEFF';
      
      // Crear encabezados
      const excelHeaders = headers.join('\t'); // Usar tabs para mejor compatibilidad
      
      // Convertir datos
      const excelRows = data.map(row => {
        return headers.map(header => {
          const key = this.getKeyFromHeader(header);
          let value = row[key] || '';
          
          // Formatear valores especiales
          if (key.includes('fecha') && value) {
            value = formatDate(value);
          } else if (key.includes('total') || key.includes('precio') || key.includes('ingresos')) {
            value = formatCurrency(value);
          }
          
          return value;
        }).join('\t');
      });

      const excelContent = BOM + [excelHeaders, ...excelRows].join('\n');
      
      // Guardar archivo
      const fileUri = FileSystem.documentDirectory + `${filename}.xls`;
      await FileSystem.writeAsStringAsync(fileUri, excelContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Compartir archivo
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Éxito', `Archivo guardado en: ${fileUri}`);
      }

    } catch (error) {
      console.error('Error al exportar Excel:', error);
      Alert.alert('Error', 'No se pudo exportar el archivo Excel');
    }
  }

  // Exportar a PDF (HTML convertido a PDF)
  async exportToPDF(data, filename, headers, title) {
    try {
      if (!data || data.length === 0) {
        Alert.alert('Error', 'No hay datos para exportar');
        return;
      }

      // Generar HTML
      const htmlContent = this.generateHTMLTable(data, headers, title);
      
      // Guardar como HTML primero
      const htmlUri = FileSystem.documentDirectory + `${filename}.html`;
      await FileSystem.writeAsStringAsync(htmlUri, htmlContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Compartir archivo HTML (el usuario puede convertir a PDF usando su navegador)
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(htmlUri);
        Alert.alert(
          'Archivo HTML Generado', 
          'Se ha generado un archivo HTML que puedes abrir en tu navegador y guardar como PDF usando la función de impresión.'
        );
      } else {
        Alert.alert('Éxito', `Archivo HTML guardado en: ${htmlUri}`);
      }

    } catch (error) {
      console.error('Error al exportar PDF:', error);
      Alert.alert('Error', 'No se pudo exportar el archivo PDF');
    }
  }

  // Generar tabla HTML para PDF
  generateHTMLTable(data, headers, title) {
    const fecha = new Date().toLocaleDateString('es-MX');
    
    const htmlHeaders = headers.map(header => `<th>${header}</th>`).join('');
    
    const htmlRows = data.map(row => {
      const cells = headers.map(header => {
        const key = this.getKeyFromHeader(header);
        let value = row[key] || '';
        
        // Formatear valores especiales
        if (key.includes('fecha') && value) {
          value = formatDate(value);
        } else if (key.includes('total') || key.includes('precio') || key.includes('ingresos')) {
          value = formatCurrency(value);
        }
        
        return `<td>${value}</td>`;
      }).join('');
      
      return `<tr>${cells}</tr>`;
    }).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #0066cc;
            padding-bottom: 10px;
        }
        .title {
            color: #0066cc;
            font-size: 24px;
            margin: 0;
        }
        .subtitle {
            color: #666;
            font-size: 14px;
            margin: 5px 0;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left;
        }
        th { 
            background-color: #f2f2f2; 
            font-weight: bold;
            color: #333;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">${title}</h1>
        <p class="subtitle">Generado el ${fecha}</p>
        <p class="subtitle">Total de registros: ${data.length}</p>
    </div>
    
    <table>
        <thead>
            <tr>${htmlHeaders}</tr>
        </thead>
        <tbody>
            ${htmlRows}
        </tbody>
    </table>
    
    <div class="footer">
        <p>Sistema de Ventas - Reporte generado automáticamente</p>
    </div>
</body>
</html>`;
  }

  // Convertir encabezado a clave de objeto
  getKeyFromHeader(header) {
    const mapping = {
      'Código': 'producto_codigo',
      'Producto': 'producto_nombre',
      'Cantidad': 'total_cantidad_vendida',
      'Ingresos': 'total_ingresos',
      'Ventas': 'numero_ventas',
      'Precio Prom.': 'precio_promedio',
      'Cliente': 'cliente_nombre',
      'Teléfono': 'telefono',
      'Compras': 'numero_compras',
      'Total Gastado': 'total_gastado',
      'Ticket Prom.': 'ticket_promedio',
      'Última Compra': 'ultima_compra',
      'Vendedor': 'vendedor_nombre',
      'Email': 'email',
      'Total Vendido': 'total_vendido',
      'Clientes Atendidos': 'clientes_atendidos',
      'Stock': 'stock_total',
      'Categoría': 'categoria_nombre',
      'Precio': 'precio',
      'Métrica': 'metrica',
      'Valor': 'valor',
      'Período': 'periodo',
      'Vendedor': 'vendedor_nombre',
      'Clientes': 'clientes_atendidos'
    };
    
    return mapping[header] || header.toLowerCase().replace(/ /g, '_');
  }

  // Método principal para exportar
  async exportData(formato, data, filename, headers, title) {
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const fullFilename = `${filename}_${timestamp}`;

      switch (formato.toLowerCase()) {
        case 'csv':
          await this.exportToCSV(data, fullFilename, headers);
          break;
        case 'excel':
          await this.exportToExcel(data, fullFilename, headers);
          break;
        case 'pdf':
          await this.exportToPDF(data, fullFilename, headers, title);
          break;
        default:
          Alert.alert('Error', 'Formato de exportación no soportado');
      }
    } catch (error) {
      console.error('Error en exportación:', error);
      Alert.alert('Error', 'No se pudo completar la exportación');
    }
  }
}

export const exportService = new ExportService();