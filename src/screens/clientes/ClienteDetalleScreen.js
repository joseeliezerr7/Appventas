import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Text, Card, Button, IconButton, Divider, List, Dialog, Portal, TextInput } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
// Eliminamos la importación no utilizada de Ionicons
import api from '../../services/api';

const ClienteDetalleScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { cliente } = route.params;
  
  const [ventasCliente, setVentasCliente] = useState([]);
  // Usamos loading en loadVentasCliente
  const [loading, setLoading] = useState(true);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [editedCliente, setEditedCliente] = useState({ ...cliente });

  // Definir handleDelete primero
  const handleDelete = useCallback(async () => {
    try {
      // Llamada real a la API para eliminar el cliente
      console.log(`Eliminando cliente ID: ${cliente.id}`);
      await api.deleteCliente(cliente.id);
      
      Alert.alert(
        'Cliente Eliminado',
        `El cliente ${cliente.nombre} ha sido eliminado exitosamente`,
        [
          { 
            text: 'OK', 
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      Alert.alert('Error', `No se pudo eliminar el cliente: ${error.message || 'Error desconocido'}`);
    }
  }, [cliente.id, cliente.nombre, navigation]);

  // Usar useCallback para evitar recrear la función en cada renderizado
  const handleDeleteConfirmation = useCallback(() => {
    Alert.alert(
      'Eliminar Cliente',
      `¿Estás seguro de que deseas eliminar a ${cliente.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: handleDelete }
      ]
    );
  }, [cliente.nombre, handleDelete]);

  // Usar useCallback para loadVentasCliente para evitar recreaciones innecesarias
  const loadVentasCliente = useCallback(async () => {
    try {
      setLoading(true);
      
      try {
        // Intentar obtener las ventas del cliente desde la API
        const ventasData = await api.getClienteVentas(cliente.id);
        console.log(`Ventas cargadas para cliente ${cliente.id}:`, ventasData);
        
        // Formatear los datos si es necesario
        const ventasFormateadas = ventasData.map(venta => ({
          id: venta.id,
          fecha: venta.fecha_formateada || new Date(venta.fecha).toLocaleDateString('es-ES'),
          total: venta.total
        }));
        
        setVentasCliente(ventasFormateadas);
      } catch (apiError) {
        console.error('Error al obtener ventas de la API:', apiError);
        
        // Si el endpoint no está disponible (404), usar datos de ejemplo temporalmente
        if (apiError.message.includes('Cannot GET') || apiError.message.includes('404')) {
          console.log('Usando datos de ejemplo temporalmente hasta que el endpoint esté disponible');
          
          // Datos de ejemplo para mostrar mientras tanto
          const ventasEjemplo = [
            { id: 1, fecha: '11/06/2025', total: 1250.00 },
            { id: 2, fecha: '05/06/2025', total: 780.50 },
            { id: 3, fecha: '28/05/2025', total: 1500.75 },
          ];
          
          setVentasCliente(ventasEjemplo);
        } else {
          // Para otros errores, mostrar mensaje
          Alert.alert('Error', 'No se pudieron cargar las ventas del cliente');
          setVentasCliente([]);
        }
      }
    } catch (error) {
      console.error('Error general al cargar ventas del cliente:', error);
      setVentasCliente([]);
    } finally {
      setLoading(false);
    }
  }, [cliente.id]);
  
  useEffect(() => {
    loadVentasCliente();
    
    navigation.setOptions({
      title: cliente.nombre,
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <IconButton
            icon="pencil"
            size={24}
            color="#007bff"
            onPress={() => setEditDialogVisible(true)}
          />
          <IconButton
            icon="delete"
            size={24}
            color="#dc3545"
            onPress={handleDeleteConfirmation}
          />
        </View>
      ),
    });
  }, [navigation, cliente, handleDeleteConfirmation, loadVentasCliente]);

  // Tanto handleDelete como handleDeleteConfirmation se movieron arriba usando useCallback

  const handleEditCliente = async () => {
    try {
      // Validar campos
      if (!editedCliente.nombre.trim()) {
        Alert.alert('Error', 'El nombre es obligatorio');
        return;
      }
      
      if (!editedCliente.telefono.trim()) {
        Alert.alert('Error', 'El teléfono es obligatorio');
        return;
      }
      
      // Llamada real a la API para actualizar el cliente
      console.log('Enviando datos actualizados a la API:', editedCliente);
      await api.updateCliente(cliente.id, editedCliente);
      
      setEditDialogVisible(false);
      
      // Actualizar la navegación con el cliente actualizado
      navigation.setParams({ cliente: editedCliente });
      
      Alert.alert(
        'Cliente Actualizado', 
        'Los datos del cliente han sido actualizados exitosamente',
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Recargar la pantalla de clientes al volver
              const prevScreen = navigation.getState().routes.find(r => r.name === 'Clientes');
              if (prevScreen && prevScreen.params && typeof prevScreen.params.onGoBack === 'function') {
                prevScreen.params.onGoBack();
              }
            } 
          }
        ]
      );
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      Alert.alert('Error', `No se pudo actualizar el cliente: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleNuevaVenta = () => {
    navigation.navigate('NuevaVenta', { cliente });
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.infoCard}>
        <Card.Content>
          <View style={styles.clienteHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {cliente.nombre.split(' ').map(n => n[0]).join('').toUpperCase()}
              </Text>
            </View>
            <View style={styles.clienteInfo}>
              <Text style={styles.clienteName}>{cliente.nombre}</Text>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <List.Item
            title="Teléfono"
            description={cliente.telefono}
            left={props => <List.Icon {...props} icon="phone" />}
            style={styles.listItem}
          />
          
          <List.Item
            title="Dirección"
            description={cliente.direccion}
            left={props => <List.Icon {...props} icon="map-marker" />}
            style={styles.listItem}
          />
          
          {cliente.ciudad && (
            <List.Item
              title="Ciudad"
              description={cliente.ciudad}
              left={props => <List.Icon {...props} icon="city" />}
              style={styles.listItem}
            />
          )}
          
          <List.Item
            title="Correo Electrónico"
            description={cliente.email || 'No especificado'}
            left={props => <List.Icon {...props} icon="email" />}
            style={styles.listItem}
          />
          
          {cliente.identificacion && (
            <List.Item
              title={`${cliente.tipo_identificacion || 'Identificación'}`}
              description={cliente.identificacion}
              left={props => <List.Icon {...props} icon="card-account-details" />}
              style={styles.listItem}
            />
          )}
          
          {cliente.notas && (
            <List.Item
              title="Notas"
              description={cliente.notas}
              left={props => <List.Icon {...props} icon="note-text" />}
              style={styles.listItem}
            />
          )}
        </Card.Content>
      </Card>
      
      <View style={styles.actionsContainer}>
        <Button
          mode="contained"
          icon="cart"
          onPress={handleNuevaVenta}
          style={styles.actionButton}
        >
          Nueva Venta
        </Button>
        
        <Button
          mode="outlined"
          icon="map"
          onPress={() => navigation.navigate('Rutas')}
          style={styles.actionButton}
        >
          Añadir a Ruta
        </Button>
      </View>
      
      <Card style={styles.historialCard}>
        <Card.Title title="Historial de Ventas" />
        <Card.Content>
          {loading ? (
            <Text style={styles.loadingText}>Cargando ventas...</Text>
          ) : ventasCliente.length > 0 ? (
            ventasCliente.map((venta) => (
              <List.Item
                key={venta.id}
                title={`Venta #${venta.id}`}
                description={`Fecha: ${venta.fecha}`}
                right={() => <Text style={styles.ventaTotal}>L. {(venta.total !== undefined && venta.total !== null) ? parseFloat(venta.total).toFixed(2) : '0.00'}</Text>}
                onPress={() => navigation.navigate('DetalleVenta', { venta })}
                style={styles.ventaItem}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>No hay ventas registradas para este cliente</Text>
          )}
        </Card.Content>
      </Card>
      
      <Portal>
        <Dialog visible={editDialogVisible} onDismiss={() => setEditDialogVisible(false)}>
          <Dialog.Title>Editar Cliente</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nombre"
              value={editedCliente.nombre}
              onChangeText={(text) => setEditedCliente({ ...editedCliente, nombre: text })}
              style={styles.dialogInput}
            />
            
            <TextInput
              label="Teléfono"
              value={editedCliente.telefono}
              onChangeText={(text) => setEditedCliente({ ...editedCliente, telefono: text })}
              style={styles.dialogInput}
              keyboardType="phone-pad"
            />
            
            <TextInput
              label="Dirección"
              value={editedCliente.direccion}
              onChangeText={(text) => setEditedCliente({ ...editedCliente, direccion: text })}
              style={styles.dialogInput}
              multiline
            />
            
            <TextInput
              label="Ciudad"
              value={editedCliente.ciudad || ''}
              onChangeText={(text) => setEditedCliente({ ...editedCliente, ciudad: text })}
              style={styles.dialogInput}
            />
            
            <TextInput
              label="Correo Electrónico"
              value={editedCliente.email}
              onChangeText={(text) => setEditedCliente({ ...editedCliente, email: text })}
              style={styles.dialogInput}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <View style={styles.formRow}>
              <View style={styles.formColumn}>
                <TextInput
                  label="Identificación"
                  value={editedCliente.identificacion || ''}
                  onChangeText={(text) => setEditedCliente({ ...editedCliente, identificacion: text })}
                  style={styles.dialogInput}
                />
              </View>
              <View style={styles.formColumn}>
                <Text style={styles.selectLabel}>Tipo de ID</Text>
                <Picker
                  selectedValue={editedCliente.tipo_identificacion || 'Identidad'}
                  onValueChange={(itemValue) =>
                    setEditedCliente({ ...editedCliente, tipo_identificacion: itemValue })
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="Identidad" value="Identidad" />
                  <Picker.Item label="RTN" value="RTN" />
                  <Picker.Item label="Pasaporte" value="Pasaporte" />
                </Picker>
              </View>
            </View>
            
            <TextInput
              label="Notas"
              value={editedCliente.notas || ''}
              onChangeText={(text) => setEditedCliente({ ...editedCliente, notas: text })}
              style={styles.dialogInput}
              multiline
              numberOfLines={3}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditDialogVisible(false)}>Cancelar</Button>
            <Button onPress={handleEditCliente}>Guardar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 8,
  },
  infoCard: {
    marginBottom: 8,
    elevation: 2,
  },
  clienteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  formColumn: {
    flex: 1,
    marginHorizontal: 5,
  },
  selectLabel: {
    fontSize: 12,
    color: '#6b6b6b',
    marginBottom: 5,
  },
  picker: {
    height: 50,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  clienteInfo: {
    flex: 1,
  },
  clienteName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    marginVertical: 16,
  },
  listItem: {
    paddingLeft: 0,
    paddingRight: 0,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  historialCard: {
    marginBottom: 16,
    elevation: 2,
  },
  ventaItem: {
    paddingLeft: 0,
    paddingRight: 0,
  },
  ventaTotal: {
    fontWeight: 'bold',
    color: '#28a745',
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#666',
    marginVertical: 20,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 20,
  },
  dialogInput: {
    marginBottom: 12,
  },
});

export default ClienteDetalleScreen;
