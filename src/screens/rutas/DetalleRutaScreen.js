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

  // Función para calcular la próxima visita basada en los días programados
  const calcularProximaVisita = (diasVisita) => {
    if (!diasVisita) return null;
    
    try {
      const dias = Array.isArray(diasVisita) ? diasVisita : JSON.parse(diasVisita);
      if (!Array.isArray(dias) || dias.length === 0) return null;

      const diasSemana = {
        'lunes': 1, 'martes': 2, 'miercoles': 3, 'jueves': 4, 
        'viernes': 5, 'sabado': 6, 'domingo': 0
      };

      const hoy = new Date();
      const diaActual = hoy.getDay();
      
      const diasNumeros = dias.map(dia => diasSemana[dia.toLowerCase()]).filter(num => num !== undefined);
      let proximoDia = null;
      
      // Buscar próximo día en esta semana
      for (let i = diaActual + 1; i <= 6; i++) {
        if (diasNumeros.includes(i)) {
          proximoDia = i;
          break;
        }
      }
      
      // Si no hay en esta semana, buscar en la próxima
      if (proximoDia === null) {
        for (let i = 0; i <= 6; i++) {
          if (diasNumeros.includes(i)) {
            proximoDia = i;
            break;
          }
        }
      }
      
      if (proximoDia === null) return null;
      
      const proximaVisita = new Date(hoy);
      const diasHastaProxima = proximoDia >= diaActual ? proximoDia - diaActual : (7 - diaActual) + proximoDia;
      proximaVisita.setDate(hoy.getDate() + diasHastaProxima);
      
      return proximaVisita.toLocaleDateString('es-HN');
    } catch (error) {
      console.error('Error calculando próxima visita:', error);
      return null;
    }
  };

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
        vendedor: rutaData.usuario_nombre || 'Sin asignar',
        usuario_id: rutaData.usuario_id, // Agregar el ID del usuario para edición
        estado: rutaData.estado || 'activa',
        diasVisita: rutaData.dias_visita ? (Array.isArray(rutaData.dias_visita) ? rutaData.dias_visita : JSON.parse(rutaData.dias_visita)) : [],
        fechaInicio: rutaData.fecha_inicio ? rutaData.fecha_inicio : null, // Mantener formato original para edición
        fechaFin: rutaData.fecha_fin ? rutaData.fecha_fin : null, // Mantener formato original para edición
        ultimaVisita: rutaData.ultima_visita ? new Date(rutaData.ultima_visita).toLocaleDateString('es-HN') : null,
        proximaVisita: calcularProximaVisita(rutaData.dias_visita),
        clientes: rutaData.clientes || [],
        visitas: rutaData.visitas || [],
        creacion: rutaData.creado_en ? new Date(rutaData.creado_en).toLocaleDateString('es-HN') : null,
        ultimaModificacion: rutaData.fecha_modificacion ? new Date(rutaData.fecha_modificacion).toLocaleDateString('es-HN') : null,
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
        usuario_id: 1, // ID de ejemplo para el vendedor
        estado: 'activa',
        diasVisita: ['Lunes', 'Miércoles', 'Viernes'],
        fechaInicio: '2025-01-15',
        fechaFin: null,
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
              title={cliente.cliente_nombre || cliente.nombre || 'Cliente sin nombre'}
              description={cliente.cliente_direccion || cliente.direccion || 'Sin dirección'}
              left={props => <List.Icon {...props} icon="store" />}
              right={() => (
                <View style={styles.clienteInfo}>
                  <Text style={styles.clienteOrden}>
                    Orden: {cliente.orden || 'N/A'}
                  </Text>
                  <Text style={styles.clienteTelefono}>
                    {cliente.cliente_telefono || 'Sin teléfono'}
                  </Text>
                </View>
              )}
              onPress={() => navigation.navigate('ClienteDetalle', { clienteId: cliente.cliente_id || cliente.id })}
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
  clienteOrden: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  clienteTelefono: {
    fontSize: 11,
    color: '#888',
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
