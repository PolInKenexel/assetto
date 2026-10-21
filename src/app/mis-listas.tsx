// src/app/mis-listas.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import GradientBox from '../components/GradientBox';
import Pantalla from '../components/Pantalla';
import { Tema } from '../constants/theme';
import { useTema } from '../context/TemaContext';

const LISTAS = [
  { id: 1, nombre: 'Ensayo jueves', canciones: 8, colores: ['#3A5BA9', '#E8793A'] },
  { id: 2, nombre: 'Boda Ana & Luis', canciones: 14, colores: ['#1F2F55', '#E8A23A'] },
  { id: 3, nombre: 'Set acústico', canciones: 6, colores: ['#3F6FC0', '#F0B070'] },
];

export default function MisListas() {
  const router = useRouter();
  const { colores } = useTema();
  const styles = useMemo(() => crearEstilos(colores), [colores]);

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
        {LISTAS.map((lista) => (
          <Pressable key={lista.id} style={styles.card}>
            <GradientBox colores={lista.colores} style={styles.cardInterna}>
              <Text style={styles.cardNombre}>{lista.nombre}</Text>
              <Text style={styles.cardCanciones}>{lista.canciones} canciones</Text>
            </GradientBox>
          </Pressable>
        ))}

        <Pressable style={[styles.card, styles.cardNueva]} onPress={nuevaLista}>
          <Ionicons name="add" size={28} color={colores.naranja} />
          <Text style={styles.nuevaTexto}>Nueva lista</Text>
        </Pressable>
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