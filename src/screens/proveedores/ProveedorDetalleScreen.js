import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { Text, Card, Button, Divider, ActivityIndicator, List, Chip } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const ProveedorDetalleScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { proveedorId } = route.params || {};
  const [proveedor, setProveedor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [productosProveedor, setProductosProveedor] = useState([]);

  useEffect(() => {
    loadProveedorDetalle();
  }, [proveedorId]);

  const loadProveedorDetalle = async () => {
    try {
      setLoading(true);
      // Simular carga de datos desde API
      setTimeout(() => {
        // Datos de ejemplo para desarrollo
        const proveedorEjemplo = {
          id: proveedorId,
          nombre: 'Distribuidora ABC',
          contacto: 'Juan Rodríguez',
          telefono: '555-1234',
          email: 'contacto@abc.com',
          direccion: 'Av. Principal 123',
          ciudad: 'Ciudad de México',
          estado: 'CDMX',
          codigoPostal: '01000',
          rfc: 'ABC123456XYZ',
          categoria: 'Bebidas',
          sitioWeb: 'www.distribuidoraabc.com',
          estado: 'activo',
          ultimaCompra: '2025-06-05',
          totalCompras: 25000.50,
          fechaAlta: '2025-01-15',
          ultimaModificacion: '2025-05-20',
          notas: 'Proveedor con excelentes precios y tiempos de entrega. Ofrece descuentos por volumen.'
        };

        const productosEjemplo = [
          { id: 1, codigo: 'B001', nombre: 'Refresco Cola 2L', precio: 25.50, stock: 48 },
          { id: 2, codigo: 'B002', nombre: 'Agua Mineral 600ml', precio: 12.00, stock: 120 },
          { id: 3, codigo: 'B003', nombre: 'Jugo de Naranja 1L', precio: 18.75, stock: 35 },
          { id: 4, codigo: 'B004', nombre: 'Bebida Energética 500ml', precio: 22.50, stock: 60 },
          { id: 5, codigo: 'B005', nombre: 'Té Helado 1.5L', precio: 20.00, stock: 42 },
        ];
        
        setProveedor(proveedorEjemplo);
        setProductosProveedor(productosEjemplo);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error al cargar detalle del proveedor:', error);
      setLoading(false);
      Alert.alert('Error', 'No se pudo cargar la información del proveedor');
    }
  };

  const handleEdit = () => {
    navigation.navigate('EditarProveedor', { proveedor });
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Está seguro que desea eliminar este proveedor?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            // Aquí iría la lógica para eliminar el proveedor
            Alert.alert('Éxito', 'Proveedor eliminado correctamente');
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleToggleEstado = () => {
    const nuevoEstado = proveedor.estado === 'activo' ? 'inactivo' : 'activo';
    setProveedor({ ...proveedor, estado: nuevoEstado });
    
    Alert.alert(
      'Estado actualizado',
      `El proveedor ahora está ${nuevoEstado}`,
      [{ text: 'OK' }]
    );
  };

  const handleCall = () => {
    if (proveedor.telefono) {
      Linking.openURL(`tel:${proveedor.telefono}`);
    }
  };

  const handleEmail = () => {
    if (proveedor.email) {
      Linking.openURL(`mailto:${proveedor.email}`);
    }
  };

  const handleWebsite = () => {
    if (proveedor.sitioWeb) {
      let url = proveedor.sitioWeb;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }
      Linking.openURL(url);
    }
  };

  const handleNuevoPedido = () => {
    navigation.navigate('NuevoPedido', { proveedorId: proveedor.id });
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loaderText}>Cargando información del proveedor...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title 
          title={proveedor.nombre} 
          subtitle={`Categoría: ${proveedor.categoria}`}
          right={() => (
            <Chip 
              mode="outlined"
              style={[
                styles.estadoChip,
                proveedor.estado === 'activo' ? styles.chipActivo : styles.chipInactivo
              ]}
            >
              {proveedor.estado === 'activo' ? 'Activo' : 'Inactivo'}
            </Chip>
          )}
        />
        <Card.Content>
          <View style={styles.actionButtons}>
            <Button 
              mode="contained" 
              icon="cart" 
              onPress={handleNuevoPedido}
              style={styles.pedidoButton}
            >
              Nuevo Pedido
            </Button>
            <Button 
              mode="outlined" 
              icon={proveedor.estado === 'activo' ? "close-circle" : "check-circle"}
              onPress={handleToggleEstado}
            >
              {proveedor.estado === 'activo' ? 'Desactivar' : 'Activar'}
            </Button>
          </View>
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Información de Contacto</Text>
          
          <View style={styles.contactButtons}>
            <Button 
              mode="contained-tonal" 
              icon="phone" 
              onPress={handleCall}
              style={styles.contactButton}
            >
              Llamar
            </Button>
            <Button 
              mode="contained-tonal" 
              icon="email" 
              onPress={handleEmail}
              style={styles.contactButton}
            >
              Email
            </Button>
            <Button 
              mode="contained-tonal" 
              icon="web" 
              onPress={handleWebsite}
              style={styles.contactButton}
              disabled={!proveedor.sitioWeb}
            >
              Web
            </Button>
          </View>
          
          <List.Item
            title={proveedor.contacto}
            description="Persona de contacto"
            left={props => <List.Icon {...props} icon="account" />}
          />
          
          <List.Item
            title={proveedor.telefono}
            description="Teléfono"
            left={props => <List.Icon {...props} icon="phone" />}
          />
          
          <List.Item
            title={proveedor.email}
            description="Email"
            left={props => <List.Icon {...props} icon="email" />}
          />
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Dirección</Text>
          
          <Text style={styles.direccion}>
            {proveedor.direccion}{proveedor.direccion ? ', ' : ''}
            {proveedor.ciudad}{proveedor.ciudad ? ', ' : ''}
            {proveedor.estado}{proveedor.estado ? ' ' : ''}
            {proveedor.codigoPostal}
          </Text>
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Información Fiscal</Text>
          
          <List.Item
            title={proveedor.rfc || 'No especificado'}
            description="RFC"
            left={props => <List.Icon {...props} icon="file-document" />}
          />
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Productos ({productosProveedor.length})</Text>
          
          {productosProveedor.map(producto => (
            <List.Item
              key={producto.id}
              title={producto.nombre}
              description={`Código: ${producto.codigo} | Stock: ${producto.stock}`}
              right={() => <Text style={styles.precioText}>${producto.precio.toFixed(2)}</Text>}
              onPress={() => navigation.navigate('ProductoDetalle', { productoId: producto.id })}
              style={styles.productoItem}
            />
          ))}
          
          <Button
            mode="text"
            onPress={() => navigation.navigate('ProductosProveedor', { proveedorId: proveedor.id })}
          >
            Ver todos los productos
          </Button>
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Historial</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Última compra:</Text>
            <Text style={styles.infoValue}>{proveedor.ultimaCompra}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total compras:</Text>
            <Text style={styles.infoValue}>${proveedor.totalCompras.toFixed(2)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha de alta:</Text>
            <Text style={styles.infoValue}>{proveedor.fechaAlta}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Última modificación:</Text>
            <Text style={styles.infoValue}>{proveedor.ultimaModificacion}</Text>
          </View>
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Notas</Text>
          <Text style={styles.notesText}>{proveedor.notas || 'Sin notas'}</Text>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          icon="pencil"
          onPress={handleEdit}
          style={styles.editButton}
        >
          Editar
        </Button>
        
        <Button
          mode="outlined"
          icon="delete"
          onPress={handleDelete}
          style={styles.deleteButton}
          textColor="red"
        >
          Eliminar
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  card: {
    marginBottom: 15,
    elevation: 2,
  },
  divider: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#0066cc',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  pedidoButton: {
    flex: 1,
    marginRight: 10,
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  contactButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  direccion: {
    marginVertical: 10,
    paddingHorizontal: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#555',
  },
  infoValue: {
    color: '#333',
  },
  estadoChip: {
    marginRight: 10,
  },
  chipActivo: {
    backgroundColor: '#ccffcc',
  },
  chipInactivo: {
    backgroundColor: '#ffcccc',
  },
  productoItem: {
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  precioText: {
    fontWeight: 'bold',
    color: '#0066cc',
  },
  notesText: {
    fontStyle: 'italic',
    marginTop: 5,
    paddingHorizontal: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  editButton: {
    flex: 1,
    marginRight: 10,
  },
  deleteButton: {
    flex: 1,
    borderColor: 'red',
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

export default ProveedorDetalleScreen;
