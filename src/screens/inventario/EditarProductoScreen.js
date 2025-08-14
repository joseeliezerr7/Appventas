import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity, ActivityIndicator, FlatList, Image } from 'react-native';
import { TextInput, Button, HelperText, DataTable, Divider, Portal, Dialog, IconButton, Menu, List } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRoute, useNavigation } from '@react-navigation/native';
import productosApi from '../../services/productosApi';
const api = productosApi;

const EditarProductoScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { producto } = route.params;
  const [loading, setLoading] = useState(false);
  const [loadingProducto, setLoadingProducto] = useState(true);
  const [loadingUnidades, setLoadingUnidades] = useState(true);
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [categorias, setCategorias] = useState([]);
  const [showCategoriasMenu, setShowCategoriasMenu] = useState(false);
  const [showNuevaCategoriaDialog, setShowNuevaCategoriaDialog] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [unidadesProducto, setUnidadesProducto] = useState([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [unidadMenuVisible, setUnidadMenuVisible] = useState(false);
  const [selectedUnidad, setSelectedUnidad] = useState(null);
  const [unidadFormData, setUnidadFormData] = useState({
    unidad_id: '',
    factor_conversion: '1',
    precio: '',
    costo: '',
    stock: '',
    es_unidad_base: false
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

  // Cargar datos del producto y unidades de medida al iniciar
  const loadProductoData = useCallback(async () => {
    try {
      setLoadingProducto(true);
      
      // Cargar datos del producto desde la API
      const productoData = await api.getProducto(producto.id);
      console.log('Producto cargado:', productoData);
      
      // Actualizar el formulario con los datos del producto
      setFormData({
        nombre: productoData.nombre || '',
        codigo: productoData.codigo || '',
        descripcion: productoData.descripcion || '',
        categoria: productoData.categoria_id ? productoData.categoria_id.toString() : '',
        categoria_nombre: productoData.categoria_nombre || '',
        unidad_principal: productoData.unidad_principal || '',
        codigoBarras: productoData.codigo_barras || '',
        imagen: productoData.imagen || '',
        notas: productoData.notas || ''
      });
      
      console.log('Categoría del producto:', productoData.categoria_id, productoData.categoria_nombre);
      
      // Cargar unidades del producto
      if (productoData.unidades && productoData.unidades.length > 0) {
        const unidadesFormateadas = productoData.unidades.map(unidad => ({
          ...unidad,
          unidad_id: unidad.unidad_id,
          precio: (unidad.precio || 0).toString(),
          costo: (unidad.costo || 0).toString(),
          stock: (unidad.stock || 0).toString(),
          factor_conversion: (unidad.factor_conversion || 1).toString(),
          es_unidad_base: unidad.es_unidad_base === 1 || unidad.nombre === productoData.unidad_principal
        }));
        setUnidadesProducto(unidadesFormateadas);
      }
    } catch (error) {
      console.error('Error al cargar datos del producto:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del producto');
    } finally {
      setLoadingProducto(false);
    }
  }, [producto.id]);
  
  useEffect(() => {
    loadProductoData();
    loadUnidadesMedida();
    loadCategorias();
  }, [loadProductoData]);

  const loadCategorias = async () => {
    try {
      setLoadingCategorias(true);
      try {
        const response = await api.getCategorias();
        console.log('Categorias cargadas:', response);
        setCategorias(response);
      } catch (error) {
        console.error('Error al cargar categorias:', error);
        // Si el endpoint no existe, usamos categorías de ejemplo
        console.log('Usando categorías de ejemplo');
        const categoriasDummy = [
          { id: 1, nombre: 'Bebidas' },
          { id: 2, nombre: 'Alimentos' },
          { id: 3, nombre: 'Limpieza' },
          { id: 4, nombre: 'Papelería' },
          { id: 5, nombre: 'Electrónica' }
        ];
        setCategorias(categoriasDummy);
      }
    } finally {
      setLoadingCategorias(false);
    }
  };

  const handleCrearCategoria = async () => {
    try {
      if (!nuevaCategoria.trim()) {
        Alert.alert('Error', 'El nombre de la categoría es obligatorio');
        return;
      }
      
      let nuevaCategoriaObj;
      try {
        // Intentar crear la categoría en el backend
        const response = await api.createCategoria({ nombre: nuevaCategoria.trim() });
        console.log('Categoría creada en backend:', response);
        nuevaCategoriaObj = response;
      } catch (error) {
        console.error('Error al crear categoría en backend:', error);
        // Si el endpoint no existe, creamos una categoría local
        console.log('Creando categoría local');
        nuevaCategoriaObj = {
          id: categorias.length > 0 ? Math.max(...categorias.map(c => c.id)) + 1 : 1,
          nombre: nuevaCategoria.trim(),
          created_at: new Date().toISOString()
        };
        console.log('Categoría local creada:', nuevaCategoriaObj);
      }
      
      // Agregar la categoría a la lista
      setCategorias([...categorias, nuevaCategoriaObj]);
      
      // Seleccionar la nueva categoría
      handleChange('categoria', nuevaCategoriaObj.id.toString());
      
      // Limpiar el campo de texto
      setNuevaCategoria('');
      
      // Cerrar el diálogo
      setShowNuevaCategoriaDialog(false);
    } catch (error) {
      console.error('Error general al crear categoría:', error);
      Alert.alert('Error', 'No se pudo crear la categoría');
    }
  };

  const loadUnidadesMedida = async () => {
    try {
      setLoadingUnidades(true);
      const response = await api.getUnidadesMedida();
      console.log('Unidades de medida cargadas:', response);
      setUnidadesMedida(response);
    } catch (error) {
      console.error('Error al cargar unidades de medida:', error);
      Alert.alert('Error', 'No se pudieron cargar las unidades de medida');
    } finally {
      setLoadingUnidades(false);
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
    if (unidadesProducto.length === 0 || unidadFormData.es_unidad_base) {
      // Desmarcar todas las unidades como principal
      const unidadesActualizadas = unidadesProducto.map(u => ({
        ...u,
        es_unidad_base: false
      }));
      
      setUnidadesProducto([...unidadesActualizadas, { ...nuevaUnidad, es_unidad_base: true }]);
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
      es_unidad_base: false
    });
    
    setDialogVisible(false);
  };
  
  const handleRemoveUnidad = (index) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Está seguro de eliminar esta unidad?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => {
            const nuevasUnidades = [...unidadesProducto];
            nuevasUnidades.splice(index, 1);
            
            // Si la unidad eliminada era la principal y hay otras unidades,
            // establecer la primera como principal
            if (unidadesProducto[index].es_unidad_base && nuevasUnidades.length > 0) {
              const updatedUnidades = nuevasUnidades.map((unidad, i) => ({
                ...unidad,
                es_unidad_base: i === 0
              }));
              setUnidadesProducto(updatedUnidades);
              setFormData({
                ...formData,
                unidad_principal: updatedUnidades[0].abreviatura
              });
            } else if (nuevasUnidades.length === 0) {
              // Si no quedan unidades, limpiar la unidad principal
              setFormData({
                ...formData,
                unidad_principal: ''
              });
            } else {
              setUnidadesProducto(nuevasUnidades);
            }
          }
        }
      ]
    );
  };
  
  const handleSetPrincipal = (index) => {
    const nuevasUnidades = unidadesProducto.map((unidad, i) => ({
      ...unidad,
      es_unidad_base: i === index
    }));
    
    setUnidadesProducto(nuevasUnidades);
    setFormData({
      ...formData,
      unidad_principal: nuevasUnidades[index].abreviatura
    });
  };

  const pickImage = async () => {
    try {
      // Solicitar permisos para acceder a la galería
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita permiso para acceder a la galería de imágenes');
        return;
      }
      
      // Abrir el selector de imágenes
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });
      
      if (!result.canceled) {
        // Guardar la imagen en base64
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        
        // Actualizar el estado con la imagen seleccionada
        setFormData({
          ...formData,
          imagen: base64Image
        });
        
        console.log('Imagen seleccionada y convertida a base64');
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
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
      
      // Preparar datos del producto
      const productoData = {
        nombre: formData.nombre.trim(),
        codigo: formData.codigo.trim(),
        descripcion: formData.descripcion.trim(),
        categoria_id: formData.categoria ? parseInt(formData.categoria) : null,
        codigo_barras: formData.codigoBarras ? formData.codigoBarras.trim() : '',
        notas: formData.notas ? formData.notas.trim() : '',
        imagen: formData.imagen || null
      };
      
      // Encontrar y agregar la unidad principal si existe
      const unidadPrincipal = unidadesProducto.find(u => u.es_unidad_base);
      if (unidadPrincipal) {
        productoData.unidad_principal = unidadPrincipal.nombre;
      }
      
      // Eliminar campos vacíos o nulos
      Object.keys(productoData).forEach(key => {
        if (productoData[key] === null || productoData[key] === undefined || productoData[key] === '') {
          delete productoData[key];
        }
      });
      
      console.log('Actualizando producto:', JSON.stringify(productoData));
      console.log('ID del producto:', producto.id);
      
      // Actualizar el producto básico
      await api.updateProducto(producto.id, productoData);
      
      // Ahora actualizar las unidades una por una
      for (const unidad of unidadesProducto) {
        const unidadData = {
          unidad_id: parseInt(unidad.unidad_id),
          factor_conversion: parseFloat(unidad.factor_conversion),
          precio: parseFloat(unidad.precio),
          costo: parseFloat(unidad.costo),
          stock: parseInt(unidad.stock)
          // Eliminado es_unidad_base ya que no existe en la base de datos
        };
        
        console.log(`Actualizando unidad ${unidad.unidad_id} del producto ${producto.id}:`, JSON.stringify(unidadData));
        
        // Usar la API para actualizar o crear la unidad
        try {
          // Si la unidad ya existe, actualizarla
          if (unidad.id) {
            await api.updateUnidadProducto(producto.id, unidad.id, unidadData);
          } else {
            // Si es una nueva unidad, crearla
            await api.createUnidadProducto(producto.id, unidadData);
          }
        } catch (unidadError) {
          console.error(`Error al actualizar unidad ${unidad.unidad_id}:`, unidadError);
          // Continuar con las demás unidades aunque falle una
        }
      }
      
      Alert.alert(
        'Éxito',
        'Producto y unidades actualizados correctamente',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      Alert.alert('Error', 'No se pudo actualizar el producto');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditUnidad = (index) => {
    const unidad = unidadesProducto[index];
    setSelectedUnidad(index);
    setUnidadFormData({
      unidad_id: (unidad.unidad_id || '').toString(),
      factor_conversion: (unidad.factor_conversion || 1).toString(),
      precio: (unidad.precio || 0).toString(),
      costo: (unidad.costo || 0).toString(),
      stock: (unidad.stock || 0).toString(),
      es_unidad_base: unidad.es_unidad_base
    });
    setDialogVisible(true);
  };
  
  const handleUpdateUnidad = () => {
    if (selectedUnidad === null) return;
    
    // Validar el formulario de unidad
    const newErrors = {};
    
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
    
    // Actualizar la unidad en el array
    const unidadActualizada = {
      ...unidadesProducto[selectedUnidad],
      precio: parseFloat(unidadFormData.precio),
      costo: parseFloat(unidadFormData.costo),
      stock: parseInt(unidadFormData.stock),
      factor_conversion: parseFloat(unidadFormData.factor_conversion),
      es_unidad_base: unidadFormData.es_unidad_base
    };
    
    const nuevasUnidades = [...unidadesProducto];
    nuevasUnidades[selectedUnidad] = unidadActualizada;
    
    // Si se marca como principal, actualizar las demás unidades
    if (unidadFormData.es_unidad_base) {
      for (let i = 0; i < nuevasUnidades.length; i++) {
        if (i !== selectedUnidad) {
          nuevasUnidades[i].es_unidad_base = false;
        }
      }
      setFormData({
        ...formData,
        unidad_principal: unidadActualizada.abreviatura
      });
    }
    
    setUnidadesProducto(nuevasUnidades);
    setSelectedUnidad(null);
    setUnidadFormData({
      unidad_id: '',
      factor_conversion: '1',
      precio: '',
      costo: '',
      stock: '',
      es_unidad_base: false
    });
    setDialogVisible(false);
  };

  // Renderizado del formulario principal
  return (
    <ScrollView style={styles.container}>
      {(loading || loadingProducto || loadingUnidades) ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loaderText}>{loadingProducto ? 'Cargando datos del producto...' : 'Procesando...'}</Text>
        </View>
      ) : (
        <>
          <Text style={styles.title}>Editar Producto</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Código *</Text>
            <TextInput
              style={styles.input}
              value={formData.codigo}
              onChangeText={(text) => handleChange('codigo', text)}
              placeholder="Código del producto"
              error={!!errors.codigo}
            />
            {errors.codigo && <HelperText type="error">{errors.codigo}</HelperText>}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nombre *</Text>
            <TextInput
              style={styles.input}
              value={formData.nombre}
              onChangeText={(text) => handleChange('nombre', text)}
              placeholder="Nombre del producto"
              error={!!errors.nombre}
            />
            {errors.nombre && <HelperText type="error">{errors.nombre}</HelperText>}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={styles.input}
              value={formData.descripcion}
              onChangeText={(text) => handleChange('descripcion', text)}
              placeholder="Descripción del producto"
              multiline
              numberOfLines={3}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Imagen del Producto</Text>
            <View style={styles.imageContainer}>
              {formData.imagen ? (
                <Image source={{ uri: formData.imagen }} style={styles.productImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={50} color="#cccccc" />
                  <Text style={styles.placeholderText}>Sin imagen</Text>
                </View>
              )}
              <Button 
                mode="contained" 
                onPress={pickImage} 
                style={styles.imageButton}
              >
                {formData.imagen ? 'Cambiar imagen' : 'Seleccionar imagen'}
              </Button>
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Categoría *</Text>
            {loadingCategorias ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="small" color="#0066cc" />
                <Text style={styles.loaderText}>Cargando categorías...</Text>
              </View>
            ) : (
              <View style={styles.categoryContainer}>
                <TouchableOpacity 
                  style={[styles.categorySelector, !!errors.categoria && styles.inputError]} 
                  onPress={() => setShowCategoriasMenu(true)}
                >
                  <Text style={styles.categorySelectorText}>
                    {formData.categoria ? 
                      formData.categoria_nombre || categorias.find(c => c.id === parseInt(formData.categoria))?.nombre || 'Seleccionar categoría' : 
                      'Seleccionar categoría'}
                  </Text>
                  <Ionicons name="chevron-down" size={24} color="#666" />
                </TouchableOpacity>
                <IconButton
                  icon="plus"
                  size={24}
                  onPress={() => setShowNuevaCategoriaDialog(true)}
                  style={styles.addCategoryButton}
                />
              </View>
            )}
            {errors.categoria && <HelperText type="error">{errors.categoria}</HelperText>}
            
            <Menu
              visible={showCategoriasMenu}
              onDismiss={() => setShowCategoriasMenu(false)}
              anchor={{x: 0, y: 0}}
              style={styles.categoriesMenu}
            >
              <FlatList
                data={categorias}
                keyExtractor={(item) => (item.id || Math.random()).toString()}
                renderItem={({item}) => (
                  <Menu.Item
                    title={item.nombre}
                    onPress={() => {
                      handleChange('categoria', (item.id || '').toString());
                      setShowCategoriasMenu(false);
                    }}
                  />
                )}
                ListEmptyComponent={
                  <View style={styles.emptyList}>
                    <Text>No hay categorías disponibles</Text>
                  </View>
                }
                style={styles.categoriesList}
              />
            </Menu>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Código de Barras</Text>
            <TextInput
              style={styles.input}
              value={formData.codigoBarras}
              onChangeText={(text) => handleChange('codigoBarras', text)}
              placeholder="Código de barras (opcional)"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Notas</Text>
            <TextInput
              style={styles.input}
              value={formData.notas}
              onChangeText={(text) => handleChange('notas', text)}
              placeholder="Notas adicionales (opcional)"
              multiline
              numberOfLines={3}
            />
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Unidades de Medida</Text>
            <Button 
              mode="contained" 
              onPress={() => {
                setSelectedUnidad(null);
                setUnidadFormData({
                  unidad_id: '',
                  factor_conversion: '1',
                  precio: '',
                  costo: '',
                  stock: '',
                  es_unidad_base: false
                });
                setDialogVisible(true);
              }}
              style={styles.addButton}
            >
              Agregar Unidad
            </Button>
          </View>
          
          {errors.unidades && <HelperText type="error">{errors.unidades}</HelperText>}
          
          {unidadesProducto.length > 0 ? (
            <DataTable style={styles.table}>
              <DataTable.Header>
                <DataTable.Title>Unidad</DataTable.Title>
                <DataTable.Title numeric>Factor</DataTable.Title>
                <DataTable.Title numeric>Precio</DataTable.Title>
                <DataTable.Title numeric>Costo</DataTable.Title>
                <DataTable.Title numeric>Stock</DataTable.Title>
                <DataTable.Title>Principal</DataTable.Title>
                <DataTable.Title>Acciones</DataTable.Title>
              </DataTable.Header>
              
              {unidadesProducto.map((unidad, index) => (
                <DataTable.Row key={index}>
                  <DataTable.Cell>{unidad.unidad_nombre || unidad.nombre || 'Sin nombre'}</DataTable.Cell>
                  <DataTable.Cell numeric>{unidad.factor_conversion}</DataTable.Cell>
                  <DataTable.Cell numeric>L.{parseFloat(unidad.precio || 0).toFixed(2)}</DataTable.Cell>
                  <DataTable.Cell numeric>L.{parseFloat(unidad.costo || 0).toFixed(2)}</DataTable.Cell>
                  <DataTable.Cell numeric>{unidad.stock}</DataTable.Cell>
                  <DataTable.Cell>
                    {unidad.es_unidad_base ? (
                      <Ionicons name="checkmark-circle" size={24} color="green" />
                    ) : (
                      <TouchableOpacity onPress={() => handleSetPrincipal(index)}>
                        <Ionicons name="radio-button-off" size={24} color="#666" />
                      </TouchableOpacity>
                    )}
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <View style={styles.actionButtons}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => handleEditUnidad(index)}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => handleRemoveUnidad(index)}
                      />
                    </View>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          ) : (
            <Text style={styles.emptyText}>No hay unidades agregadas</Text>
          )}
          
          <View style={styles.buttonContainer}>
            <Button 
              mode="contained" 
              onPress={handleSubmit}
              style={styles.submitButton}
              loading={loading}
              disabled={loading}
            >
              Guardar Cambios
            </Button>
            <Button 
              mode="outlined" 
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
            >
              Cancelar
            </Button>
          </View>
          
          <Portal>
            <Dialog visible={showNuevaCategoriaDialog} onDismiss={() => setShowNuevaCategoriaDialog(false)}>
              <Dialog.Title>Nueva Categoría</Dialog.Title>
              <Dialog.Content>
                <TextInput
                  label="Nombre de la categoría"
                  value={nuevaCategoria}
                  onChangeText={setNuevaCategoria}
                  style={styles.dialogInput}
                />
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setShowNuevaCategoriaDialog(false)}>Cancelar</Button>
                <Button onPress={handleCrearCategoria}>Guardar</Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
          
          <Portal>
            <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
              <Dialog.Title>{selectedUnidad !== null ? 'Editar Unidad' : 'Agregar Unidad'}</Dialog.Title>
              <Dialog.Content>
                {selectedUnidad === null && (
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Unidad *</Text>
                    <View style={styles.pickerContainer}>
                      {loadingUnidades ? (
                        <ActivityIndicator size="small" color="#0066cc" />
                      ) : (
                        <>
                          <Menu
                            visible={unidadMenuVisible}
                            onDismiss={() => setUnidadMenuVisible(false)}
                            anchor={(
                              <TouchableOpacity 
                                onPress={() => setUnidadMenuVisible(true)}
                                style={styles.dropdownButton}
                              >
                                <Text style={styles.dropdownButtonText}>
                                  {unidadFormData.unidad_id 
                                    ? unidadesMedida.find(u => (u.id || '').toString() === unidadFormData.unidad_id)?.nombre || 'Seleccione una unidad' 
                                    : 'Seleccione una unidad'}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#666" />
                              </TouchableOpacity>
                            )}
                          >
                            <FlatList
                              data={unidadesMedida}
                              keyExtractor={(item) => (item.id || Math.random()).toString()}
                              style={styles.dropdownList}
                              renderItem={({item}) => (
                                <List.Item
                                  title={item.nombre}
                                  onPress={() => {
                                    handleUnidadChange('unidad_id', (item.id || '').toString());
                                    setUnidadMenuVisible(false);
                                  }}
                                />
                              )}
                            />
                          </Menu>
                          {unidadErrors.unidad_id && <HelperText type="error">{unidadErrors.unidad_id}</HelperText>}
                        </>
                      )}
                    </View>
                    {unidadErrors.unidad_id && <HelperText type="error">{unidadErrors.unidad_id}</HelperText>}
                  </View>
                )}
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Factor de Conversión *</Text>
                  <TextInput
                    style={styles.input}
                    value={unidadFormData.factor_conversion}
                    onChangeText={(text) => handleUnidadChange('factor_conversion', text)}
                    placeholder="Factor de conversión"
                    keyboardType="numeric"
                    error={!!unidadErrors.factor_conversion}
                  />
                  {unidadErrors.factor_conversion && <HelperText type="error">{unidadErrors.factor_conversion}</HelperText>}
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Precio *</Text>
                  <TextInput
                    style={styles.input}
                    value={unidadFormData.precio}
                    onChangeText={(text) => handleUnidadChange('precio', text)}
                    placeholder="Precio de venta"
                    keyboardType="numeric"
                    error={!!unidadErrors.precio}
                  />
                  {unidadErrors.precio && <HelperText type="error">{unidadErrors.precio}</HelperText>}
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Costo *</Text>
                  <TextInput
                    style={styles.input}
                    value={unidadFormData.costo}
                    onChangeText={(text) => handleUnidadChange('costo', text)}
                    placeholder="Costo"
                    keyboardType="numeric"
                    error={!!unidadErrors.costo}
                  />
                  {unidadErrors.costo && <HelperText type="error">{unidadErrors.costo}</HelperText>}
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Stock *</Text>
                  <TextInput
                    style={styles.input}
                    value={unidadFormData.stock}
                    onChangeText={(text) => handleUnidadChange('stock', text)}
                    placeholder="Stock inicial"
                    keyboardType="numeric"
                    error={!!unidadErrors.stock}
                  />
                  {unidadErrors.stock && <HelperText type="error">{unidadErrors.stock}</HelperText>}
                </View>
                
                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => handleUnidadChange('es_unidad_base', !unidadFormData.es_unidad_base)}
                  >
                    {unidadFormData.es_unidad_base ? (
                      <Ionicons name="checkbox" size={24} color="#0066cc" />
                    ) : (
                      <Ionicons name="square-outline" size={24} color="#666" />
                    )}
                  </TouchableOpacity>
                  <Text style={styles.checkboxLabel}>Establecer como unidad principal</Text>
                </View>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setDialogVisible(false)}>Cancelar</Button>
                <Button onPress={selectedUnidad !== null ? handleUpdateUnidad : handleAddUnidad}>
                  {selectedUnidad !== null ? 'Actualizar' : 'Agregar'}
                </Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categorySelector: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#f9f9f9',
  },
  categorySelectorText: {
    fontSize: 16,
    color: '#333',
  },
  addCategoryButton: {
    marginLeft: 8,
  },
  categoriesMenu: {
    width: '80%',
    maxHeight: 300,
  },
  categoriesList: {
    maxHeight: 250,
  },
  emptyList: {
    padding: 16,
    alignItems: 'center',
  },
  dialogInput: {
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
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
  },
  divider: {
    marginVertical: 20,
    height: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    borderRadius: 4,
  },
  table: {
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  submitButton: {
    marginBottom: 12,
    borderRadius: 4,
  },
  cancelButton: {
    borderRadius: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#f9f9f9',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  checkbox: {
    marginRight: 10,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  // Estilos para el menú desplegable personalizado
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    height: 50,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownList: {
    maxHeight: 200,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  productImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  placeholderText: {
    marginTop: 10,
    color: '#999',
  },
  imageButton: {
    marginTop: 10,
    width: 200,
  },
});

export default EditarProductoScreen;
