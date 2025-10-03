import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Avatar, Button, Card, Divider, List, Text, TextInput } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';

const AjustesScreen = () => {
  const navigation = useNavigation();
  const { user, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [logoImage, setLogoImage] = useState(null);
  const [profileData, setProfileData] = useState({
    nombre: user?.nombre || user?.name || '',
    email: user?.email || '',
    telefono: user?.telefono || '',
    avatar: user?.avatar || null
  });

  useEffect(() => {
    navigation.setOptions({
      title: 'Ajustes',
      headerShown: true,
    });
    loadCurrentLogo();
  }, [navigation]);

  const loadCurrentLogo = async () => {
    try {
      // Intentar cargar el logo actual desde el almacenamiento local
      const logoPath = FileSystem.documentDirectory + 'logo.png';
      const logoExists = await FileSystem.getInfoAsync(logoPath);
      if (logoExists.exists) {
        setLogoImage(logoPath);
      }
    } catch (error) {
      console.log('No se pudo cargar el logo actual:', error);
    }
  };

  const handleChangeProfileData = (field, value) => {
    setProfileData({
      ...profileData,
      [field]: value
    });
  };

  const selectLogo = async () => {
    try {
      // Solicitar permisos
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permisos requeridos', 'Se necesitan permisos para acceder a la galería de imágenes.');
        return;
      }

      // Abrir selector de imágenes
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;

        // Guardar la imagen en el directorio de documentos
        const logoPath = FileSystem.documentDirectory + 'logo.png';
        await FileSystem.copyAsync({
          from: imageUri,
          to: logoPath,
        });

        setLogoImage(logoPath);
        Alert.alert('Éxito', 'Logo de inicio de sesión actualizado correctamente.');
      }
    } catch (error) {
      console.error('Error al seleccionar logo:', error);
      Alert.alert('Error', 'No se pudo actualizar el logo. Intente nuevamente.');
    }
  };

  const selectProfilePicture = async () => {
    try {
      // Solicitar permisos
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permisos requeridos', 'Se necesitan permisos para acceder a la galería de imágenes.');
        return;
      }

      // Abrir selector de imágenes
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setProfileData({
          ...profileData,
          avatar: base64Image
        });
      }
    } catch (error) {
      console.error('Error al seleccionar foto de perfil:', error);
      Alert.alert('Error', 'No se pudo actualizar la foto de perfil.');
    }
  };

  const saveProfileChanges = async () => {
    try {
      setLoading(true);

      // Validar campos requeridos
      if (!profileData.nombre.trim()) {
        Alert.alert('Error', 'El nombre es obligatorio.');
        return;
      }

      if (!profileData.email.trim()) {
        Alert.alert('Error', 'El email es obligatorio.');
        return;
      }

      // Preparar solo los campos que han cambiado
      const updatedFields = {};

      if (profileData.nombre !== (user?.nombre || user?.name || '')) {
        updatedFields.nombre = profileData.nombre;
      }

      if (profileData.email !== (user?.email || '')) {
        updatedFields.email = profileData.email;
      }

      if (profileData.telefono !== (user?.telefono || '')) {
        updatedFields.telefono = profileData.telefono;
      }

      if (profileData.avatar !== (user?.avatar || null)) {
        updatedFields.avatar = profileData.avatar;
      }

      console.log('Campos a actualizar:', updatedFields);
      console.log('Usuario actual:', { nombre: user?.nombre, email: user?.email, telefono: user?.telefono });

      if (Object.keys(updatedFields).length === 0) {
        Alert.alert('Info', 'No hay cambios para guardar.');
        return;
      }

      // Enviar datos al servidor
      if (updateUserProfile) {
        await updateUserProfile(updatedFields);
      }

      Alert.alert('Éxito', 'Perfil actualizado correctamente.');
    } catch (error) {
      console.error('Error al guardar perfil:', error);
      Alert.alert('Error', 'No se pudo actualizar el perfil. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const resetLogo = async () => {
    Alert.alert(
      'Restablecer Logo',
      '¿Está seguro que desea restablecer el logo por defecto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: async () => {
            try {
              const logoPath = FileSystem.documentDirectory + 'logo.png';
              const logoExists = await FileSystem.getInfoAsync(logoPath);
              if (logoExists.exists) {
                await FileSystem.deleteAsync(logoPath);
              }
              setLogoImage(null);
              Alert.alert('Éxito', 'Logo restablecido al predeterminado.');
            } catch (error) {
              console.error('Error al restablecer logo:', error);
              Alert.alert('Error', 'No se pudo restablecer el logo.');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Sección de Logo */}
      <Card style={styles.card}>
        <Card.Title
          title="Logo de Inicio de Sesión"
          subtitle="Personaliza el logo que aparece en la pantalla de login"
          left={(props) => <Avatar.Icon {...props} icon="image" />}
        />
        <Card.Content>
          <View style={styles.logoContainer}>
            {logoImage ? (
              <Image source={{ uri: logoImage }} style={styles.logoPreview} resizeMode="contain" />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Ionicons name="image-outline" size={64} color="#ccc" />
                <Text style={styles.placeholderText}>Sin logo personalizado</Text>
              </View>
            )}
          </View>

          <View style={styles.buttonRow}>
            <Button
              mode="contained"
              onPress={selectLogo}
              style={styles.logoButton}
              icon="upload"
            >
              Cambiar Logo
            </Button>
            <Button
              mode="outlined"
              onPress={resetLogo}
              style={styles.logoButton}
              icon="refresh"
            >
              Restablecer
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Sección de Perfil */}
      <Card style={styles.card}>
        <Card.Title
          title="Mi Perfil"
          subtitle="Actualiza tu información personal"
          left={(props) => <Avatar.Icon {...props} icon="account" />}
        />
        <Card.Content>
          {/* Foto de Perfil */}
          <View style={styles.profilePictureContainer}>
            <TouchableOpacity onPress={selectProfilePicture} style={styles.avatarContainer}>
              {profileData.avatar ? (
                <Avatar.Image size={80} source={{ uri: profileData.avatar }} />
              ) : (
                <Avatar.Text
                  size={80}
                  label={profileData.nombre.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                />
              )}
              <View style={styles.avatarOverlay}>
                <Ionicons name="camera" size={20} color="white" />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Toca para cambiar foto</Text>
          </View>

          <Divider style={styles.divider} />

          {/* Campos del Perfil */}
          <TextInput
            label="Nombre completo"
            value={profileData.nombre}
            onChangeText={(text) => handleChangeProfileData('nombre', text)}
            style={styles.input}
            left={<TextInput.Icon icon="account" />}
          />

          <TextInput
            label="Correo electrónico"
            value={profileData.email}
            onChangeText={(text) => handleChangeProfileData('email', text)}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email" />}
          />

          <TextInput
            label="Teléfono (opcional)"
            value={profileData.telefono}
            onChangeText={(text) => handleChangeProfileData('telefono', text)}
            style={styles.input}
            keyboardType="phone-pad"
            left={<TextInput.Icon icon="phone" />}
          />

          <Button
            mode="contained"
            onPress={saveProfileChanges}
            style={styles.saveButton}
            loading={loading}
            disabled={loading}
            icon="content-save"
          >
            Guardar Cambios
          </Button>
        </Card.Content>
      </Card>

      {/* Administración del Sistema */}
      {(user?.rol === 'admin' || user?.rol === 'supervisor') && (
        <Card style={styles.card}>
          <Card.Title
            title="Administración"
            subtitle="Gestión del sistema y usuarios"
            left={(props) => <Avatar.Icon {...props} icon="shield-account" />}
          />
          <Card.Content>
            <List.Item
              title="Gestión de Usuarios"
              description="Crear, editar y administrar usuarios del sistema"
              left={props => <List.Icon {...props} icon="account-group" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('Usuarios')}
              style={styles.adminMenuItem}
            />
            <List.Item
              title="Configuración del Sistema"
              description="Ajustes avanzados del sistema"
              left={props => <List.Icon {...props} icon="cog" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto')}
              style={styles.adminMenuItem}
            />
            <List.Item
              title="Respaldo de Datos"
              description="Exportar e importar datos del sistema"
              left={props => <List.Icon {...props} icon="database-export" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto')}
              style={styles.adminMenuItem}
            />
          </Card.Content>
        </Card>
      )}

      {/* Información del Sistema */}
      <Card style={styles.card}>
        <Card.Title
          title="Información del Sistema"
          left={(props) => <Avatar.Icon {...props} icon="information" />}
        />
        <Card.Content>
          <List.Item
            title="Versión de la aplicación"
            description="1.0.0"
            left={props => <List.Icon {...props} icon="information-outline" />}
          />
          <List.Item
            title="Última actualización"
            description="29 de septiembre, 2025"
            left={props => <List.Icon {...props} icon="update" />}
          />
          <List.Item
            title="Desarrollado por"
            description="Solutechn"
            left={props => <List.Icon {...props} icon="code-tags" />}
          />
        </Card.Content>
      </Card>
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
  logoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  logoPreview: {
    width: 200,
    height: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  logoPlaceholder: {
    width: 200,
    height: 120,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
  },
  placeholderText: {
    marginTop: 8,
    color: '#666',
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  logoButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    marginTop: 8,
    color: '#666',
    fontSize: 12,
  },
  divider: {
    marginVertical: 15,
  },
  input: {
    marginBottom: 15,
  },
  saveButton: {
    marginTop: 20,
  },
  adminMenuItem: {
    paddingVertical: 5,
  },
});

export default AjustesScreen;