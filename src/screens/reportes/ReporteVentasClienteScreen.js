import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, ActivityIndicator, DataTable, Searchbar, Menu } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency, formatDate, formatPhoneNumber } from '../../utils/formatters';
import api from '../../services/api';
import { exportService } from '../../services/exportService';

const ReporteVentasClienteScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { periodo } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('total_gastado');
  const [sortDirection, setSortDirection] = useState('desc');
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    cargarReporte();
  }, []);

  useEffect(() => {
    filtrarDatos();
  }, [searchQuery, data]);

  const cargarReporte = async () => {
    try {
      setLoading(true);
      
      const fechas = calcularFechasPorPeriodo(periodo);
      const params = new URLSearchParams();
      if (fechas.fecha_inicio) params.append('fecha_inicio', fechas.fecha_inicio);
      if (fechas.fecha_fin) params.append('fecha_fin', fechas.fecha_fin);

      const response = await api.get(`/reportes/ventas-por-cliente?${params.toString()}`);
      setData(response.data);
      setFilteredData(response.data);
    } catch (error) {
      console.error('Error al cargar reporte:', error);
      Alert.alert('Error', 'No se pudo cargar el reporte de ventas por cliente');
    } finally {
      setLoading(false);
    }
  };

  const calcularFechasPorPeriodo = (periodo) => {
    const hoy = new Date();
    let fecha_inicio, fecha_fin;

    switch (periodo?.toLowerCase()) {
      case 'hoy':
        fecha_inicio = fecha_fin = hoy.toISOString().split('T')[0];
        break;
      case 'esta semana':
        const inicioSemana = new Date(hoy.setDate(hoy.getDate() - hoy.getDay()));
        fecha_inicio = inicioSemana.toISOString().split('T')[0];
        fecha_fin = new Date().toISOString().split('T')[0];
        break;
      case 'este mes':
        fecha_inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
        fecha_fin = new Date().toISOString().split('T')[0];
        break;
      default:
        fecha_inicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        fecha_fin = new Date().toISOString().split('T')[0];
    }

    return { fecha_inicio, fecha_fin };
  };

  const filtrarDatos = () => {
    if (!data || !Array.isArray(data)) {
      setFilteredData([]);
      return;
    }

    if (!searchQuery.trim()) {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter(item =>
      (item?.cliente_nombre || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item?.telefono && item.telefono.includes(searchQuery))
    );
    setFilteredData(filtered);
  };

  const ordenarDatos = (field) => {
    if (!filteredData || !Array.isArray(filteredData)) {
      return;
    }

    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);

    const sorted = [...filteredData].sort((a, b) => {
      let aVal = a?.[field] || '';
      let bVal = b?.[field] || '';

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredData(sorted);
  };

  const calcularTotales = () => {
    if (!filteredData || !Array.isArray(filteredData) || filteredData.length === 0) {
      return { totalGastado: 0, totalCompras: 0, promedioTicket: 0 };
    }
    
    return filteredData.reduce((acc, item) => ({
      totalGastado: acc.totalGastado + parseFloat(item?.total_gastado || 0),
      totalCompras: acc.totalCompras + parseInt(item?.numero_compras || 0),
      promedioTicket: 0 // Se calculará después
    }), { totalGastado: 0, totalCompras: 0 });
  };

  const exportarDatos = async (formato) => {
    try {
      setMenuVisible(false);

      if (!filteredData || !Array.isArray(filteredData) || filteredData.length === 0) {
        Alert.alert('Error', 'No hay datos para exportar');
        return;
      }

      const headers = ['Cliente', 'Teléfono', 'Email', 'Dirección', 'Compras', 'Total Gastado', 'Ticket Prom.', 'Primera Compra', 'Última Compra'];
      const title = `Reporte de Ventas por Cliente - ${periodo || 'Este mes'}`;
      const filename = 'ventas_por_cliente';

      await exportService.exportData(formato, filteredData, filename, headers, title);
    } catch (error) {
      console.error('Error al exportar:', error);
      Alert.alert('Error', 'No se pudo exportar el reporte');
    }
  };

  const totales = calcularTotales();
  totales.promedioTicket = totales.totalCompras > 0 ? totales.totalGastado / totales.totalCompras : 0;

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loaderText}>Generando reporte...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Ventas por Cliente</Text>
          <Text style={styles.subtitle}>Período: {periodo || 'Este mes'}</Text>
        </View>
        
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button 
              icon="download"
              mode="outlined"
              onPress={() => setMenuVisible(true)}
            >
              Exportar
            </Button>
          }
        >
          <Menu.Item title="Excel" onPress={() => exportarDatos('excel')} />
          <Menu.Item title="PDF" onPress={() => exportarDatos('pdf')} />
          <Menu.Item title="CSV" onPress={() => exportarDatos('csv')} />
        </Menu>
      </View>

      <Card style={styles.resumenCard}>
        <Card.Content>
          <Text style={styles.resumenTitle}>Resumen del Reporte</Text>
          <View style={styles.resumenGrid}>
            <View style={styles.resumenItem}>
              <Text style={styles.resumenValue}>{formatCurrency(totales.totalGastado)}</Text>
              <Text style={styles.resumenLabel}>Total Ventas</Text>
            </View>
            <View style={styles.resumenItem}>
              <Text style={styles.resumenValue}>{(filteredData || []).length}</Text>
              <Text style={styles.resumenLabel}>Clientes</Text>
            </View>
            <View style={styles.resumenItem}>
              <Text style={styles.resumenValue}>{totales.totalCompras}</Text>
              <Text style={styles.resumenLabel}>Total Compras</Text>
            </View>
            <View style={styles.resumenItem}>
              <Text style={styles.resumenValue}>{formatCurrency(totales.promedioTicket)}</Text>
              <Text style={styles.resumenLabel}>Ticket Promedio</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Searchbar
        placeholder="Buscar clientes..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <ScrollView horizontal style={styles.tableContainer}>
        <DataTable style={styles.dataTable}>
          <DataTable.Header>
            <DataTable.Title
              style={styles.nameColumn}
              sortDirection={sortField === 'cliente_nombre' ? sortDirection : undefined}
              onPress={() => ordenarDatos('cliente_nombre')}
            >
              Cliente
            </DataTable.Title>
            <DataTable.Title
              style={styles.phoneColumn}
            >
              Teléfono
            </DataTable.Title>
            <DataTable.Title
              numeric
              sortDirection={sortField === 'numero_compras' ? sortDirection : undefined}
              onPress={() => ordenarDatos('numero_compras')}
            >
              Compras
            </DataTable.Title>
            <DataTable.Title
              numeric
              sortDirection={sortField === 'total_gastado' ? sortDirection : undefined}
              onPress={() => ordenarDatos('total_gastado')}
            >
              Total Gastado
            </DataTable.Title>
            <DataTable.Title
              numeric
              sortDirection={sortField === 'ticket_promedio' ? sortDirection : undefined}
              onPress={() => ordenarDatos('ticket_promedio')}
            >
              Ticket Prom.
            </DataTable.Title>
            <DataTable.Title
              sortDirection={sortField === 'ultima_compra' ? sortDirection : undefined}
              onPress={() => ordenarDatos('ultima_compra')}
            >
              Última Compra
            </DataTable.Title>
          </DataTable.Header>

          {(filteredData || []).map((item, index) => (
            <DataTable.Row key={item?.id || index}>
              <DataTable.Cell style={styles.nameColumn}>
                {item?.cliente_nombre || '-'}
              </DataTable.Cell>
              <DataTable.Cell style={styles.phoneColumn}>
                {formatPhoneNumber(item?.telefono)}
              </DataTable.Cell>
              <DataTable.Cell numeric>
                {item?.numero_compras || 0}
              </DataTable.Cell>
              <DataTable.Cell numeric>
                {formatCurrency(item?.total_gastado || 0)}
              </DataTable.Cell>
              <DataTable.Cell numeric>
                {formatCurrency(item?.ticket_promedio || 0)}
              </DataTable.Cell>
              <DataTable.Cell>
                {formatDate(item?.ultima_compra)}
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </ScrollView>

      {(!filteredData || filteredData.length === 0) && !loading && (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No hay datos para mostrar</Text>
          <Text style={styles.emptySubtext}>
            No se encontraron ventas para el período seleccionado
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  resumenCard: {
    margin: 16,
    elevation: 2,
  },
  resumenTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resumenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  resumenItem: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 5,
    marginBottom: 8,
    alignItems: 'center',
  },
  resumenValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  resumenLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  searchbar: {
    margin: 16,
    marginTop: 0,
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  dataTable: {
    backgroundColor: 'white',
    minWidth: 700,
  },
  nameColumn: {
    flex: 2,
    minWidth: 150,
  },
  phoneColumn: {
    flex: 1,
    minWidth: 120,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    color: '#666',
  },
});

export default ReporteVentasClienteScreen;