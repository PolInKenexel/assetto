// src/app/mis-listas.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import GradientBox from '../components/GradientBox';
import Pantalla from '../components/Pantalla';
import { Tema } from '../constants/theme';
import { useTema } from '../context/TemaContext';

export default function MisListas() {
  const router = useRouter();
  const { colores } = useTema();
  const styles = useMemo(() => crearEstilos(colores), [colores]);

  const [listas, setListas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    const obtenerListas = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          router.replace('/');
          return;
        }

        const response = await fetch(`${API_URL}/listas`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) router.replace('/');
          return;
        }

        const data = await response.json();
        setListas(data);
      } catch (error) {
        console.error('Error al obtener listas:', error);
      } finally {
        setCargando(false);
      }
    };

    obtenerListas();
  }, []);

  const nuevaLista = () => {
    router.push('/crear-lista');
  };

  const fab = (
    <Pressable style={styles.fab} onPress={nuevaLista}>
      <Ionicons name="add" size={28} color="#FFFFFF" />
    </Pressable>
  );

  return (
    <Pantalla titulo="Mis listas" activo={1} flotante={fab}>
      <View style={styles.grid}>
        {cargando ? (
          <ActivityIndicator size="large" color={colores.azul} style={{ width: '100%', marginTop: 40 }} />
        ) : (
          <>
            {listas.map((lista, index) => {
              // Alternar colores por defecto para darle vida a la UI, ya que la BD no guarda colores
              const palette = index % 2 === 0 ? ['#3A5BA9', '#E8793A'] : ['#1F2F55', '#E8A23A'];

              return (
                <Pressable key={lista.id_lista} style={styles.card}>
                  <GradientBox colores={palette} style={styles.cardInterna}>
                    <Text style={styles.cardNombre}>{lista.nombre}</Text>
                    {/* El endpoint actual no devuelve el conteo de canciones, mostramos la fecha o un texto genérico */}
                    <Text style={styles.cardCanciones}>
                      {new Date(lista.fecha_creacion).toLocaleDateString()}
                    </Text>
                  </GradientBox>
                </Pressable>
              );
            })}

            <Pressable style={[styles.card, styles.cardNueva]} onPress={nuevaLista}>
              <Ionicons name="add" size={28} color={colores.naranja} />
              <Text style={styles.nuevaTexto}>Nueva lista</Text>
            </Pressable>
          </>
        )}
      </View>
    </Pantalla>
  );
}

const crearEstilos = (c: Tema) =>
  StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 12,
    },
    card: { width: '48%', aspectRatio: 1.1 },
    cardInterna: { flex: 1, borderRadius: 16, padding: 12, justifyContent: 'flex-end' },
    cardNombre: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
    cardCanciones: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },
    cardNueva: {
      backgroundColor: c.campo,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: c.borde,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    nuevaTexto: { color: c.textoGris, fontSize: 12, fontWeight: '700', marginTop: 4 },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 100,
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: c.naranja,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: c.naranja,
      shadowOpacity: 0.4,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 5 },
      elevation: 8,
    },
  });