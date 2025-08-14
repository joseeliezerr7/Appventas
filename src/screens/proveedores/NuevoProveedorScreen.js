import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Divider, HelperText, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

const NuevoProveedorScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
    ciudad: '',
    estado: '',
    codigoPostal: '',
    rfc: '',
    categoria: '',
    sitioWeb: '',
    notas: ''
  });
  const [errors, setErrors] = useState({});

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
    
    if (!formData.contacto.trim()) {
      newErrors.contacto = 'El nombre de contacto es obligatorio';
    }
    
    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es obligatorio';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El formato de email es inválido';
    }
    
    if (!formData.categoria.trim()) {
      newErrors.categoria = 'La categoría es obligatoria';
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
      
      // Simular envío a API
      setTimeout(() => {
        setLoading(false);
        Alert.alert(
          'Éxito',
          'Proveedor guardado correctamente',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }, 1500);
    } catch (error) {
      console.error('Error al guardar proveedor:', error);
      setLoading(false);
      Alert.alert('Error', 'No se pudo guardar el proveedor');
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loaderText}>Guardando proveedor...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Nuevo Proveedor</Text>
      
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Información General</Text>
        
        <TextInput
          label="Nombre o Razón Social *"
          value={formData.nombre}
          onChangeText={(text) => handleChange('nombre', text)}
          style={styles.input}
          error={!!errors.nombre}
        />
        {errors.nombre && <HelperText type="error">{errors.nombre}</HelperText>}
        
        <TextInput
          label="Categoría *"
          value={formData.categoria}
          onChangeText={(text) => handleChange('categoria', text)}
          style={styles.input}
          placeholder="Ej: Alimentos, Bebidas, Limpieza"
          error={!!errors.categoria}
        />
        {errors.categoria && <HelperText type="error">{errors.categoria}</HelperText>}
        
        <TextInput
          label="RFC"
          value={formData.rfc}
          onChangeText={(text) => handleChange('rfc', text)}
          style={styles.input}
        />
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Contacto</Text>
        
        <TextInput
          label="Nombre de Contacto *"
          value={formData.contacto}
          onChangeText={(text) => handleChange('contacto', text)}
          style={styles.input}
          error={!!errors.contacto}
        />
        {errors.contacto && <HelperText type="error">{errors.contacto}</HelperText>}
        
        <TextInput
          label="Teléfono *"
          value={formData.telefono}
          onChangeText={(text) => handleChange('telefono', text)}
          style={styles.input}
          keyboardType="phone-pad"
          error={!!errors.telefono}
        />
        {errors.telefono && <HelperText type="error">{errors.telefono}</HelperText>}
        
        <TextInput
          label="Email *"
          value={formData.email}
          onChangeText={(text) => handleChange('email', text)}
          style={styles.input}
          keyboardType="email-address"
          error={!!errors.email}
        />
        {errors.email && <HelperText type="error">{errors.email}</HelperText>}
        
        <TextInput
          label="Sitio Web"
          value={formData.sitioWeb}
          onChangeText={(text) => handleChange('sitioWeb', text)}
          style={styles.input}
          keyboardType="url"
        />
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Dirección</Text>
        
        <TextInput
          label="Dirección"
          value={formData.direccion}
          onChangeText={(text) => handleChange('direccion', text)}
          style={styles.input}
        />
        
        <View style={styles.row}>
          <TextInput
            label="Ciudad"
            value={formData.ciudad}
            onChangeText={(text) => handleChange('ciudad', text)}
            style={[styles.input, styles.halfInput]}
          />
          
          <TextInput
            label="Estado"
            value={formData.estado}
            onChangeText={(text) => handleChange('estado', text)}
            style={[styles.input, styles.halfInput]}
          />
        </View>
        
        <TextInput
          label="Código Postal"
          value={formData.codigoPostal}
          onChangeText={(text) => handleChange('codigoPostal', text)}
          style={styles.input}
          keyboardType="numeric"
        />
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
          Guardar Proveedor
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
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#0066cc',
  },
  input: {
    marginBottom: 10,
    backgroundColor: 'white',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  divider: {
    marginVertical: 15,
  },
  buttonContainer: {
    marginVertical: 20,
  },
  submitButton: {
    marginBottom: 10,
    paddingVertical: 6,
  },
  cancelButton: {
    paddingVertical: 6,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loaderText: {
    marginTop: 10,
  },
});

export default NuevoProveedorScreen;
