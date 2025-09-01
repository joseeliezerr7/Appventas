import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { 
  Text, 
  Button, 
  TextInput, 
  Card, 
  Divider, 
  Chip,
  Portal,
  Dialog,
  RadioButton,
  Checkbox
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { formatDateForInput, formatDate } from '../utils/formatters';
import api from '../services/api';

const FiltrosAvanzados = ({ 
  visible, 
  onDismiss, 
  onApplyFilters, 
  tipoReporte = 'ventas', 
  filtrosIniciales = {} 
}) => {
  const [filtros, setFiltros] = useState({
    fecha_inicio: null,
    fecha_fin: null,
    producto_id: null,
    cliente_id: null,
    vendedor_id: null,
    categoria_id: null,
    estado: null,
    ...filtrosIniciales
  });

  const [showDatePicker, setShowDatePicker] = useState(null);
  const [opciones, setOpciones] = useState({
    productos: [],
    clientes: [],
    vendedores: [],
    categorias: []
  });
  const [loadingOpciones, setLoadingOpciones] = useState(false);

  useEffect(() => {
    if (visible) {
      cargarOpciones();
    }
  }, [visible]);

  const cargarOpciones = async () => {
    try {
      setLoadingOpciones(true);
      
      const requests = [];
      
      if (tipoReporte === 'ventas' || tipoReporte === 'productos') {
        requests.push(api.get('/productos'));
        requests.push(api.get('/categorias'));
      }
      
      if (tipoReporte === 'ventas' || tipoReporte === 'clientes') {
        requests.push(api.get('/clientes'));
      }
      
      if (tipoReporte === 'ventas' || tipoReporte === 'vendedores') {
        requests.push(api.get('/usuarios'));
      }

      const responses = await Promise.all(requests);
      
      let index = 0;
      const nuevasOpciones = { ...opciones };
      
      if (tipoReporte === 'ventas' || tipoReporte === 'productos') {
        nuevasOpciones.productos = responses[index]?.data || [];
        index++;
        nuevasOpciones.categorias = responses[index]?.data || [];
        index++;
      }
      
      if (tipoReporte === 'ventas' || tipoReporte === 'clientes') {
        nuevasOpciones.clientes = responses[index]?.data || [];
        index++;
      }
      
      if (tipoReporte === 'ventas' || tipoReporte === 'vendedores') {
        nuevasOpciones.vendedores = responses[index]?.data || [];
      }
      
      setOpciones(nuevasOpciones);
    } catch (error) {
      console.error('Error al cargar opciones:', error);
    } finally {
      setLoadingOpciones(false);
    }
  };

  const handleDateChange = (event, selectedDate, tipo) => {
    setShowDatePicker(null);
    if (selectedDate) {
      setFiltros(prev => ({
        ...prev,
        [tipo]: formatDateForInput(selectedDate)
      }));
    }
  };

  const aplicarFiltros = () => {
    onApplyFilters(filtros);
    onDismiss();
  };

  const limpiarFiltros = () => {
    setFiltros({
      fecha_inicio: null,
      fecha_fin: null,
      producto_id: null,
      cliente_id: null,
      vendedor_id: null,
      categoria_id: null,
      estado: null
    });
  };

  const contarFiltrosActivos = () => {
    const valores = Object.values(filtros || {});
    return valores.filter(value => value !== null && value !== '').length;
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>
          Filtros Avanzados
          {contarFiltrosActivos() > 0 && (
            <Chip style={styles.contadorChip} textStyle={styles.contadorText}>
              {contarFiltrosActivos()}
            </Chip>
          )}
        </Dialog.Title>
        
        <Dialog.ScrollArea style={styles.scrollArea}>
          <View style={styles.content}>
            
            {/* Filtros de Fecha */}
            <Card style={styles.sectionCard}>
              <Card.Title title="Período" left={(props) => <Ionicons {...props} name="calendar-outline" size={20} />} />
              <Card.Content>
                <View style={styles.dateRow}>
                  <View style={styles.dateField}>
                    <Text style={styles.label}>Fecha Inicio</Text>
                    <Button
                      mode="outlined"
                      onPress={() => setShowDatePicker('fecha_inicio')}
                      icon="calendar"
                      style={styles.dateButton}
                    >
                      {filtros.fecha_inicio ? formatDate(filtros.fecha_inicio) : 'Seleccionar'}
                    </Button>
                  </View>
                  
                  <View style={styles.dateField}>
                    <Text style={styles.label}>Fecha Fin</Text>
                    <Button
                      mode="outlined"
                      onPress={() => setShowDatePicker('fecha_fin')}
                      icon="calendar"
                      style={styles.dateButton}
                    >
                      {filtros.fecha_fin ? formatDate(filtros.fecha_fin) : 'Seleccionar'}
                    </Button>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Filtros específicos por tipo de reporte */}
            {(tipoReporte === 'ventas' || tipoReporte === 'productos') && (
              <Card style={styles.sectionCard}>
                <Card.Title title="Productos" left={(props) => <Ionicons {...props} name="cube-outline" size={20} />} />
                <Card.Content>
                  <View style={styles.pickerContainer}>
                    <Text style={styles.label}>Categoría</Text>
                    <RadioButton.Group
                      onValueChange={(value) => setFiltros(prev => ({ ...prev, categoria_id: value === 'all' ? null : value }))}
                      value={filtros.categoria_id || 'all'}
                    >
                      <View style={styles.radioItem}>
                        <RadioButton value="all" />
                        <Text>Todas las categorías</Text>
                      </View>
                      {(opciones.categorias || []).map(categoria => (
                        <View key={categoria.id} style={styles.radioItem}>
                          <RadioButton value={categoria.id.toString()} />
                          <Text>{categoria.nombre}</Text>
                        </View>
                      ))}
                    </RadioButton.Group>
                  </View>
                </Card.Content>
              </Card>
            )}

            {(tipoReporte === 'ventas' || tipoReporte === 'clientes') && (
              <Card style={styles.sectionCard}>
                <Card.Title title="Clientes" left={(props) => <Ionicons {...props} name="people-outline" size={20} />} />
                <Card.Content>
                  <View style={styles.checkboxContainer}>
                    {(opciones.clientes || []).slice(0, 10).map(cliente => (
                      <View key={cliente.id} style={styles.checkboxItem}>
                        <Checkbox
                          status={filtros.cliente_id === cliente.id.toString() ? 'checked' : 'unchecked'}
                          onPress={() => {
                            const newValue = filtros.cliente_id === cliente.id.toString() ? null : cliente.id.toString();
                            setFiltros(prev => ({ ...prev, cliente_id: newValue }));
                          }}
                        />
                        <Text style={styles.checkboxLabel}>{cliente.nombre}</Text>
                      </View>
                    ))}
                    {(opciones.clientes || []).length > 10 && (
                      <Text style={styles.moreText}>
                        ... y {(opciones.clientes || []).length - 10} más
                      </Text>
                    )}
                  </View>
                </Card.Content>
              </Card>
            )}

            {(tipoReporte === 'ventas' || tipoReporte === 'vendedores') && (
              <Card style={styles.sectionCard}>
                <Card.Title title="Vendedores" left={(props) => <Ionicons {...props} name="person-outline" size={20} />} />
                <Card.Content>
                  <RadioButton.Group
                    onValueChange={(value) => setFiltros(prev => ({ ...prev, vendedor_id: value === 'all' ? null : value }))}
                    value={filtros.vendedor_id || 'all'}
                  >
                    <View style={styles.radioItem}>
                      <RadioButton value="all" />
                      <Text>Todos los vendedores</Text>
                    </View>
                    {(opciones.vendedores || []).map(vendedor => (
                      <View key={vendedor.id} style={styles.radioItem}>
                        <RadioButton value={vendedor.id.toString()} />
                        <Text>{vendedor.nombre}</Text>
                      </View>
                    ))}
                  </RadioButton.Group>
                </Card.Content>
              </Card>
            )}

            {/* Filtro de Estado */}
            <Card style={styles.sectionCard}>
              <Card.Title title="Estado" left={(props) => <Ionicons {...props} name="flag-outline" size={20} />} />
              <Card.Content>
                <RadioButton.Group
                  onValueChange={(value) => setFiltros(prev => ({ ...prev, estado: value === 'all' ? null : value }))}
                  value={filtros.estado || 'all'}
                >
                  <View style={styles.radioItem}>
                    <RadioButton value="all" />
                    <Text>Todos los estados</Text>
                  </View>
                  <View style={styles.radioItem}>
                    <RadioButton value="completada" />
                    <Text>Completadas</Text>
                  </View>
                  <View style={styles.radioItem}>
                    <RadioButton value="cancelada" />
                    <Text>Canceladas</Text>
                  </View>
                  <View style={styles.radioItem}>
                    <RadioButton value="pendiente" />
                    <Text>Pendientes</Text>
                  </View>
                </RadioButton.Group>
              </Card.Content>
            </Card>

          </View>
        </Dialog.ScrollArea>
        
        <Dialog.Actions>
          <Button onPress={limpiarFiltros}>Limpiar</Button>
          <Button onPress={onDismiss}>Cancelar</Button>
          <Button mode="contained" onPress={aplicarFiltros}>Aplicar</Button>
        </Dialog.Actions>
      </Dialog>

      {/* Date Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={filtros[showDatePicker] ? new Date(filtros[showDatePicker]) : new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => handleDateChange(event, date, showDatePicker)}
        />
      )}
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '90%',
  },
  scrollArea: {
    maxHeight: 400,
  },
  content: {
    paddingVertical: 10,
  },
  sectionCard: {
    marginBottom: 10,
    elevation: 1,
  },
  contadorChip: {
    marginLeft: 10,
    backgroundColor: '#0066cc',
  },
  contadorText: {
    color: 'white',
    fontSize: 12,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateField: {
    flex: 1,
    marginHorizontal: 5,
  },
  dateButton: {
    marginTop: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  pickerContainer: {
    marginTop: 10,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  checkboxContainer: {
    marginTop: 10,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
  },
  moreText: {
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default FiltrosAvanzados;