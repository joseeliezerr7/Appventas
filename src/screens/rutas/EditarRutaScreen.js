import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { TextInput, Button, Text, Checkbox, Chip, Divider } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../../services/api';

const EditarRutaScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { ruta } = route.params;
  
  const [nombre, setNombre] = useState(ruta.nombre || '');
  const [descripcion, setDescripcion] = useState(ruta.descripcion || '');
  const [estado, setEstado] = useState(ruta.estado || 'activa');
  const [notas, setNotas] = useState(ruta.notas || '');
  const [diasVisita, setDiasVisita] = useState(() => {
    if (!ruta.diasVisita) return [];
    if (Array.isArray(ruta.diasVisita)) return ruta.diasVisita;
    try {
      return typeof ruta.diasVisita === 'string' ? JSON.parse(ruta.diasVisita) : [];
    } catch {
      return [];
    }
  });
  const [fechaInicio, setFechaInicio] = useState(() => {
    if (!ruta.fechaInicio) return new Date();
    return new Date(ruta.fechaInicio);
  });
  const [fechaFin, setFechaFin] = useState(() => {
    if (!ruta.fechaFin) return null;
    return new Date(ruta.fechaFin);
  });
  const [showInicioDatePicker, setShowInicioDatePicker] = useState(false);
  const [showFinDatePicker, setShowFinDatePicker] = useState(false);
  const [vendedorId, setVendedorId] = useState(() => {
    console.log('Datos de la ruta recibida:', ruta);
    console.log('usuario_id:', ruta.usuario_id);
    console.log('vendedor:', ruta.vendedor);
    return ruta.usuario_id ? ruta.usuario_id.toString() : '';
  });
  const [clientesSeleccionados, setClientesSeleccionados] = useState(ruta.clientes || []);
  const [todosClientes, setTodosClientes] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(false);

  const diasSemana = [
    { label: 'Lunes', value: 'lunes' },
    { label: 'Martes', value: 'martes' },
    { label: 'Miércoles', value: 'miercoles' },
    { label: 'Jueves', value: 'jueves' },
    { label: 'Viernes', value: 'viernes' },
    { label: 'Sábado', value: 'sabado' },
    { label: 'Domingo', value: 'domingo' },
  ];

  useEffect(() => {
    cargarClientes();
    cargarVendedores();
  }, []);

  const cargarClientes = async () => {
    try {
      const clientes = await api.getClientes();
      setTodosClientes(clientes);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      Alert.alert('Error', 'No se pudieron cargar los clientes');
    }
  };

  const cargarVendedores = async () => {
    try {
      const usuarios = await api.getUsuarios();
      const vendedoresActivos = usuarios.filter(usuario => 
        usuario.rol === 'vendedor' && usuario.activo === 1
      );
      setVendedores(vendedoresActivos);
    } catch (error) {
      console.error('Error al cargar vendedores:', error);
      Alert.alert('Error', 'No se pudieron cargar los vendedores');
    }
  };

  const toggleDiaVisita = (dia) => {
    if (diasVisita.includes(dia)) {
      setDiasVisita(diasVisita.filter(d => d !== dia));
    } else {
      setDiasVisita([...diasVisita, dia]);
    }
  };

  const toggleClienteSeleccionado = (cliente) => {
    const clienteId = cliente.cliente_id || cliente.id;
    if (clientesSeleccionados.some(c => (c.cliente_id || c.id) === clienteId)) {
      setClientesSeleccionados(clientesSeleccionados.filter(c => (c.cliente_id || c.id) !== clienteId));
    } else {
      setClientesSeleccionados([...clientesSeleccionados, cliente]);
    }
  };

  const handleInicioDateChange = (event, selectedDate) => {
    setShowInicioDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFechaInicio(selectedDate);
    }
  };

  const handleFinDateChange = (event, selectedDate) => {
    setShowFinDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFechaFin(selectedDate);
    }
  };

  const handleSubmit = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre de la ruta es obligatorio');
      return;
    }

    if (!vendedorId) {
      Alert.alert('Error', 'Debe seleccionar un vendedor');
      return;
    }

    if (diasVisita.length === 0) {
      Alert.alert('Error', 'Debe seleccionar al menos un día de visita');
      return;
    }

    if (clientesSeleccionados.length === 0) {
      Alert.alert('Error', 'Debe seleccionar al menos un cliente');
      return;
    }

    try {
      setLoading(true);
      
      const rutaActualizada = {
        nombre,
        descripcion,
        usuario_id: parseInt(vendedorId),
        estado,
        notas,
        dias_visita: diasVisita,
        fecha_inicio: fechaInicio.toISOString().split('T')[0],
        fecha_fin: fechaFin ? fechaFin.toISOString().split('T')[0] : null,
        clientes: clientesSeleccionados.map(c => ({
          cliente_id: c.cliente_id || c.id,
          orden: c.orden || 1
        }))
      };

      console.log('Actualizando ruta:', rutaActualizada);
      
      await api.updateRuta(ruta.id, rutaActualizada);
      
      Alert.alert('Éxito', 'Ruta actualizada correctamente', [
        { text: 'OK', onPress: () => navigation.navigate('RutasList', { refresh: true }) }
      ]);
    } catch (error) {
      console.error('Error al actualizar ruta:', error);
      Alert.alert('Error', 'No se pudo actualizar la ruta: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Editar Ruta</Text>
      
      <TextInput
        label="Nombre de la ruta"
        value={nombre}
        onChangeText={setNombre}
        style={styles.input}
        autoCapitalize="words"
      />
      
      <TextInput
        label="Descripción"
        value={descripcion}
        onChangeText={setDescripcion}
        style={styles.input}
        multiline
      />

      <Text style={styles.sectionTitle}>Vendedor asignado</Text>
      <View style={styles.vendedorContainer}>
        {vendedores.map((vendedor) => (
          <Chip
            key={vendedor.id}
            selected={vendedorId === vendedor.id.toString()}
            onPress={() => setVendedorId(vendedor.id.toString())}
            style={styles.vendedorChip}
            selectedColor="#0066cc"
          >
            {vendedor.nombre}
          </Chip>
        ))}
      </View>
      
      <Text style={styles.sectionTitle}>Fecha de inicio</Text>
      <Button 
        mode="outlined" 
        onPress={() => setShowInicioDatePicker(true)}
        style={styles.dateButton}
      >
        {fechaInicio.toLocaleDateString()}
      </Button>
      
      {showInicioDatePicker && (
        <DateTimePicker
          value={fechaInicio}
          mode="date"
          display="default"
          onChange={handleInicioDateChange}
        />
      )}
      
      <Text style={styles.sectionTitle}>Fecha de fin</Text>
      <Button 
        mode="outlined" 
        onPress={() => setShowFinDatePicker(true)}
        style={styles.dateButton}
      >
        {fechaFin ? fechaFin.toLocaleDateString() : 'Seleccionar fecha'}
      </Button>
      
      {showFinDatePicker && (
        <DateTimePicker
          value={fechaFin || new Date()}
          mode="date"
          display="default"
          onChange={handleFinDateChange}
        />
      )}
      
      <Text style={styles.sectionTitle}>Días de visita</Text>
      <View style={styles.diasContainer}>
        {diasSemana.map((dia) => (
          <Chip
            key={dia.value}
            selected={diasVisita.includes(dia.value)}
            onPress={() => toggleDiaVisita(dia.value)}
            style={styles.diaChip}
            selectedColor="#0066cc"
          >
            {dia.label}
          </Chip>
        ))}
      </View>
      
      <Text style={styles.sectionTitle}>Estado</Text>
      <View style={styles.estadoContainer}>
        <Chip
          selected={estado === 'activa'}
          onPress={() => setEstado('activa')}
          style={styles.estadoChip}
          selectedColor="#0066cc"
        >
          Activa
        </Chip>
        <Chip
          selected={estado === 'inactiva'}
          onPress={() => setEstado('inactiva')}
          style={styles.estadoChip}
          selectedColor="#0066cc"
        >
          Inactiva
        </Chip>
      </View>

      <Divider style={styles.divider} />
      
      <Text style={styles.sectionTitle}>Clientes en la ruta</Text>
      <Text style={styles.subtitle}>
        Clientes seleccionados: {clientesSeleccionados.length}
      </Text>
      
      <View style={styles.clientesContainer}>
        {todosClientes.map((cliente) => {
          const isSelected = clientesSeleccionados.some(c => 
            (c.cliente_id || c.id) === (cliente.cliente_id || cliente.id)
          );
          return (
            <View key={cliente.id} style={styles.clienteItem}>
              <Checkbox
                status={isSelected ? 'checked' : 'unchecked'}
                onPress={() => toggleClienteSeleccionado(cliente)}
              />
              <View style={styles.clienteInfo}>
                <Text style={styles.clienteNombre}>{cliente.nombre}</Text>
                <Text style={styles.clienteDireccion}>{cliente.direccion || 'Sin dirección'}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <Divider style={styles.divider} />
      
      <TextInput
        label="Notas adicionales"
        value={notas}
        onChangeText={setNotas}
        style={styles.input}
        multiline
        numberOfLines={4}
      />
      
      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.submitButton}
        loading={loading}
        disabled={loading}
      >
        Guardar Cambios
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 8,
  },
  diasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  diaChip: {
    margin: 4,
  },
  estadoContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  estadoChip: {
    margin: 4,
  },
  vendedorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  vendedorChip: {
    margin: 4,
  },
  divider: {
    marginVertical: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  clientesContainer: {
    marginBottom: 16,
  },
  clienteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
  },
  clienteInfo: {
    marginLeft: 12,
    flex: 1,
  },
  clienteNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  clienteDireccion: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  dateButton: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 40,
    paddingVertical: 8,
  },
});

export default EditarRutaScreen;
