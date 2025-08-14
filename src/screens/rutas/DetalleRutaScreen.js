import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Divider, ActivityIndicator, List, Chip } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const DetalleRutaScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { rutaId } = route.params || {};
  const [ruta, setRuta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRutaDetalle();
  }, [rutaId]);

  const loadRutaDetalle = async () => {
    try {
      setLoading(true);
      
      // Cargar datos reales desde la API
      const rutaData = await api.getRuta(rutaId);
      console.log('Detalle de ruta cargado:', rutaData);
      
      // Formatear los datos para la vista
      const rutaFormateada = {
        id: rutaData.id,
        nombre: rutaData.nombre,
        descripcion: rutaData.descripcion || 'Sin descripción',
        vendedor: rutaData.vendedor_nombre || 'Sin asignar',
        estado: rutaData.estado || 'activa',
        diasVisita: rutaData.dias_visita ? (Array.isArray(rutaData.dias_visita) ? rutaData.dias_visita : JSON.parse(rutaData.dias_visita)) : [],
        fechaInicio: rutaData.fecha_inicio ? new Date(rutaData.fecha_inicio).toISOString().split('T')[0] : 'No definida',
        fechaFin: rutaData.fecha_fin ? new Date(rutaData.fecha_fin).toISOString().split('T')[0] : 'No definida',
        ultimaVisita: rutaData.ultima_visita ? new Date(rutaData.ultima_visita).toISOString().split('T')[0] : null,
        proximaVisita: rutaData.proxima_visita ? new Date(rutaData.proxima_visita).toISOString().split('T')[0] : null,
        clientes: rutaData.clientes || [],
        visitas: rutaData.visitas || [],
        creacion: rutaData.fecha_creacion ? new Date(rutaData.fecha_creacion).toISOString().split('T')[0] : null,
        ultimaModificacion: rutaData.fecha_modificacion ? new Date(rutaData.fecha_modificacion).toISOString().split('T')[0] : null,
        notas: rutaData.notas || 'Sin notas adicionales'
      };
      
      setRuta(rutaFormateada);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar detalle de la ruta:', error);
      setLoading(false);
      
      // Si hay un error, mostrar datos de ejemplo
      const rutaEjemplo = {
        id: rutaId,
        nombre: 'Ruta Norte (ejemplo)',
        descripcion: 'Ruta que cubre la zona norte de la ciudad, incluyendo los barrios A, B y C.',
        vendedor: 'Juan Pérez',
        estado: 'activa',
        diasVisita: ['Lunes', 'Miércoles', 'Viernes'],
        ultimaVisita: '2025-06-10',
        proximaVisita: '2025-06-17',
        clientes: [
          { id: 1, nombre: 'Tienda A', direccion: 'Calle Principal 123', ultimaCompra: '2025-06-10', montoTotal: 1250.50 },
          { id: 2, nombre: 'Tienda B', direccion: 'Av. Central 456', ultimaCompra: '2025-06-03', montoTotal: 850.75 },
        ],
        visitas: [],
        creacion: '2025-01-15',
        ultimaModificacion: '2025-05-20',
        notas: 'Ruta con alto potencial de ventas. Los clientes suelen hacer pedidos grandes los días lunes.'
      };
      setRuta(rutaEjemplo);
      Alert.alert('Error', 'No se pudo cargar la información de la ruta. Mostrando datos de ejemplo.');
    }
  };

  const handleEdit = () => {
    navigation.navigate('EditarRuta', { ruta });
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Está seguro que desea eliminar esta ruta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            // Aquí iría la lógica para eliminar la ruta
            Alert.alert('Éxito', 'Ruta eliminada correctamente');
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleToggleEstado = () => {
    const nuevoEstado = ruta.estado === 'activa' ? 'inactiva' : 'activa';
    setRuta({ ...ruta, estado: nuevoEstado });
    
    Alert.alert(
      'Estado actualizado',
      `La ruta ahora está ${nuevoEstado}`,
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loaderText}>Cargando información de la ruta...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title 
          title={ruta.nombre} 
          subtitle={`Vendedor: ${ruta.vendedor}`}
          right={() => (
            <Chip 
              mode="outlined"
              style={[
                styles.estadoChip,
                ruta.estado === 'activa' ? styles.chipActiva : styles.chipInactiva
              ]}
            >
              {ruta.estado === 'activa' ? 'Activa' : 'Inactiva'}
            </Chip>
          )}
        />
        <Card.Content>
          <Text style={styles.descripcion}>{ruta.descripcion}</Text>
          
          <Divider style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha de inicio:</Text>
            <Text style={styles.infoValue}>{ruta.fechaInicio}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha de fin:</Text>
            <Text style={styles.infoValue}>{ruta.fechaFin}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Días de visita:</Text>
            <Text style={styles.infoValue}>{ruta.diasVisita.join(', ')}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Última visita:</Text>
            <Text style={styles.infoValue}>{ruta.ultimaVisita || 'No registrada'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Próxima visita:</Text>
            <Text style={styles.infoValue}>{ruta.proximaVisita || 'No programada'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total clientes:</Text>
            <Text style={styles.infoValue}>{ruta.clientes.length}</Text>
          </View>
        </Card.Content>
        <Card.Actions>
          <Button onPress={handleToggleEstado}>
            {ruta.estado === 'activa' ? 'Desactivar' : 'Activar'}
          </Button>
        </Card.Actions>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Clientes en la Ruta" />
        <Card.Content>
          {ruta.clientes.map(cliente => (
            <List.Item
              key={cliente.id}
              title={cliente.nombre}
              description={cliente.direccion}
              left={props => <List.Icon {...props} icon="store" />}
              right={() => (
                <View style={styles.clienteInfo}>
                  <Text style={styles.clienteCompra}>
                    Última compra: {cliente.ultimaCompra || 'No registrada'}
                  </Text>
                  <Text style={styles.clienteMonto}>
                    ${cliente.montoTotal ? cliente.montoTotal.toFixed(2) : '0.00'}
                  </Text>
                </View>
              )}
              onPress={() => navigation.navigate('ClienteDetalle', { clienteId: cliente.id })}
              style={styles.clienteItem}
            />
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Información Adicional" />
        <Card.Content>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha de creación:</Text>
            <Text style={styles.infoValue}>{ruta.creacion}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Última modificación:</Text>
            <Text style={styles.infoValue}>{ruta.ultimaModificacion}</Text>
          </View>
          
          <Divider style={styles.divider} />
          
          <Text style={styles.infoLabel}>Notas:</Text>
          <Text style={styles.notesText}>{ruta.notas}</Text>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          icon="pencil"
          onPress={handleEdit}
          style={styles.editButton}
        >
          Editar Ruta
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
  descripcion: {
    marginBottom: 10,
    fontStyle: 'italic',
  },
  divider: {
    marginVertical: 10,
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
  chipActiva: {
    backgroundColor: '#ccffcc',
  },
  chipInactiva: {
    backgroundColor: '#ffcccc',
  },
  clienteItem: {
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  clienteInfo: {
    alignItems: 'flex-end',
  },
  clienteCompra: {
    fontSize: 12,
    color: '#666',
  },
  clienteMonto: {
    fontWeight: 'bold',
    color: '#0066cc',
  },
  notesText: {
    fontStyle: 'italic',
    marginTop: 5,
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

export default DetalleRutaScreen;
