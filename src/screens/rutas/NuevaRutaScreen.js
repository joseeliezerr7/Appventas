import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Text, TextInput, Button, Divider, HelperText, ActivityIndicator, Checkbox } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../services/api';

const NuevaRutaScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    vendedor: '',
    diasVisita: {
      lunes: false,
      martes: false,
      miercoles: false,
      jueves: false,
      viernes: false,
      sabado: false,
      domingo: false
    },
    fechaInicio: new Date(),
    fechaFin: null,
    notas: ''
  });
  
  // Estados para controlar la visibilidad de los selectores de fecha
  const [showFechaInicio, setShowFechaInicio] = useState(false);
  const [showFechaFin, setShowFechaFin] = useState(false);
  const [errors, setErrors] = useState({});
  const [clientesSeleccionados, setClientesSeleccionados] = useState([]);

  const [clientes, setClientes] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [clienteSearch, setClienteSearch] = useState('');
  
  // Cargar clientes desde la API
  useEffect(() => {
    const cargarClientes = async () => {
      setLoadingClientes(true);
      try {
        const data = await api.getClientes();
        console.log('Clientes cargados:', data.length);
        
        // Formatear los datos para la vista
        const clientesFormateados = data.map(cliente => ({
          id: cliente.id,
          nombre: cliente.nombre,
          direccion: cliente.direccion || 'Sin dirección',
          seleccionado: false
        }));
        
        setClientes(clientesFormateados);
      } catch (error) {
        console.error('Error al cargar clientes:', error);
        // Si hay un error, mostrar algunos clientes de ejemplo
        const clientesEjemplo = [
          { id: 1, nombre: 'Tienda A (ejemplo)', direccion: 'Calle Principal 123', seleccionado: false },
          { id: 2, nombre: 'Tienda B (ejemplo)', direccion: 'Av. Central 456', seleccionado: false },
        ];
        setClientes(clientesEjemplo);
        Alert.alert('Error', 'No se pudieron cargar los clientes. Mostrando datos de ejemplo.');
      } finally {
        setLoadingClientes(false);
      }
    };
    
    // Cargar vendedores (usuarios con rol "vendedor") desde la API
    const cargarVendedores = async () => {
      try {
        console.log('Cargando usuarios con rol vendedor...');
        const usuarios = await api.getUsuarios();
        
        // Filtrar solo los usuarios con rol "vendedor" y que estén activos
        const vendedoresActivos = usuarios.filter(usuario => 
          usuario.rol === 'vendedor' && usuario.activo === 1
        );
        
        // Formatear los datos para la vista
        const vendedoresFormateados = vendedoresActivos.map(vendedor => ({
          id: vendedor.id,
          nombre: vendedor.nombre
        }));
        
        console.log(`Vendedores encontrados: ${vendedoresFormateados.length}`);
        setVendedores(vendedoresFormateados);
      } catch (error) {
        console.error('Error al cargar vendedores:', error);
        // Si hay un error, mostrar algunos vendedores de ejemplo
        const vendedoresEjemplo = [
          { id: 1, nombre: 'Juan Pérez (ejemplo)' },
          { id: 2, nombre: 'María López (ejemplo)' },
          { id: 3, nombre: 'Carlos Gómez (ejemplo)' }
        ];
        setVendedores(vendedoresEjemplo);
        Alert.alert('Error', 'No se pudieron cargar los vendedores. Mostrando datos de ejemplo.');
      }
    };
    
    cargarClientes();
    cargarVendedores();
  }, []);

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
    
    // Limpiar error cuando el usuario edita el campo
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: null
      });
    }
  };

  const handleDiaChange = (dia) => {
    setFormData({
      ...formData,
      diasVisita: {
        ...formData.diasVisita,
        [dia]: !formData.diasVisita[dia]
      }
    });
  };
  
  // Manejadores para las fechas
  const handleFechaInicioChange = (event, selectedDate) => {
    setShowFechaInicio(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData({
        ...formData,
        fechaInicio: selectedDate
      });
    }
  };
  
  const handleFechaFinChange = (event, selectedDate) => {
    setShowFechaFin(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData({
        ...formData,
        fechaFin: selectedDate
      });
    }
  };
  
  // Formatear fecha para mostrar
  const formatDate = (date) => {
    if (!date) return 'No seleccionada';
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const toggleClienteSeleccion = (id) => {
    const nuevosClientes = clientes.map(cliente => 
      cliente.id === id ? { ...cliente, seleccionado: !cliente.seleccionado } : cliente
    );
    setClientes(nuevosClientes);
    
    const seleccionados = nuevosClientes.filter(cliente => cliente.seleccionado).map(cliente => cliente.id);
    setClientesSeleccionados(seleccionados);
  };

  // Función para filtrar clientes
  const filteredClientes = clienteSearch === '' 
    ? clientes
    : clientes.filter(c => 
        c.nombre.toLowerCase().includes(clienteSearch.toLowerCase()) || 
        c.telefono?.includes(clienteSearch) ||
        c.direccion?.toLowerCase().includes(clienteSearch.toLowerCase()) ||
        c.email?.toLowerCase().includes(clienteSearch.toLowerCase())
      );

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre de la ruta es obligatorio';
    }
    
    if (!formData.vendedor.trim()) {
      newErrors.vendedor = 'Debe seleccionar un vendedor';
    }
    
    if (clientesSeleccionados.length === 0) {
      newErrors.clientes = 'Debe seleccionar al menos un cliente para la ruta';
    }
    
    const alMenosUnDia = Object.values(formData.diasVisita).some(dia => dia);
    if (!alMenosUnDia) {
      newErrors.diasVisita = 'Debe seleccionar al menos un día de visita';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Obtener los días seleccionados como array
      const diasVisitaArray = Object.entries(formData.diasVisita)
        .filter(([_, seleccionado]) => seleccionado)
        .map(([dia]) => dia);
      
      // Preparar datos para enviar a la API
      const rutaData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        usuario_id: parseInt(formData.vendedor), // Cambiar vendedor_id por usuario_id
        dias_visita: diasVisitaArray,
        fecha_inicio: formData.fechaInicio.toISOString().split('T')[0], // Usar la fecha seleccionada
        fecha_fin: formData.fechaFin ? formData.fechaFin.toISOString().split('T')[0] : null, // Fecha fin si está seleccionada
        estado: 'activa',
        notas: formData.notas,
        clientes: clientes.filter(c => c.seleccionado).map(c => ({
          id: c.id,
          nombre: c.nombre
        }))
      };
      
      console.log('Enviando datos de ruta:', rutaData);
      
      // Enviar datos a la API
      const response = await api.createRuta(rutaData);
      console.log('Respuesta de creación de ruta:', response);
      
      setLoading(false);
      Alert.alert(
        'Éxito',
        'Ruta creada correctamente',
        [{ 
          text: 'OK', 
          onPress: () => {
            // Navegar de vuelta con parámetro para indicar que se debe refrescar
            navigation.navigate('RutasList', { refresh: true, newRutaId: response.id });
          }
        }]
      );
    } catch (error) {
      console.error('Error al crear ruta:', error);
      setLoading(false);
      Alert.alert('Error', 'No se pudo crear la ruta: ' + (error.message || 'Error desconocido'));
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loaderText}>Creando ruta...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Nueva Ruta</Text>
      
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Información General</Text>
        
        {/* Selector de Fecha de Inicio */}
        <Text style={styles.inputLabel}>Fecha de inicio *</Text>
        <Button 
          mode="outlined" 
          onPress={() => setShowFechaInicio(true)} 
          style={styles.dateButton}
        >
          {formatDate(formData.fechaInicio)}
        </Button>
        {showFechaInicio && (
          <DateTimePicker
            value={formData.fechaInicio}
            mode="date"
            display="default"
            onChange={handleFechaInicioChange}
          />
        )}
        
        {/* Selector de Fecha de Fin */}
        <Text style={styles.inputLabel}>Fecha de fin (opcional)</Text>
        <Button 
          mode="outlined" 
          onPress={() => setShowFechaFin(true)} 
          style={styles.dateButton}
        >
          {formData.fechaFin ? formatDate(formData.fechaFin) : 'Seleccionar fecha'}
        </Button>
        {showFechaFin && (
          <DateTimePicker
            value={formData.fechaFin || new Date()}
            mode="date"
            display="default"
            onChange={handleFechaFinChange}
          />
        )}
        
        <TextInput
          label="Nombre de la ruta *"
          value={formData.nombre}
          onChangeText={(text) => handleChange('nombre', text)}
          style={styles.input}
          placeholder="Ingrese el nombre de la ruta"
          autoCapitalize="words"
          error={!!errors.nombre}
        />
        {errors.nombre && <HelperText type="error">{errors.nombre}</HelperText>}
        
        <Text style={styles.inputLabel}>Vendedor asignado *</Text>
        <View style={styles.pickerContainer}>
          {vendedores.length > 0 ? (
            <View style={styles.picker}>
              {vendedores.map((vendedor) => (
                <Button 
                  key={vendedor.id}
                  mode={formData.vendedor === vendedor.id.toString() ? 'contained' : 'outlined'}
                  onPress={() => handleChange('vendedor', vendedor.id.toString())}
                  style={styles.vendedorButton}
                >
                  {vendedor.nombre}
                </Button>
              ))}
            </View>
          ) : (
            <Text style={styles.noDataText}>No hay vendedores disponibles</Text>
          )}
        </View>
        {errors.vendedor && <HelperText type="error">{errors.vendedor}</HelperText>}
        
        <TextInput
          label="Descripción"
          value={formData.descripcion}
          onChangeText={(text) => handleChange('descripcion', text)}
          style={styles.input}
          multiline
          numberOfLines={3}
        />
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Días de Visita</Text>
        
        {errors.diasVisita && <HelperText type="error">{errors.diasVisita}</HelperText>}
        
        <View style={styles.diasContainer}>
          <View style={styles.diaItem}>
            <Checkbox
              status={formData.diasVisita.lunes ? 'checked' : 'unchecked'}
              onPress={() => handleDiaChange('lunes')}
            />
            <Text>Lunes</Text>
          </View>
          
          <View style={styles.diaItem}>
            <Checkbox
              status={formData.diasVisita.martes ? 'checked' : 'unchecked'}
              onPress={() => handleDiaChange('martes')}
            />
            <Text>Martes</Text>
          </View>
          
          <View style={styles.diaItem}>
            <Checkbox
              status={formData.diasVisita.miercoles ? 'checked' : 'unchecked'}
              onPress={() => handleDiaChange('miercoles')}
            />
            <Text>Miércoles</Text>
          </View>
          
          <View style={styles.diaItem}>
            <Checkbox
              status={formData.diasVisita.jueves ? 'checked' : 'unchecked'}
              onPress={() => handleDiaChange('jueves')}
            />
            <Text>Jueves</Text>
          </View>
          
          <View style={styles.diaItem}>
            <Checkbox
              status={formData.diasVisita.viernes ? 'checked' : 'unchecked'}
              onPress={() => handleDiaChange('viernes')}
            />
            <Text>Viernes</Text>
          </View>
          
          <View style={styles.diaItem}>
            <Checkbox
              status={formData.diasVisita.sabado ? 'checked' : 'unchecked'}
              onPress={() => handleDiaChange('sabado')}
            />
            <Text>Sábado</Text>
          </View>
          
          <View style={styles.diaItem}>
            <Checkbox
              status={formData.diasVisita.domingo ? 'checked' : 'unchecked'}
              onPress={() => handleDiaChange('domingo')}
            />
            <Text>Domingo</Text>
          </View>
        </View>
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Clientes en la Ruta</Text>
        
        {errors.clientes && <HelperText type="error">{errors.clientes}</HelperText>}
        
        <Text style={styles.clientesLabel}>
          Seleccione los clientes que formarán parte de esta ruta:
        </Text>
        
        <TextInput
          label="Buscar cliente por nombre, teléfono, email o dirección"
          value={clienteSearch}
          onChangeText={setClienteSearch}
          right={<TextInput.Icon icon="magnify" />}
          style={styles.searchInput}
          placeholder="Escribe para buscar..."
        />
        
        {loadingClientes ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#0066cc" />
            <Text style={styles.loadingText}>Cargando clientes...</Text>
          </View>
        ) : filteredClientes.length > 0 ? (
          filteredClientes.map(cliente => (
            <View key={cliente.id} style={styles.clienteItem}>
              <Checkbox
                status={cliente.seleccionado ? 'checked' : 'unchecked'}
                onPress={() => toggleClienteSeleccion(cliente.id)}
              />
              <View style={styles.clienteInfo}>
                <Text style={styles.clienteNombre}>{cliente.nombre}</Text>
                <View style={styles.clienteDetalles}>
                  {cliente.direccion && (
                    <Text style={styles.clienteDetalle}>📍 {cliente.direccion}</Text>
                  )}
                  {cliente.telefono && (
                    <Text style={styles.clienteDetalle}>📞 {cliente.telefono}</Text>
                  )}
                  {cliente.email && (
                    <Text style={styles.clienteDetalle}>✉️ {cliente.email}</Text>
                  )}
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>
            {clienteSearch === '' 
              ? 'No hay clientes disponibles'
              : `No se encontraron clientes con "${clienteSearch}"`
            }
          </Text>
        )}
        
        <View style={styles.clientesContadores}>
          <Text style={styles.clientesInfo}>
            Mostrando: {filteredClientes.length} de {clientes.length} clientes
          </Text>
          <Text style={styles.clientesSeleccionados}>
            Seleccionados: {clientesSeleccionados.length}
          </Text>
        </View>
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Información Adicional</Text>
        
        <TextInput
          label="Notas"
          value={formData.notas}
          onChangeText={(text) => handleChange('notas', text)}
          style={styles.input}
          multiline
          numberOfLines={3}
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
        >
          Crear Ruta
        </Button>
        
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
        >
          Cancelar
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  formSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#444',
  },
  input: {
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
  },
  dateButton: {
    marginBottom: 15,
    backgroundColor: '#f5f5f5',
  },
  pickerContainer: {
    marginBottom: 15,
  },
  picker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 5,
  },
  vendedorButton: {
    margin: 5,
  },
  divider: {
    marginVertical: 15,
  },
  diasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  diaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '33%',
    marginBottom: 10,
  },
  clientesLabel: {
    marginBottom: 10,
    fontSize: 16,
    color: '#555',
  },
  searchInput: {
    marginBottom: 16,
  },
  clienteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 8,
    elevation: 1,
  },
  clienteInfo: {
    marginLeft: 10,
    flex: 1,
  },
  clienteNombre: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  clienteDireccion: {
    fontSize: 14,
    color: '#666',
  },
  clienteDetalles: {
    flexDirection: 'column',
    marginTop: 4,
  },
  clienteDetalle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  clientesContadores: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  clientesInfo: {
    fontSize: 14,
    color: '#666',
  },
  clientesSeleccionados: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  notasInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 30,
  },
  button: {
    marginBottom: 10,
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#0066cc',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#0066cc',
  },
  noDataText: {
    padding: 15,
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
  }
});

export default NuevaRutaScreen;
