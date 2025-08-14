import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Button, Card, TextInput, List, Divider, ActivityIndicator, IconButton, Modal, Portal, RadioButton } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import api from '../../services/api';

const NuevaVentaScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const clienteSeleccionado = route.params?.cliente;
  
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clienteSearch, setClienteSearch] = useState('');
  const [productoSearch, setProductoSearch] = useState('');
  const [showClientesList, setShowClientesList] = useState(false);
  const [showProductosList, setShowProductosList] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [unidadesProducto, setUnidadesProducto] = useState([]);
  const [showUnidadesModal, setShowUnidadesModal] = useState(false);
  const [selectedUnidad, setSelectedUnidad] = useState(null);
  
  const [venta, setVenta] = useState({
    cliente: clienteSeleccionado || null,
    items: [],
    fecha: new Date().toISOString(),
    total: 0,
    metodo_pago: 'Efectivo',
    notas: '',
  });
  
  const [showFacturaModal, setShowFacturaModal] = useState(false);
  const [facturaData, setFacturaData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('Cargando clientes y productos...');
        
        // Cargar clientes
        const clientesData = await api.getClientes();
        setClientes(clientesData);
        
        // Cargar productos
        const productosData = await api.getProductos();
        console.log('Estructura de productos:', JSON.stringify(productosData[0]));
        setProductos(productosData);
        
        console.log(`Clientes cargados: ${clientesData.length}`);
        console.log(`Productos cargados: ${productosData.length}`);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        Alert.alert('Error', 'No se pudieron cargar los datos necesarios');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const filteredClientes = clienteSearch === '' 
    ? clientes 
    : clientes.filter(c => 
        c.nombre.toLowerCase().includes(clienteSearch.toLowerCase()) || 
        c.telefono.includes(clienteSearch)
      );

  const filteredProductos = productoSearch === '' 
    ? productos 
    : productos.filter(p => 
        p.nombre.toLowerCase().includes(productoSearch.toLowerCase()) ||
        p.id.toString().includes(productoSearch)
      );

  const handleSelectCliente = (cliente) => {
    setVenta({ ...venta, cliente });
    setShowClientesList(false);
    setClienteSearch('');
  };

  const cargarUnidadesProducto = async (producto) => {
    try {
      setLoading(true);
      console.log(`Cargando unidades para producto ID: ${producto.id}`);
      console.log('Estructura completa del producto:', JSON.stringify(producto));
      
      // Valores predeterminados para precios y stock
      // Estos valores se usarán si no se pueden obtener datos reales
      let precioBase = 25; // Precio base predeterminado (en Lempiras)
      let stockBase = 100; // Stock base predeterminado
      
      // Intentar obtener unidades del producto desde la API
      try {
        const unidadesReales = await api.getProductoUnidades(producto.id);
        console.log('Unidades reales obtenidas de API:', unidadesReales);
        
        if (unidadesReales && Array.isArray(unidadesReales) && unidadesReales.length > 0) {
          console.log('Usando unidades reales de la API');
          
          // Asegurarse de que todas las unidades tengan los campos necesarios
          const unidadesFormateadas = unidadesReales.map(unidad => ({
            ...unidad,
            id: unidad.id || unidad.unidad_id || 1,
            nombre: unidad.nombre || unidad.unidad_nombre || 'Unidad',
            factor_conversion: unidad.factor_conversion || 1,
            precio_venta: unidad.precio_venta || unidad.precio || 0,
            stock: unidad.stock || 0
          }));
          
          setUnidadesProducto(unidadesFormateadas);
          setSelectedProducto(producto);
          setShowUnidadesModal(true);
          return;
        } else {
          console.log('API devolvió unidades vacías o en formato incorrecto');
        }
      } catch (apiError) {
        console.log('Error al obtener unidades de la API:', apiError.message);
      }
      
      // Si llegamos aquí, no pudimos obtener unidades de la API
      // Intentar obtener precio y stock del producto desde diferentes propiedades
      
      // Verificar diferentes estructuras posibles del objeto producto para el precio
      if (producto.precio_venta !== undefined && producto.precio_venta !== null) {
        precioBase = Number(producto.precio_venta) || precioBase;
        console.log(`Usando precio_venta: ${precioBase}`);
      } else if (producto.precio !== undefined && producto.precio !== null) {
        precioBase = Number(producto.precio) || precioBase;
        console.log(`Usando precio: ${precioBase}`);
      } else if (producto.unidades && Array.isArray(producto.unidades) && producto.unidades.length > 0) {
        // Intentar obtener precio de la primera unidad si existe
        const unidadBase = producto.unidades.find(u => u.factor_conversion === 1) || producto.unidades[0];
        if (unidadBase && unidadBase.precio_venta) {
          precioBase = Number(unidadBase.precio_venta) || precioBase;
          console.log(`Usando precio de unidad base: ${precioBase}`);
        }
      } else {
        console.log(`No se encontró precio en el producto, usando valor predeterminado: ${precioBase}`);
      }
      
      // Verificar diferentes estructuras posibles para el stock
      if (producto.stock !== undefined && producto.stock !== null) {
        stockBase = Number(producto.stock) || stockBase;
        console.log(`Usando stock directo: ${stockBase}`);
      } else if (producto.inventario !== undefined && producto.inventario !== null) {
        stockBase = Number(producto.inventario) || stockBase;
        console.log(`Usando inventario: ${stockBase}`);
      } else if (producto.unidades && Array.isArray(producto.unidades) && producto.unidades.length > 0) {
        // Intentar obtener stock de la primera unidad si existe
        const unidadBase = producto.unidades.find(u => u.factor_conversion === 1) || producto.unidades[0];
        if (unidadBase && unidadBase.stock) {
          stockBase = Number(unidadBase.stock) || stockBase;
          console.log(`Usando stock de unidad base: ${stockBase}`);
        }
      } else {
        console.log(`No se encontró stock en el producto, usando valor predeterminado: ${stockBase}`);
      }
      
      console.log(`Precio base final: ${precioBase}, Stock base final: ${stockBase}`);
      
      // Crear unidades con los datos obtenidos o valores predeterminados
      const unidades = [
        { 
          id: 1, 
          nombre: 'Unidad', 
          factor_conversion: 1, 
          precio_venta: precioBase, 
          stock: stockBase 
        },
        { 
          id: 2, 
          nombre: 'Caja', 
          factor_conversion: 12, 
          precio_venta: Math.round(precioBase * 12 * 0.9), // Redondear para evitar decimales extraños
          stock: Math.floor(stockBase / 12) 
        },
        { 
          id: 3, 
          nombre: 'Docena', 
          factor_conversion: 12, 
          precio_venta: Math.round(precioBase * 12), 
          stock: Math.floor(stockBase / 12) 
        },
      ];
      
      console.log('Unidades generadas:', JSON.stringify(unidades));
      setUnidadesProducto(unidades);
      setSelectedProducto(producto);
      setShowUnidadesModal(true);
    } catch (error) {
      console.error('Error al cargar unidades del producto:', error);
      Alert.alert('Error', 'No se pudieron cargar las unidades del producto');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProducto = (producto) => {
    // Colapsar la lista y mostrar el producto seleccionado
    setShowProductosList(false);
    setProductoSearch(producto.nombre);
    
    // Verificar si el producto ya está en la lista
    const existingItem = venta.items.find(item => item.producto.id === producto.id);
    
    if (existingItem) {
      // Incrementar cantidad si ya existe
      const updatedItems = venta.items.map(item => 
        item.producto.id === producto.id 
          ? { ...item, cantidad: item.cantidad + 1 } 
          : item
      );
      
      updateVentaWithItems(updatedItems);
      
      // Limpiar la búsqueda después de un breve delay para que el usuario vea la selección
      setTimeout(() => setProductoSearch(''), 2000);
    } else {
      // Cargar unidades del producto para selección
      cargarUnidadesProducto(producto);
    }
  };

  const handleRemoveProducto = (index) => {
    const updatedItems = [...venta.items];
    updatedItems.splice(index, 1);
    updateVentaWithItems(updatedItems);
  };

  const handleUpdateCantidad = (index, cantidad) => {
    if (cantidad <= 0) return;
    
    const updatedItems = [...venta.items];
    const item = updatedItems[index];
    
    // Verificar si hay suficiente stock
    if (item.unidad && item.unidad.stock < cantidad) {
      Alert.alert('Error', `No hay suficiente stock. Disponible: ${item.unidad.stock} ${item.unidad.nombre}`);
      return;
    }
    
    item.cantidad = cantidad;
    item.subtotal = item.precio_unitario * cantidad;
    
    updateVentaWithItems(updatedItems);
  };

  const updateVentaWithItems = (items) => {
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    setVenta({ ...venta, items, total });
  };
  
  const handleSelectUnidad = (unidad) => {
    if (!unidad) return;
    
    setSelectedUnidad(unidad);
    setShowUnidadesModal(false);
    
    if (selectedProducto) {
      const precio = unidad.precio_venta || unidad.precio || 0;
      const newItem = {
        producto: selectedProducto,
        cantidad: 1,
        precio_unitario: precio,
        subtotal: precio,
        unidad: unidad,
        factor_conversion: unidad.factor_conversion || 1
      };
      
      const updatedItems = [...venta.items, newItem];
      updateVentaWithItems(updatedItems);
      
      // Limpiar la búsqueda de productos después de agregar
      setTimeout(() => setProductoSearch(''), 1000);
    }
  };
  
  // Función para formatear moneda
  const formatCurrency = (value) => {
    const numValue = parseFloat(value || 0);
    return `L. ${isNaN(numValue) ? '0.00' : numValue.toFixed(2)}`;
  };
  
  // Función para generar el HTML de la factura
  const generateFacturaHTML = (data) => {
    if (!data) return '';
    
    const itemsHTML = (data.items || []).map(item => `
      <tr>
        <td>${item.producto?.nombre || 'Producto sin nombre'}</td>
        <td>${item.cantidad} ${item.unidad?.nombre || 'Unidad'}</td>
        <td>${formatCurrency(item.precio_unitario)}</td>
        <td>${formatCurrency(item.subtotal)}</td>
      </tr>
    `).join('');
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 20px; }
            .factura-container { max-width: 800px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; }
            .factura-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .factura-title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .factura-subtitle { font-size: 16px; color: #555; margin-bottom: 20px; }
            .factura-info { margin-bottom: 20px; }
            .factura-info div { margin-bottom: 5px; }
            .factura-label { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
            th { background-color: #f2f2f2; }
            .total-row { font-weight: bold; }
            .footer { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px; font-size: 12px; color: #555; }
          </style>
        </head>
        <body>
          <div class="factura-container">
            <div class="factura-header">
              <div>
                <div class="factura-title">Factura de Venta</div>
                <div class="factura-subtitle">No. ${data.venta_id}</div>
              </div>
              <div>
                <div><span class="factura-label">Fecha:</span> ${data.fecha}</div>
                <div><span class="factura-label">Hora:</span> ${data.hora}</div>
              </div>
            </div>
            
            <div class="factura-info">
              <div class="factura-label">Cliente:</div>
              <div>${data.cliente?.nombre || 'Cliente sin nombre'}</div>
              <div>${data.cliente?.telefono || ''}</div>
            </div>
            
            <div class="factura-info">
              <div class="factura-label">Vendedor:</div>
              <div>${data.vendedor || 'Administrador'}</div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio Unit.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="3">Total:</td>
                  <td>${formatCurrency(data.total)}</td>
                </tr>
              </tfoot>
            </table>
            
            <div class="factura-info">
              <div><span class="factura-label">Método de Pago:</span> ${data.metodo_pago}</div>
              ${data.notas ? `<div><span class="factura-label">Notas:</span> ${data.notas}</div>` : ''}
            </div>
            
            <div class="footer">
              <p>Gracias por su compra</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };
  
  // Función para generar y compartir el PDF
  const generatePDF = async () => {
    try {
      if (!facturaData) return;
      
      setLoading(true);
      
      // Generar el HTML de la factura
      const html = generateFacturaHTML(facturaData);
      
      // Crear el PDF
      const { uri } = await Print.printToFileAsync({ html });
      
      // Compartir el PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Error', 'La función de compartir no está disponible en este dispositivo');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      Alert.alert('Error', 'No se pudo generar el PDF: ' + error.message);
      setLoading(false);
    }
  };

  const handleGuardarVenta = async () => {
    // Validar que haya un cliente seleccionado
    if (!venta.cliente) {
      Alert.alert('Error', 'Debe seleccionar un cliente');
      return;
    }
    
    // Validar que haya productos en la venta
    if (venta.items.length === 0) {
      Alert.alert('Error', 'Debe agregar al menos un producto');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Guardando venta...');
      
      // Preparar los datos para enviar al backend
      const ventaData = {
        cliente_id: venta.cliente.id,
        usuario_id: 1, // ID del usuario autenticado (por ahora hardcodeado)
        items: venta.items.map(item => ({
          producto_id: item.producto.id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          unidad_id: item.unidad?.id || null,
          factor_conversion: item.factor_conversion || 1
        })),
        metodo_pago: venta.metodo_pago,
        notas: venta.notas
      };
      
      console.log('Datos de venta a enviar:', ventaData);
      
      // Enviar los datos al backend
      const response = await api.createVenta(ventaData);
      console.log('Respuesta del servidor:', response);
      
      if (response && response.venta_id) {
        // Crear datos para la factura
        const facturaInfo = {
          venta_id: response.venta_id,
          fecha: new Date().toLocaleDateString(),
          hora: new Date().toLocaleTimeString(),
          cliente: venta.cliente,
          items: venta.items,
          total: venta.total,
          metodo_pago: venta.metodo_pago,
          notas: venta.notas,
          vendedor: response.vendedor || 'Administrador'
        };
        
        setFacturaData(facturaInfo);
        setShowFacturaModal(true);
      } else {
        Alert.alert('Error', 'No se pudo guardar la venta. Intente nuevamente.');
      }
    } catch (error) {
      console.error('Error al guardar venta:', error);
      Alert.alert('Error', `No se pudo guardar la venta: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Portal>
        <Modal
          visible={showUnidadesModal}
          onDismiss={() => setShowUnidadesModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.modalCard}>
            <Card.Title title="Seleccionar Unidad" />
            <Card.Content>
              <Text style={styles.modalSubtitle}>Producto: {selectedProducto?.nombre}</Text>
              <Divider style={styles.divider} />
              <RadioButton.Group
                onValueChange={(value) => {
                  const unidad = unidadesProducto.find(u => u.id.toString() === value);
                  handleSelectUnidad(unidad);
                }}
                value={selectedUnidad?.id.toString() || ''}
              >
                {unidadesProducto.map((unidad) => (
                  <TouchableOpacity 
                    key={unidad.id} 
                    onPress={() => handleSelectUnidad(unidad)}
                    style={styles.unidadItem}
                  >
                    <View style={styles.unidadRow}>
                      <RadioButton value={unidad.id.toString()} />
                      <View style={styles.unidadInfo}>
                        <Text style={styles.unidadNombre}>{unidad.nombre}</Text>
                        <Text>Precio: {formatCurrency(unidad.precio_venta || unidad.precio || 0)}</Text>
                        <Text>Disponible: {unidad.stock}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </RadioButton.Group>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => setShowUnidadesModal(false)}>Cancelar</Button>
            </Card.Actions>
          </Card>
        </Modal>
      </Portal>
      
      <Card style={styles.card}>
        <Card.Title title="Datos del Cliente" />
        <Card.Content>
          {venta.cliente ? (
            <View style={styles.clienteSeleccionado}>
              <View style={styles.clienteInfo}>
                <Text style={styles.clienteNombre}>{venta.cliente?.nombre || 'Cliente sin nombre'}</Text>
                <Text style={styles.clienteTelefono}>{venta.cliente?.telefono || 'Sin teléfono'}</Text>
              </View>
              <IconButton
                icon="close"
                size={20}
                onPress={() => setVenta({ ...venta, cliente: null })}
              />
            </View>
          ) : (
            <View>
              <TextInput
                label="Buscar cliente"
                value={clienteSearch}
                onChangeText={setClienteSearch}
                onFocus={() => setShowClientesList(true)}
                right={<TextInput.Icon icon="magnify" />}
                style={styles.searchInput}
              />
              
              {showClientesList && (
                <Card style={styles.dropdownCard}>
                  {filteredClientes.length > 0 ? (
                    filteredClientes.map(cliente => (
                      <List.Item
                        key={cliente.id}
                        title={cliente.nombre}
                        description={cliente.telefono}
                        onPress={() => handleSelectCliente(cliente)}
                        style={styles.dropdownItem}
                      />
                    ))
                  ) : (
                    <Text style={styles.noResultsText}>No se encontraron clientes</Text>
                  )}
                </Card>
              )}
            </View>
          )}
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Title title="Productos" />
        <Card.Content>
          <TextInput
            label="Buscar producto"
            value={productoSearch}
            onChangeText={(text) => {
              setProductoSearch(text);
              setShowProductosList(text.length > 0 || filteredProductos.length > 0);
            }}
            onFocus={() => setShowProductosList(true)}
            right={
              <TextInput.Icon 
                icon={productoSearch ? "close" : "magnify"} 
                onPress={() => {
                  if (productoSearch) {
                    setProductoSearch('');
                    setShowProductosList(false);
                  }
                }}
              />
            }
            style={styles.searchInput}
          />
          
          {showProductosList && (
            <Card style={styles.dropdownCard}>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownHeaderText}>Productos disponibles</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setShowProductosList(false);
                    setProductoSearch('');
                  }}
                  style={styles.closeDropdownButton}
                >
                  <Text style={styles.closeDropdownText}>✕</Text>
                </TouchableOpacity>
              </View>
              {filteredProductos.length > 0 ? (
                <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled>
                  {filteredProductos.slice(0, 10).map(producto => (
                    <TouchableOpacity
                      key={producto.id}
                      onPress={() => handleAddProducto(producto)}
                      style={styles.productItem}
                    >
                      <View style={styles.productItemContent}>
                        <Text style={styles.productItemTitle}>{producto.nombre}</Text>
                        <Text style={styles.productItemDescription}>
                          {formatCurrency(producto.precio_venta || producto.precio || 0)} - Stock: {producto.stock || 0}
                        </Text>
                      </View>
                      <View style={styles.addButton}>
                        <Text style={styles.addButtonText}>+</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  {filteredProductos.length > 10 && (
                    <Text style={styles.moreResultsText}>
                      Y {filteredProductos.length - 10} productos más...
                    </Text>
                  )}
                </ScrollView>
              ) : (
                <Text style={styles.noResultsText}>No se encontraron productos</Text>
              )}
            </Card>
          )}
          
          <Divider style={styles.divider} />
          
          {venta.items.length > 0 ? (
            <View style={styles.itemsContainer}>
              {venta.items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemPrecio}>Precio: {formatCurrency(item.precio_unitario)}</Text>
                    <Text style={styles.itemUnidad}>{item.unidad?.nombre || 'Unidad'}</Text>
                    <Text style={styles.itemSubtotal}>Subtotal: {formatCurrency(item.subtotal)}</Text>
                  </View>
                  
                  <View style={styles.itemQuantity}>
                    <IconButton
                      icon="minus"
                      size={20}
                      onPress={() => handleUpdateCantidad(index, item.cantidad - 1)}
                      disabled={item.cantidad <= 1}
                    />
                    <Text style={styles.quantityText}>{item.cantidad}</Text>
                    <IconButton
                      icon="plus"
                      size={20}
                      onPress={() => handleUpdateCantidad(index, item.cantidad + 1)}
                    />
                  </View>
                  
                  <View style={styles.itemActions}>
                    <IconButton
                      icon="delete"
                      size={20}
                      color="#dc3545"
                      onPress={() => handleRemoveProducto(index)}
                    />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyItemsText}>No hay productos agregados</Text>
          )}
        </Card.Content>
      </Card>
      
      {/* Campos adicionales: Método de pago y notas */}
      <Card style={styles.card}>
        <Card.Title title="Detalles de Pago" />
        <Card.Content>
          <View style={styles.paymentDetails}>
            <Text style={styles.sectionLabel}>Método de Pago:</Text>
            <RadioButton.Group
              onValueChange={value => setVenta({...venta, metodo_pago: value})}
              value={venta.metodo_pago}
            >
              <View style={styles.radioGroup}>
                <View style={styles.radioOption}>
                  <RadioButton value="Efectivo" />
                  <Text>Efectivo</Text>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton value="Tarjeta" />
                  <Text>Tarjeta</Text>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton value="Transferencia" />
                  <Text>Transferencia</Text>
                </View>
              </View>
            </RadioButton.Group>
            
            <TextInput
              label="Notas"
              value={venta.notas}
              onChangeText={text => setVenta({...venta, notas: text})}
              multiline
              numberOfLines={2}
              style={styles.notasInput}
            />
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Total:" right={() => <Text style={styles.totalText}>{formatCurrency(venta.total)}</Text>} />
      </Card>

      <View style={styles.buttonContainer}>
        <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.actionButton}>
          Cancelar
        </Button>
        <Button 
          mode="contained" 
          onPress={handleGuardarVenta}
          style={styles.actionButton}
          disabled={loading || !venta.cliente || venta.items.length === 0}
        >
          Guardar Venta
        </Button>
      </View>
      
      {/* Modal de Factura */}
      <Portal>
        <Modal visible={showFacturaModal} onDismiss={() => setShowFacturaModal(false)} contentContainerStyle={styles.facturaModal}>
          <Card>
            <Card.Title title="Factura de Venta" subtitle={facturaData ? `No. ${facturaData.venta_id}` : ''} />
            <Card.Content>
              {facturaData && (
                <>
                  <View style={styles.facturaHeader}>
                    <View>
                      <Text style={styles.facturaLabel}>Fecha:</Text>
                      <Text>{facturaData.fecha}</Text>
                    </View>
                    <View>
                      <Text style={styles.facturaLabel}>Hora:</Text>
                      <Text>{facturaData.hora}</Text>
                    </View>
                  </View>
                  
                  <Divider style={styles.facturaDivider} />
                  
                  <View style={styles.facturaClienteInfo}>
                    <Text style={styles.facturaLabel}>Cliente:</Text>
                    <Text>{facturaData.cliente?.nombre || 'Cliente sin nombre'}</Text>
                    <Text>{facturaData.cliente?.telefono || 'Sin teléfono'}</Text>
                  </View>
                  
                  <Divider style={styles.facturaDivider} />
                  
                  <Text style={styles.facturaSubtitle}>Productos:</Text>
                  {facturaData.items.map((item, index) => (
                    <View key={index} style={styles.facturaItem}>
                      <View style={styles.facturaItemDetails}>
                        <Text style={styles.facturaItemName}>{item.producto?.nombre || 'Producto sin nombre'}</Text>
                        <Text>{item.cantidad} {item.unidad?.nombre || 'Unidad'} x {formatCurrency(item.precio_unitario)}</Text>
                      </View>
                      <Text style={styles.facturaItemTotal}>{formatCurrency(item.subtotal)}</Text>
                    </View>
                  ))}
                  
                  <Divider style={styles.facturaDivider} />
                  
                  <View style={styles.facturaTotalRow}>
                    <Text style={styles.facturaTotal}>Total:</Text>
                    <Text style={styles.facturaTotalAmount}>{formatCurrency(facturaData.total)}</Text>
                  </View>
                  
                  <View style={styles.facturaPaymentInfo}>
                    <Text style={styles.facturaLabel}>Método de Pago:</Text>
                    <Text>{facturaData.metodo_pago}</Text>
                  </View>
                  
                  <View style={styles.facturaVendedorInfo}>
                    <Text style={styles.facturaLabel}>Vendedor:</Text>
                    <Text>{facturaData.vendedor || 'Administrador'}</Text>
                  </View>
                  
                  {facturaData.notas && (
                    <View style={styles.facturaNotas}>
                      <Text style={styles.facturaLabel}>Notas:</Text>
                      <Text>{facturaData.notas}</Text>
                    </View>
                  )}
                </>
              )}
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => setShowFacturaModal(false)}>Cerrar</Button>
              <Button 
                mode="contained" 
                onPress={generatePDF}
                loading={loading}
                disabled={loading}
              >
                Generar PDF
              </Button>
            </Card.Actions>
          </Card>
        </Modal>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  paymentDetails: {
    marginVertical: 10,
  },
  radioGroup: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  notasInput: {
    marginTop: 10,
  },
  sectionLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066cc',
    paddingHorizontal: 16,
  },
  facturaModal: {
    backgroundColor: 'white',
    padding: 10,
    margin: 20,
    borderRadius: 10,
    maxHeight: '90%',
  },
  facturaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  facturaLabel: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 3,
  },
  facturaDivider: {
    marginVertical: 10,
  },
  facturaClienteInfo: {
    marginVertical: 10,
  },
  facturaSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  facturaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  facturaItemDetails: {
    flex: 3,
  },
  facturaItemName: {
    fontWeight: 'bold',
  },
  facturaItemTotal: {
    flex: 1,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  facturaTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  facturaTotal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  facturaTotalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  facturaPaymentInfo: {
    marginVertical: 10,
  },
  facturaNotas: {
    marginTop: 10,
  },
  facturaVendedorInfo: {
    marginTop: 10,
  },
  modalContainer: {
    padding: 20,
    margin: 20,
  },
  modalCard: {
    padding: 10,
    borderRadius: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  unidadItem: {
    marginVertical: 5,
  },
  unidadRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unidadInfo: {
    marginLeft: 10,
  },
  unidadNombre: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  searchInput: {
    backgroundColor: 'white',
    marginBottom: 8,
  },
  dropdownCard: {
    marginBottom: 8,
    maxHeight: 300,
    borderRadius: 8,
    elevation: 4,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f9fa',
  },
  dropdownHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  closeDropdownButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#dc3545',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeDropdownText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dropdownScrollView: {
    maxHeight: 240,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productItemContent: {
    flex: 1,
  },
  productItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productItemDescription: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#28a745',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  addButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  moreResultsText: {
    textAlign: 'center',
    padding: 12,
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },
  dropdownItem: {
    paddingVertical: 4,
  },
  noResultsText: {
    textAlign: 'center',
    padding: 16,
    color: '#666',
  },
  clienteSeleccionado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  clienteInfo: {
    flex: 1,
  },
  clienteNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  clienteTelefono: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    marginVertical: 16,
  },
  itemsContainer: {
    marginTop: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemInfo: {
    flex: 2,
  },
  itemPrecio: {
    fontSize: 14,
    color: '#555',
  },
  itemUnidad: {
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemQuantity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemActions: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  subtotalText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
    marginRight: 8,
  },
  emptyItemsText: {
    textAlign: 'center',
    padding: 16,
    color: '#666',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28a745',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default NuevaVentaScreen;
