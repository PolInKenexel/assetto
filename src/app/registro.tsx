// src/app/registro.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AuthInput from '../components/AuthInput';
import Fondo from '../components/Fondo';
import GradientButton from '../components/GradientButton';
import { Tema } from '../constants/theme';
import { useTema } from '../context/TemaContext';

export default function Registro() {
  const router = useRouter();
  const { colores } = useTema();
  const styles = useMemo(() => crearEstilos(colores), [colores]);
  
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');

  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  const registrarse = async () => {
    if (!nombre || !apellido || !correo || !contrasena) {
      Alert.alert('Faltan datos', 'Completa todos los campos.');
      return;
    }
    
    if (contrasena !== confirmar) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: nombre,
          apellido: apellido,
          email: correo,
          password: contrasena,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Error de registro', data.error || 'Ocurrió un problema');
        return;
      }

      // Guardar el token devuelto por el servidor e iniciar sesión automáticamente
      await AsyncStorage.setItem('userToken', data.token);
      router.replace('/inicio');

    } catch (error) {
      console.error('Error al registrar usuario:', error);
      Alert.alert(
        'Error de red',
        'No se pudo conectar al servidor. Verifica que tu IP sea correcta y el servidor esté corriendo.'
      );
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Fondo />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <AuthInput label="Nombre" value={nombre} onChangeText={setNombre} placeholder="Nombre" />
        <AuthInput label="Apellido" value={apellido} onChangeText={setApellido} placeholder="Apellido" />
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
          placeholder="••••••••••••"
          secureTextEntry
        />
        <AuthInput
          label="Confirmar contraseña"
          value={confirmar}
          onChangeText={setConfirmar}
          placeholder="••••••••••••"
          secureTextEntry
        />

        <View style={{ marginTop: 8 }}>
          <GradientButton title="Registrarse" onPress={registrarse} />
        </View>
      </ScrollView>
    </View>
  );
}

const crearEstilos = (c: Tema) =>
  StyleSheet.create({
    container: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
    back: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: c.campo,
      borderWidth: 1,
      borderColor: c.borde,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backText: { fontSize: 22, color: c.texto, lineHeight: 26 },
    logo: { width: '100%', height: 120, marginVertical: 24 },
  });