import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, HelperText, ActivityIndicator, Checkbox } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

const NuevoUsuarioScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    rol: 'vendedor',
    activo: true
  });
  const [errors, setErrors] = useState({});

  const roles = [
    { value: 'admin', label: 'Administrador' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'vendedor', label: 'Vendedor' }
  ];

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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El correo electrónico no es válido';
    }
    
    if (!formData.password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
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
      
      // Preparar datos para enviar a la API
      const userData = {
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password,
        rol: formData.rol,
        activo: formData.activo
      };
      
      console.log('Enviando datos de usuario:', userData);
      
      // Llamar a la API para crear el usuario
      const response = await api.createUsuario(userData);
      
      console.log('Usuario creado correctamente:', response);
      
      setLoading(false);
      Alert.alert(
        'Éxito',
        'Usuario creado correctamente',
        [{ text: 'OK', onPress: () => navigation.navigate('UsuariosList', { reload: true }) }]
      );
    } catch (error) {
      console.error('Error al crear usuario:', error);
      setLoading(false);
      Alert.alert('Error', 'No se pudo crear el usuario: ' + (error.message || 'Error desconocido'));
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loaderText}>Creando usuario...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Nuevo Usuario</Text>
      
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Información Personal</Text>
        
        <TextInput
          label="Nombre completo *"
          value={formData.nombre}
          onChangeText={(text) => handleChange('nombre', text)}
          style={styles.input}
          error={!!errors.nombre}
        />
        {errors.nombre && <HelperText type="error">{errors.nombre}</HelperText>}
        
        <TextInput
          label="Correo electrónico *"
          value={formData.email}
          onChangeText={(text) => handleChange('email', text)}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          error={!!errors.email}
        />
        {errors.email && <HelperText type="error">{errors.email}</HelperText>}
      </View>
      
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Contraseña</Text>
        
        <TextInput
          label="Contraseña *"
          value={formData.password}
          onChangeText={(text) => handleChange('password', text)}
          style={styles.input}
          secureTextEntry
          error={!!errors.password}
        />
        {errors.password && <HelperText type="error">{errors.password}</HelperText>}
        
        <TextInput
          label="Confirmar contraseña *"
          value={formData.confirmPassword}
          onChangeText={(text) => handleChange('confirmPassword', text)}
          style={styles.input}
          secureTextEntry
          error={!!errors.confirmPassword}
        />
        {errors.confirmPassword && <HelperText type="error">{errors.confirmPassword}</HelperText>}
      </View>
      
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Rol y Estado</Text>
        
        <Text style={styles.inputLabel}>Rol del usuario *</Text>
        <View style={styles.rolesContainer}>
          {roles.map((rol) => (
            <Button
              key={rol.value}
              mode={formData.rol === rol.value ? 'contained' : 'outlined'}
              onPress={() => handleChange('rol', rol.value)}
              style={styles.rolButton}
            >
              {rol.label}
            </Button>
          ))}
        </View>
        
        <View style={styles.checkboxContainer}>
          <Checkbox
            status={formData.activo ? 'checked' : 'unchecked'}
            onPress={() => handleChange('activo', !formData.activo)}
          />
          <Text style={styles.checkboxLabel}>Usuario activo</Text>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <Button 
          mode="contained" 
          onPress={handleSubmit}
          style={styles.button}
        >
          Crear Usuario
        </Button>
        
        <Button 
          mode="outlined" 
          onPress={() => navigation.goBack()}
          style={styles.button}
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
  rolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  rolButton: {
    margin: 5,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 30,
  },
  button: {
    marginBottom: 10,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#0066cc',
  },
});

export default NuevoUsuarioScreen;
