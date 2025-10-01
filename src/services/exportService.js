import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
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

  // Exportar a PDF usando expo-print
  async exportToPDF(data, filename, headers, title) {
    try {
      if (!data || data.length === 0) {
        Alert.alert('Error', 'No hay datos para exportar');
        return;
      }

      // Generar HTML optimizado para PDF
      const htmlContent = this.generatePDFHTML(data, headers, title);

      // Crear PDF usando expo-print
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      // Mover el PDF al directorio de documentos con el nombre correcto
      const pdfUri = FileSystem.documentDirectory + `${filename}.pdf`;
      await FileSystem.moveAsync({
        from: uri,
        to: pdfUri
      });

      // Compartir el archivo PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartir reporte PDF'
        });
      } else {
        Alert.alert('Éxito', `Archivo PDF guardado en: ${pdfUri}`);
      }

    } catch (error) {
      console.error('Error al exportar PDF:', error);
      Alert.alert('Error', 'No se pudo exportar el archivo PDF');
    }
  }

  // Generar HTML optimizado para PDF
  generatePDFHTML(data, headers, title) {
    const fecha = new Date().toLocaleDateString('es-MX');
    
    const htmlHeaders = headers.map(header => `<th>${header}</th>`).join('');
    
    const htmlRows = data.map(row => {
      const cells = headers.map(header => {
        const key = this.getKeyFromHeader(header);
        let value = row[key] || '';
        let cssClass = '';

        // Formatear valores especiales y asignar clases CSS
        if (key.includes('fecha') && value) {
          value = formatDate(value);
        } else if (key.includes('total') || key.includes('precio') || key.includes('ingresos') || key.includes('gastado') || key.includes('vendido')) {
          value = formatCurrency(value);
          cssClass = 'currency';
        } else if (key.includes('cantidad') || key.includes('numero') || key.includes('compras') || key.includes('ventas') || key.includes('stock')) {
          cssClass = 'number';
        }

        return `<td class="${cssClass}">${value}</td>`;
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
            font-family: 'Segoe UI', Arial, sans-serif;
            margin: 15px;
            color: #333;
            font-size: 12px;
            line-height: 1.4;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #0066cc;
            padding-bottom: 10px;
        }
        .title {
            color: #0066cc;
            font-size: 20px;
            margin: 0 0 8px 0;
            font-weight: bold;
        }
        .subtitle {
            color: #666;
            font-size: 11px;
            margin: 3px 0;
        }
        .meta-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            font-size: 10px;
            color: #888;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 11px;
        }
        th, td {
            border: 1px solid #ccc;
            padding: 6px 8px;
            text-align: left;
            vertical-align: top;
        }
        th {
            background-color: #f5f5f5;
            font-weight: bold;
            color: #333;
            font-size: 11px;
        }
        tr:nth-child(even) {
            background-color: #fafafa;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 9px;
            color: #888;
            border-top: 1px solid #ddd;
            padding-top: 8px;
        }
        .currency {
            text-align: right;
        }
        .number {
            text-align: right;
        }
        @page {
            size: A4;
            margin: 1cm;
        }
        @media print {
            body {
                margin: 0;
                -webkit-print-color-adjust: exact;
            }
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
        <p>Página generada el ${new Date().toLocaleString('es-MX')}</p>
    </div>
</body>
</html>`;
  }

  // Convertir encabezado a clave de objeto
  getKeyFromHeader(header) {
    const mapping = {
      // Productos
      'Código': 'producto_codigo',
      'Producto': 'producto_nombre',
      'Categoría': 'categoria_nombre',
      'Stock': 'stock_total',
      'Precio': 'precio',
      'Vendido Este Mes': 'vendido_mes_actual',
      'Estado': 'estado',
      // Ventas por producto
      'Cantidad': 'total_cantidad_vendida',
      'Ingresos': 'total_ingresos',
      'Ventas': 'numero_ventas',
      'Precio Prom.': 'precio_promedio',
      // Clientes
      'Cliente': 'cliente_nombre',
      'Teléfono': 'telefono',
      'Email': 'email',
      'Dirección': 'direccion',
      'Compras': 'numero_compras',
      'Total Gastado': 'total_gastado',
      'Ticket Prom.': 'ticket_promedio',
      'Primera Compra': 'primera_compra',
      'Última Compra': 'ultima_compra',
      // Vendedores
      'Vendedor': 'vendedor_nombre',
      'Total Vendido': 'total_vendido',
      'Clientes Atendidos': 'clientes_atendidos',
      'Primera Venta': 'primera_venta',
      'Última Venta': 'ultima_venta',
      // Genérico
      'Métrica': 'metrica',
      'Valor': 'valor',
      'Período': 'periodo'
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