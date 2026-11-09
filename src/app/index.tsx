// src/app/index.tsx
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import AuthInput from '../components/AuthInput';
import Fondo from '../components/Fondo';
import GradientButton from '../components/GradientButton';
import { Tema } from '../constants/theme';
import { useTema } from '../context/TemaContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Login() {
  const router = useRouter();
  const { colores } = useTema();
  const styles = useMemo(() => crearEstilos(colores), [colores]);
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');

  const iniciarSesion = async () => {
  if (!correo || !contrasena) {
    Alert.alert('Faltan datos', 'Escribe tu correo y contraseña.');
    return;
  }

  //cambiar ip por la de la comnputadora donde se ejecuta el backend
  //const API_URL = 'http://192.168.1.XX:3000'; 
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: correo,
        password: contrasena,
      }),
    });

    const data = await response.json();

    // Si las credenciales son incorrectas, mostramos el error del backend
    if (!response.ok) {
      Alert.alert('Error de inicio de sesión', data.error || 'Ocurrió un problema');
      return;
    }

    // Si fue exitoso, guardamos el token localmente en el dispositivo
    await AsyncStorage.setItem('userToken', data.token);

    // Finalmente, navegamos a la pantalla principal
    router.replace('/inicio');

  } catch (error) {
    console.error(error);
    Alert.alert(
      'Error de conexión', 
      'No se pudo conectar al servidor. Verifica que XAMPP y Node estén corriendo, y que la IP sea correcta.'
    );
  }
};

  return (
    <View style={{ flex: 1 }}>
      <Fondo />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <AuthInput
          label="Correo"
          value={correo}
          onChangeText={setCorreo}
          placeholder="username@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <AuthInput
          label="Contraseña"
          value={contrasena}
          onChangeText={setContrasena}
          placeholder="••••••••"
          secureTextEntry
        />

        <GradientButton title="Iniciar sesión" onPress={iniciarSesion} />

        <Text style={styles.footer}>
          ¿No tienes cuenta?{' '}
          <Text style={styles.link} onPress={() => router.push('/registro')}>
            Regístrate
          </Text>
        </Text>
      </ScrollView>
    </View>
  );
}

const crearEstilos = (c: Tema) =>
  StyleSheet.create({
    container: { flexGrow: 1, paddingHorizontal: 20, justifyContent: 'center' },
    logo: { width: '100%', height: 140, marginBottom: 40 },
    footer: { textAlign: 'center', marginTop: 16, fontSize: 13, color: c.textoSuave },
    link: { color: c.naranja, fontWeight: '700' },
  });