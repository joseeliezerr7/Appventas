import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Image } from 'react-native';
import { Text, TextInput, Button, Divider, HelperText, ActivityIndicator, DataTable, IconButton, Menu, Dialog, Portal } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import productosApi from '../../services/productosApi';

const NuevoProductoScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [loadingUnidades, setLoadingUnidades] = useState(true);
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [unidadesProducto, setUnidadesProducto] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [categoriaMenuVisible, setCategoriaMenuVisible] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedUnidad, setSelectedUnidad] = useState(null);
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  const [unidadFormData, setUnidadFormData] = useState({
    unidad_id: '',
    factor_conversion: '1',
    precio: '',
    costo: '',
    stock: '',
    es_principal: false
  });
  
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    categoria: '',
    unidad_principal: '',
    codigoBarras: '',
    imagen: '',
    notas: ''
  });
  const [errors, setErrors] = useState({});
  const [unidadErrors, setUnidadErrors] = useState({});

  // Cargar unidades de medida y categorías al iniciar
  useEffect(() => {
    loadUnidadesMedida();
    loadCategorias();
  }, []);

  const loadUnidadesMedida = async () => {
    try {
      setLoadingUnidades(true);
      const response = await productosApi.getUnidadesMedida();
      console.log('Unidades de medida cargadas:', response);
      setUnidadesMedida(response);
      setLoadingUnidades(false);
    } catch (error) {
      console.error('Error al cargar unidades de medida:', error);
      setLoadingUnidades(false);
      Alert.alert('Error', 'No se pudieron cargar las unidades de medida');
    }
  };
  
  const loadCategorias = async () => {
    try {
      setLoadingCategorias(true);
      const response = await productosApi.getCategorias();
      console.log('Categorías cargadas:', response);
      setCategorias(response);
      setLoadingCategorias(false);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      setLoadingCategorias(false);
      Alert.alert('Error', 'No se pudieron cargar las categorías');
    }
  };

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
  
  const handleUnidadChange = (field, value) => {
    setUnidadFormData({
      ...unidadFormData,
      [field]: value
    });
    
    if (unidadErrors[field]) {
      setUnidadErrors({
        ...unidadErrors,
        [field]: null
      });
    }
  };
  
  const handleAddUnidad = () => {
    // Validar el formulario de unidad
    const newErrors = {};
    
    if (!unidadFormData.unidad_id) {
      newErrors.unidad_id = 'Debe seleccionar una unidad';
    }
    
    if (!unidadFormData.precio || isNaN(parseFloat(unidadFormData.precio)) || parseFloat(unidadFormData.precio) <= 0) {
      newErrors.precio = 'El precio debe ser un número mayor a 0';
    }
    
    if (!unidadFormData.costo || isNaN(parseFloat(unidadFormData.costo)) || parseFloat(unidadFormData.costo) < 0) {
      newErrors.costo = 'El costo debe ser un número mayor o igual a 0';
    }
    
    if (!unidadFormData.stock || isNaN(parseInt(unidadFormData.stock)) || parseInt(unidadFormData.stock) < 0) {
      newErrors.stock = 'El stock debe ser un número entero mayor o igual a 0';
    }
    
    if (!unidadFormData.factor_conversion || isNaN(parseFloat(unidadFormData.factor_conversion)) || parseFloat(unidadFormData.factor_conversion) <= 0) {
      newErrors.factor_conversion = 'El factor de conversión debe ser un número mayor a 0';
    }
    
    setUnidadErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return;
    }
    
    // Buscar la unidad seleccionada
    const unidadSeleccionada = unidadesMedida.find(u => u.id === parseInt(unidadFormData.unidad_id));
    
    if (!unidadSeleccionada) {
      Alert.alert('Error', 'Unidad de medida no encontrada');
      return;
    }
    
    // Verificar si la unidad ya existe en el producto
    const unidadExistente = unidadesProducto.find(u => u.unidad_id === parseInt(unidadFormData.unidad_id));
    
    if (unidadExistente) {
      Alert.alert('Error', `La unidad ${unidadSeleccionada.nombre} ya está agregada al producto`);
      return;
    }
    
    // Agregar la unidad al producto
    const nuevaUnidad = {
      ...unidadFormData,
      unidad_id: parseInt(unidadFormData.unidad_id),
      precio: parseFloat(unidadFormData.precio),
      costo: parseFloat(unidadFormData.costo),
      stock: parseInt(unidadFormData.stock),
      factor_conversion: parseFloat(unidadFormData.factor_conversion),
      nombre: unidadSeleccionada.nombre,
      abreviatura: unidadSeleccionada.abreviatura
    };
    
    // Si es la primera unidad o está marcada como principal, actualizar la unidad principal
    if (unidadesProducto.length === 0 || unidadFormData.es_principal) {
      // Desmarcar todas las unidades como principal
      const unidadesActualizadas = unidadesProducto.map(u => ({
        ...u,
        es_principal: false
      }));
      
      setUnidadesProducto([...unidadesActualizadas, { ...nuevaUnidad, es_principal: true }]);
      setFormData({
        ...formData,
        unidad_principal: unidadSeleccionada.abreviatura
      });
    } else {
      setUnidadesProducto([...unidadesProducto, nuevaUnidad]);
    }
    
    // Resetear el formulario de unidad
    setUnidadFormData({
      unidad_id: '',
      factor_conversion: '1',
      precio: '',
      costo: '',
      stock: '',
      es_principal: false
    });
    
    setDialogVisible(false);
  };
  
  const handleRemoveUnidad = (index) => {
    const unidadAEliminar = unidadesProducto[index];
    const nuevasUnidades = [...unidadesProducto];
    nuevasUnidades.splice(index, 1);
    
    // Si la unidad eliminada era la principal y quedan otras unidades, establecer la primera como principal
    if (unidadAEliminar.es_principal && nuevasUnidades.length > 0) {
      nuevasUnidades[0].es_principal = true;
      setFormData({
        ...formData,
        unidad_principal: nuevasUnidades[0].abreviatura
      });
    } else if (nuevasUnidades.length === 0) {
      // Si no quedan unidades, limpiar la unidad principal
      setFormData({
        ...formData,
        unidad_principal: ''
      });
    }
    
    setUnidadesProducto(nuevasUnidades);
  };
  
  const handleSetPrincipal = (index) => {
    const nuevasUnidades = unidadesProducto.map((unidad, i) => ({
      ...unidad,
      es_principal: i === index
    }));
    
    setUnidadesProducto(nuevasUnidades);
    setFormData({
      ...formData,
      unidad_principal: nuevasUnidades[index].abreviatura
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }
    
    if (!formData.codigo.trim()) {
      newErrors.codigo = 'El código es obligatorio';
    }
    
    if (unidadesProducto.length === 0) {
      newErrors.unidades = 'Debe agregar al menos una unidad de medida';
    }
    
    if (!selectedCategoria) {
      newErrors.categoria = 'La categoría es obligatoria';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Función para seleccionar una imagen desde la galería
  const pickImage = async () => {
    try {
      // Solicitar permisos para acceder a la galería
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita permiso para acceder a la galería de imágenes');
        return;
      }
      
      // Lanzar el selector de imágenes
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        // Guardar la imagen en base64 en el estado
        handleChange('imagen', `data:image/jpeg;base64,${selectedAsset.base64}`);
        console.log('Imagen seleccionada y convertida a base64');
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Preparar datos del producto con sus unidades
      const productoData = {
        ...formData,
        categoria_id: selectedCategoria, // Usar el ID de la categoría seleccionada
        unidades: unidadesProducto.map(unidad => ({
          unidad_id: unidad.unidad_id,
          factor_conversion: unidad.factor_conversion,
          precio: unidad.precio,
          costo: unidad.costo,
          stock: unidad.stock,
          es_principal: unidad.es_principal
        }))
      };
      
      console.log('Enviando datos de producto:', productoData);
      
      // Enviar a la API
      const response = await productosApi.createProducto(productoData);
      console.log('Respuesta de creación:', response);
      
      setLoading(false);
      Alert.alert(
        'Éxito',
        'Producto guardado correctamente',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error al guardar producto:', error);
      setLoading(false);
      Alert.alert('Error', 'No se pudo guardar el producto: ' + (error.message || 'Error desconocido'));
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loaderText}>Guardando producto...</Text>
      </View>
    );
  }
  
  if (loadingUnidades || loadingCategorias) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loaderText}>
          {loadingUnidades && loadingCategorias 
            ? 'Cargando datos...' 
            : loadingUnidades 
              ? 'Cargando unidades de medida...' 
              : 'Cargando categorías...'}
        </Text>
      </View>
    );
  }
  
  // Diálogo para agregar unidad de medida
  const renderUnidadDialog = () => (
    <Portal>
      <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
        <Dialog.Title>Agregar Unidad de Medida</Dialog.Title>
        <Dialog.Content>
          <View style={styles.dialogContent}>
            <Text style={styles.dialogLabel}>Unidad de Medida:</Text>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <TouchableOpacity 
                  style={styles.dialogMenuButton} 
                  onPress={() => setMenuVisible(true)}
                >
                  <Text>
                    {selectedUnidad ? 
                      unidadesMedida.find(u => u.id === selectedUnidad)?.nombre || 'Seleccionar unidad' : 
                      'Seleccionar unidad'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              }
            >
              {unidadesMedida.map((unidad) => (
                <Menu.Item 
                  key={unidad.id} 
                  title={`${unidad.nombre} (${unidad.abreviatura})`} 
                  onPress={() => {
                    setSelectedUnidad(unidad.id);
                    handleUnidadChange('unidad_id', unidad.id.toString());
                    setMenuVisible(false);
                  }} 
                />
              ))}
            </Menu>
            {unidadErrors.unidad_id && <HelperText type="error">{unidadErrors.unidad_id}</HelperText>}
            
            <TextInput
              label="Factor de conversión"
              value={unidadFormData.factor_conversion}
              onChangeText={(text) => handleUnidadChange('factor_conversion', text)}
              keyboardType="numeric"
              style={styles.input}
              error={!!unidadErrors.factor_conversion}
            />
            {unidadErrors.factor_conversion && <HelperText type="error">{unidadErrors.factor_conversion}</HelperText>}
            
            <TextInput
              label="Precio de venta"
              value={unidadFormData.precio}
              onChangeText={(text) => handleUnidadChange('precio', text)}
              keyboardType="numeric"
              style={styles.input}
              error={!!unidadErrors.precio}
            />
            {unidadErrors.precio && <HelperText type="error">{unidadErrors.precio}</HelperText>}
            
            <TextInput
              label="Costo"
              value={unidadFormData.costo}
              onChangeText={(text) => handleUnidadChange('costo', text)}
              keyboardType="numeric"
              style={styles.input}
              error={!!unidadErrors.costo}
            />
            {unidadErrors.costo && <HelperText type="error">{unidadErrors.costo}</HelperText>}
            
            <TextInput
              label="Stock inicial"
              value={unidadFormData.stock}
              onChangeText={(text) => handleUnidadChange('stock', text)}
              keyboardType="numeric"
              style={styles.input}
              error={!!unidadErrors.stock}
            />
            {unidadErrors.stock && <HelperText type="error">{unidadErrors.stock}</HelperText>}
            
            <View style={styles.checkboxContainer}>
              <Text>Unidad principal</Text>
              <TouchableOpacity 
                style={[styles.checkbox, unidadFormData.es_principal ? styles.checkboxChecked : {}]}
                onPress={() => handleUnidadChange('es_principal', !unidadFormData.es_principal)}
              >
                {unidadFormData.es_principal && <Ionicons name="checkmark" size={16} color="#fff" />}
              </TouchableOpacity>
            </View>
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setDialogVisible(false)}>Cancelar</Button>
          <Button onPress={handleAddUnidad}>Agregar</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  return (
    <ScrollView style={styles.container}>
      {renderUnidadDialog()}
      
      <Text style={styles.title}>Nuevo Producto</Text>
      
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Información General</Text>
        
        <TextInput
          label="Nombre del producto *"
          value={formData.nombre}
          onChangeText={(text) => handleChange('nombre', text)}
          style={styles.input}
          error={!!errors.nombre}
        />
        {errors.nombre && <HelperText type="error">{errors.nombre}</HelperText>}
        
        <TextInput
          label="Código *"
          value={formData.codigo}
          onChangeText={(text) => handleChange('codigo', text)}
          style={styles.input}
          error={!!errors.codigo}
        />
        {errors.codigo && <HelperText type="error">{errors.codigo}</HelperText>}
        
        <TextInput
          label="Código de barras"
          value={formData.codigoBarras}
          onChangeText={(text) => handleChange('codigoBarras', text)}
          style={styles.input}
        />
        
        <Text style={styles.inputLabel}>Categoría *</Text>
        <Menu
          visible={categoriaMenuVisible}
          onDismiss={() => setCategoriaMenuVisible(false)}
          anchor={
            <TouchableOpacity 
              style={[styles.menuButton, errors.categoria && styles.inputError]} 
              onPress={() => setCategoriaMenuVisible(true)}
            >
              <Text>
                {selectedCategoria ? 
                  categorias.find(c => c.id === selectedCategoria)?.nombre || 'Seleccionar categoría' : 
                  'Seleccionar categoría'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          }
        >
          {categorias.map((categoria) => (
            <Menu.Item 
              key={categoria.id} 
              title={categoria.nombre} 
              onPress={() => {
                setSelectedCategoria(categoria.id);
                handleChange('categoria', categoria.id.toString());
                setCategoriaMenuVisible(false);
              }} 
            />
          ))}
        </Menu>
        {errors.categoria && <HelperText type="error">{errors.categoria}</HelperText>}
        
        <TextInput
          label="Descripción"
          value={formData.descripcion}
          onChangeText={(text) => handleChange('descripcion', text)}
          style={styles.input}
          multiline
          numberOfLines={3}
        />
        
        <Text style={styles.inputLabel}>Imagen del producto</Text>
        <View style={styles.imageContainer}>
          {formData.imagen ? (
            <Image 
              source={{ uri: formData.imagen }} 
              style={styles.productImage} 
              resizeMode="contain"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={50} color="#ccc" />
              <Text style={styles.placeholderText}>Sin imagen</Text>
            </View>
          )}
          <Button 
            mode="outlined" 
            onPress={pickImage} 
            style={styles.imageButton}
            icon="camera"
          >
            {formData.imagen ? 'Cambiar imagen' : 'Seleccionar imagen'}
          </Button>
        </View>
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Unidades de Medida</Text>
        
        {errors.unidades && <HelperText type="error">{errors.unidades}</HelperText>}
        
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Unidad</DataTable.Title>
            <DataTable.Title numeric>Factor</DataTable.Title>
            <DataTable.Title numeric>Precio</DataTable.Title>
            <DataTable.Title numeric>Stock</DataTable.Title>
            <DataTable.Title>Principal</DataTable.Title>
            <DataTable.Title>Acciones</DataTable.Title>
          </DataTable.Header>

          {unidadesProducto.map((unidad, index) => (
            <DataTable.Row key={index}>
              <DataTable.Cell>{unidad.nombre || unidad.abreviatura}</DataTable.Cell>
              <DataTable.Cell numeric>{unidad.factor_conversion}</DataTable.Cell>
              <DataTable.Cell numeric>${parseFloat(unidad.precio).toFixed(2)}</DataTable.Cell>
              <DataTable.Cell numeric>{unidad.stock}</DataTable.Cell>
              <DataTable.Cell>
                <TouchableOpacity onPress={() => handleSetPrincipal(index)}>
                  {unidad.es_principal ? 
                    <Ionicons name="radio-button-on" size={20} color="#0066cc" /> : 
                    <Ionicons name="radio-button-off" size={20} color="#666" />}
                </TouchableOpacity>
              </DataTable.Cell>
              <DataTable.Cell>
                <IconButton
                  icon="delete"
                  size={20}
                  onPress={() => handleRemoveUnidad(index)}
                />
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
        
        <Button 
          mode="outlined" 
          onPress={() => setDialogVisible(true)} 
          style={styles.addButton}
          icon="plus"
        >
          Agregar Unidad
        </Button>
      </View>
      
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          loading={loading}
        >
          Guardar Producto
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#0066cc',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  inputLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  menuButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#B00020',
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  productImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  placeholderText: {
    marginTop: 8,
    color: '#999',
  },
  imageButton: {
    marginTop: 8,
    width: 200,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 40,
  },
  button: {
    width: '48%',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
  },
  cancelButtonText: {
    color: '#333',
  },
  addButton: {
    marginTop: 16,
    marginBottom: 8,
  },
  dialogContent: {
    paddingVertical: 8,
  },
  dialogLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  dialogMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  submitButton: {
    marginBottom: 10,
    paddingVertical: 6,
  },
});

export default NuevoProductoScreen;
