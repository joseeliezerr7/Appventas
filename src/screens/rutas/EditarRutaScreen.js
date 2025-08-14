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
  const [diasVisita, setDiasVisita] = useState(ruta.diasVisita || []);
  const [fechaInicio, setFechaInicio] = useState(ruta.fechaInicio ? new Date(ruta.fechaInicio) : new Date());
  const [fechaFin, setFechaFin] = useState(ruta.fechaFin ? new Date(ruta.fechaFin) : new Date());
  const [showInicioDatePicker, setShowInicioDatePicker] = useState(false);
  const [showFinDatePicker, setShowFinDatePicker] = useState(false);
  const [clientesSeleccionados, setClientesSeleccionados] = useState(ruta.clientes || []);
  const [todosClientes, setTodosClientes] = useState([]);
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

  const toggleDiaVisita = (dia) => {
    if (diasVisita.includes(dia)) {
      setDiasVisita(diasVisita.filter(d => d !== dia));
    } else {
      setDiasVisita([...diasVisita, dia]);
    }
  };

  const toggleClienteSeleccionado = (cliente) => {
    if (clientesSeleccionados.some(c => c.id === cliente.id)) {
      setClientesSeleccionados(clientesSeleccionados.filter(c => c.id !== cliente.id));
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
        id: ruta.id,
        nombre,
        descripcion,
        estado,
        notas,
        dias_visita: diasVisita,
        fecha_inicio: fechaInicio.toISOString().split('T')[0],
        fecha_fin: fechaFin.toISOString().split('T')[0],
        clientes: clientesSeleccionados.map(c => c.id)
      };

      console.log('Actualizando ruta:', rutaActualizada);
      
      await api.updateRuta(ruta.id, rutaActualizada);
      
      Alert.alert('Éxito', 'Ruta actualizada correctamente', [
        { text: 'OK', onPress: () => navigation.navigate('RutasList') }
      ]);
    } catch (error) {
      console.error('Error al actualizar ruta:', error);
      Alert.alert('Error', 'No se pudo actualizar la ruta');
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
        {fechaFin.toLocaleDateString()}
      </Button>
      
      {showFinDatePicker && (
        <DateTimePicker
          value={fechaFin}
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
