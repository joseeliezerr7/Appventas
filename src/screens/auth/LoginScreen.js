import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert, Image } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '../../contexts/AuthContext';

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [customLogo, setCustomLogo] = useState(null);
  const { login, error, loading } = useAuth();

  useEffect(() => {
    loadCustomLogo();
  }, []);

  const loadCustomLogo = async () => {
    try {
      const logoPath = FileSystem.documentDirectory + 'logo.png';
      const logoExists = await FileSystem.getInfoAsync(logoPath);
      if (logoExists.exists) {
        setCustomLogo(logoPath);
      }
    } catch (error) {
      console.log('No se pudo cargar el logo personalizado:', error);
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Por favor ingresa tu usuario y contraseña');
      return;
    }

    const success = await login(username, password);
    if (!success && error) {
      Alert.alert('Error de inicio de sesión', error);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.innerContainer}>
          <View style={styles.logoContainer}>
            {customLogo ? (
              <Image source={{ uri: customLogo }} style={styles.customLogo} resizeMode="contain" />
            ) : (
              <>
                <Text style={styles.logoText}>VA</Text>
                <Text style={styles.appName}>Ventas App</Text>
              </>
            )}
          </View>

          <View style={styles.formContainer}>
            <TextInput
              label="Usuario"
              value={username}
              onChangeText={setUsername}
              style={styles.input}
              autoCapitalize="none"
              left={<TextInput.Icon icon="account" />}
            />

            <TextInput
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureTextEntry}
              style={styles.input}
              right={
                <TextInput.Icon 
                  icon={secureTextEntry ? "eye" : "eye-off"} 
                  onPress={() => setSecureTextEntry(!secureTextEntry)}
                />
              }
              left={<TextInput.Icon icon="lock" />}
            />

            <Button 
              mode="contained" 
              onPress={handleLogin} 
              style={styles.button}
              loading={loading}
              disabled={loading}
            >
              Iniciar Sesión
            </Button>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2025 Ventas App - Todos los derechos reservados</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 10,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
  },
  customLogo: {
    width: 200,
    height: 120,
    marginBottom: 20,
  },
  formContainer: {
    marginBottom: 30,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  button: {
    marginTop: 10,
    paddingVertical: 8,
    backgroundColor: '#007bff',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#888',
    fontSize: 12,
  },
});

export default LoginScreen;
