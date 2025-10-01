import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, HelperText, ActivityIndicator, Checkbox } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../../services/api';

const EditarUsuarioScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Obtener los datos del usuario de forma segura
  const usuario = route.params?.usuario || {};
  
  // Declarar todos los estados al principio para evitar errores de lint
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    nombre: usuario.nombre || '',
    email: usuario.email || '',
    password: '',
    confirmPassword: '',
    rol: usuario.rol || 'vendedor',
    activo: usuario.activo !== undefined ? usuario.activo : true
  });
  
  // Efecto para mostrar alerta si no hay datos
  useEffect(() => {
    console.log('Datos recibidos en EditarUsuarioScreen:', route.params);
    
    if (!route.params || !route.params.usuario) {
      console.error('No se recibieron datos del usuario');
      Alert.alert(
        'Error',
        'No se recibieron datos del usuario para editar',
        [{ text: 'Volver', onPress: () => navigation.goBack() }]
      );
    } else {
      console.log('Datos del usuario a editar:', usuario);
    }
  }, [route.params, usuario, navigation]);

  const roles = [
    { value: 'admin', label: 'Administrador' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'gerente', label: 'Gerente' },
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
    
    // Solo validar contraseña si se está cambiando
    if (formData.password) {
      if (formData.password.length < 6) {
        newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
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
      
      // Preparar datos para enviar a la API
      const userData = {
        nombre: formData.nombre,
        email: formData.email,
        rol: formData.rol,
        activo: formData.activo
      };
      
      // Solo incluir la contraseña si se ha cambiado
      if (formData.password) {
        userData.password = formData.password;
      }
      
      console.log('Actualizando datos de usuario:', userData);
      
      // Llamar a la API para actualizar el usuario
      await api.updateUsuario(usuario.id, userData);
      
      setLoading(false);
      Alert.alert(
        'Éxito',
        'Usuario actualizado correctamente',
        [{ text: 'OK', onPress: () => navigation.navigate('UsuariosList', { reload: true }) }]
      );
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      setLoading(false);
      Alert.alert('Error', 'No se pudo actualizar el usuario: ' + (error.message || 'Error desconocido'));
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Editar Usuario</Text>
        
        <View style={styles.formGroup}>
          <TextInput
            label="Nombre completo"
            value={formData.nombre}
            onChangeText={(text) => handleChange('nombre', text)}
            style={styles.input}
            error={!!errors.nombre}
            disabled={loading}
          />
          {errors.nombre && <HelperText type="error">{errors.nombre}</HelperText>}
        </View>
        
        <View style={styles.formGroup}>
          <TextInput
            label="Correo electrónico"
            value={formData.email}
            onChangeText={(text) => handleChange('email', text)}
            keyboardType="email-address"
            style={styles.input}
            error={!!errors.email}
            disabled={loading}
          />
          {errors.email && <HelperText type="error">{errors.email}</HelperText>}
        </View>
        
        <View style={styles.formGroup}>
          <TextInput
            label="Contraseña (dejar en blanco para no cambiar)"
            value={formData.password}
            onChangeText={(text) => handleChange('password', text)}
            secureTextEntry
            style={styles.input}
            error={!!errors.password}
            disabled={loading}
          />
          {errors.password && <HelperText type="error">{errors.password}</HelperText>}
        </View>
        
        <View style={styles.formGroup}>
          <TextInput
            label="Confirmar contraseña"
            value={formData.confirmPassword}
            onChangeText={(text) => handleChange('confirmPassword', text)}
            secureTextEntry
            style={styles.input}
            error={!!errors.confirmPassword}
            disabled={loading}
          />
          {errors.confirmPassword && <HelperText type="error">{errors.confirmPassword}</HelperText>}
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Rol</Text>
          {roles.map((rol) => (
            <View key={rol.value} style={styles.radioItem}>
              <Checkbox
                status={formData.rol === rol.value ? 'checked' : 'unchecked'}
                onPress={() => handleChange('rol', rol.value)}
                disabled={loading}
              />
              <Text style={styles.radioLabel}>{rol.label}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.formGroup}>
          <View style={styles.checkboxContainer}>
            <Checkbox
              status={formData.activo ? 'checked' : 'unchecked'}
              onPress={() => handleChange('activo', !formData.activo)}
              disabled={loading}
            />
            <Text style={styles.checkboxLabel}>Usuario activo</Text>
          </View>
        </View>
        
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.button}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" size="small" /> : 'Guardar Cambios'}
        </Button>
        
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
          disabled={loading}
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
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  radioLabel: {
    marginLeft: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    marginLeft: 8,
  },
  button: {
    marginTop: 24,
    paddingVertical: 8,
  },
  cancelButton: {
    marginTop: 12,
  },
});

export default EditarUsuarioScreen;
