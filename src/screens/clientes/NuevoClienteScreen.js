import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Text, HelperText, RadioButton, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
// eslint-disable-next-line import/no-unresolved
import * as Location from 'expo-location';
import api from '../../services/api';

const NuevoClienteScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    email: '',
    ciudad: '',
    notas: '',
    identificacion: '',
    tipo_identificacion: 'Identidad', // Por defecto
    latitud: null,
    longitud: null,
  });
  
  const [locationPermission, setLocationPermission] = useState(false);
  
  // Solicitar permisos de ubicación al cargar el componente
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
    })();
  }, []);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
    
    // Limpiar error cuando el usuario comienza a escribir
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: null,
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }
    
    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es obligatorio';
    }
    
    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email.trim())) {
      newErrors.email = 'Correo electrónico inválido';
    }
    
    // Validación para identificación según el tipo
    if (formData.identificacion.trim()) {
      if (formData.tipo_identificacion === 'RTN' && !/^\d{14}$/.test(formData.identificacion.trim())) {
        newErrors.identificacion = 'RTN debe tener 14 dígitos';
      } else if (formData.tipo_identificacion === 'Identidad' && !/^\d{13}$/.test(formData.identificacion.trim())) {
        newErrors.identificacion = 'Identidad debe tener 13 dígitos';
      }
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
      
      // Llamada real a la API para crear el cliente
      console.log('Enviando datos de cliente a la API:', formData);
      const response = await api.createCliente(formData);
      console.log('Respuesta de la API:', response);
      
      // Mostrar mensaje de éxito
      Alert.alert(
        'Cliente Guardado',
        `El cliente ${formData.nombre} ha sido guardado exitosamente`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Volver a la pantalla anterior
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      Alert.alert('Error', `No se pudo guardar el cliente: ${error.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener la ubicación actual
  const getCurrentLocation = async () => {
    try {
      if (!locationPermission) {
        Alert.alert('Permiso requerido', 'Se necesita permiso para acceder a la ubicación');
        return;
      }
      
      setLoading(true);
      const location = await Location.getCurrentPositionAsync({});
      
      setFormData({
        ...formData,
        latitud: location.coords.latitude,
        longitud: location.coords.longitude
      });
      
      Alert.alert('Ubicación capturada', `Lat: ${location.coords.latitude}, Long: ${location.coords.longitude}`);
    } catch (error) {
      console.error('Error al obtener ubicación:', error);
      Alert.alert('Error', 'No se pudo obtener la ubicación actual');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <TextInput
            label="Nombre*"
            value={formData.nombre}
            onChangeText={(text) => handleChange('nombre', text)}
            style={styles.input}
            error={!!errors.nombre}
            disabled={loading}
          />
          {errors.nombre && <HelperText type="error">{errors.nombre}</HelperText>}
          
          {/* Campos de identificación */}
          <View style={styles.identificacionContainer}>
            <Text style={styles.sectionTitle}>Identificación</Text>
            
            <View style={styles.radioGroup}>
              <View style={styles.radioButton}>
                <RadioButton
                  value="Identidad"
                  status={formData.tipo_identificacion === 'Identidad' ? 'checked' : 'unchecked'}
                  onPress={() => handleChange('tipo_identificacion', 'Identidad')}
                  disabled={loading}
                />
                <Text>Identidad</Text>
              </View>
              
              <View style={styles.radioButton}>
                <RadioButton
                  value="RTN"
                  status={formData.tipo_identificacion === 'RTN' ? 'checked' : 'unchecked'}
                  onPress={() => handleChange('tipo_identificacion', 'RTN')}
                  disabled={loading}
                />
                <Text>RTN</Text>
              </View>
              
              <View style={styles.radioButton}>
                <RadioButton
                  value="Pasaporte"
                  status={formData.tipo_identificacion === 'Pasaporte' ? 'checked' : 'unchecked'}
                  onPress={() => handleChange('tipo_identificacion', 'Pasaporte')}
                  disabled={loading}
                />
                <Text>Pasaporte</Text>
              </View>
            </View>
            
            <TextInput
              label={`Número de ${formData.tipo_identificacion}`}
              value={formData.identificacion}
              onChangeText={(text) => handleChange('identificacion', text)}
              style={styles.input}
              error={!!errors.identificacion}
              disabled={loading}
            />
            {errors.identificacion && <HelperText type="error">{errors.identificacion}</HelperText>}
          </View>
          
          <Divider style={styles.divider} />
          
          <TextInput
            label="Teléfono*"
            value={formData.telefono}
            onChangeText={(text) => handleChange('telefono', text)}
            style={styles.input}
            keyboardType="phone-pad"
            error={!!errors.telefono}
            disabled={loading}
          />
          {errors.telefono && <HelperText type="error">{errors.telefono}</HelperText>}
          
          <TextInput
            label="Dirección"
            value={formData.direccion}
            onChangeText={(text) => handleChange('direccion', text)}
            style={styles.input}
            multiline
            disabled={loading}
          />
          
          <TextInput
            label="Ciudad"
            value={formData.ciudad}
            onChangeText={(text) => handleChange('ciudad', text)}
            style={styles.input}
            disabled={loading}
          />
          
          <View style={styles.locationContainer}>
            <Text style={styles.sectionTitle}>Ubicación GPS</Text>
            <Button 
              mode="outlined" 
              onPress={getCurrentLocation} 
              style={styles.locationButton}
              icon="map-marker"
              disabled={loading || !locationPermission}
            >
              Capturar Ubicación
            </Button>
            
            {formData.latitud && formData.longitud && (
              <Text style={styles.locationText}>
                Lat: {formData.latitud.toFixed(6)}, Long: {formData.longitud.toFixed(6)}
              </Text>
            )}
          </View>
          
          <TextInput
            label="Correo Electrónico"
            value={formData.email}
            onChangeText={(text) => handleChange('email', text)}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            error={!!errors.email}
            disabled={loading}
          />
          {errors.email && <HelperText type="error">{errors.email}</HelperText>}
          
          <TextInput
            label="Notas"
            value={formData.notas}
            onChangeText={(text) => handleChange('notas', text)}
            style={styles.input}
            multiline
            numberOfLines={3}
            disabled={loading}
          />
          
          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.button}
              disabled={loading}
            >
              Cancelar
            </Button>
            
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.button}
              loading={loading}
              disabled={loading}
            >
              Guardar Cliente
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    marginBottom: 12,
    backgroundColor: 'white',
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
  },
  radioGroup: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  identificacionContainer: {
    marginBottom: 12,
  },
  divider: {
    marginVertical: 16,
  },
  locationContainer: {
    marginVertical: 12,
  },
  locationButton: {
    marginVertical: 8,
  },
  locationText: {
    marginTop: 8,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  }
});

export default NuevoClienteScreen;
