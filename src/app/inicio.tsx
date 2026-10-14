//inicio.tsx
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Badge from '../components/Badge';
import FilaItem from '../components/FilaItem';
import GradientBox from '../components/GradientBox';
import Pantalla from '../components/Pantalla';
import { Tema } from '../constants/theme';
import { useTema } from '../context/TemaContext';

const LISTAS = [
  { id: 1, colores: ['#24509E', '#C4571A'] },
  { id: 2, colores: ['#142C57', '#F0752A'] },
  { id: 3, colores: ['#E4ECFB', '#FCE6D6'] },
];

const CANCIONES = [
  { id: 1, titulo: 'Believer', detalle: '96 BPM · voz + guitarra', tono: 'G', colores: ['#24509E', '#C4571A'] },
  { id: 2, titulo: 'Moonlight Sonata 3rd', detalle: '72 BPM · piano', tono: 'Dm', colores: ['#142C57', '#F0752A'] },
  { id: 3, titulo: 'Winter', detalle: '110 BPM · trío', tono: 'Am', colores: ['#5A7FB8', '#FCE6D6'] },
  { id: 4, titulo: 'Canción de cuna', detalle: '64 BPM · voz sola', tono: 'C', colores: ['#24509E', '#C4571A'] },
];

export default function Inicio() {
  const { colores } = useTema();
  const styles = useMemo(() => crearEstilos(colores), [colores]);
  const [busqueda, setBusqueda] = useState('');

  return (
    <Pantalla titulo="Inicio" activo={0}>
      <View style={styles.buscador}>
        <Ionicons name="search-outline" size={18} color={colores.textoGris} />
        <TextInput
          style={styles.buscadorInput}
          placeholder="Buscar canciones o listas"
          placeholderTextColor={colores.textoGris}
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      <View style={styles.seccionHeader}>
        <Text style={styles.seccion}>Listas recientes</Text>
        <Text style={styles.verTodas}>Ver todas</Text>
      </View>
      <View style={styles.listasFila}>
        {LISTAS.map((lista) => (
          <GradientBox key={lista.id} colores={lista.colores} style={styles.listaCard}>
            <Ionicons name="musical-notes-outline" size={16} color="#FFFFFF" />
          </GradientBox>
        ))}
      </View>

      <Text style={[styles.seccion, { marginTop: 24, marginBottom: 8 }]}>Canciones recientes</Text>
      {CANCIONES.map((c) => (
        <FilaItem
          key={c.id}
          izquierda={<GradientBox colores={c.colores} style={styles.cancionImg} />}
          titulo={c.titulo}
          detalle={c.detalle}
          derecha={<Badge texto={c.tono} />}
        />
      ))}
    </Pantalla>
  );
}

const crearEstilos = (c: Tema) =>
  StyleSheet.create({
    buscador: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.campo,
      borderWidth: 1,
      borderColor: c.borde,
      borderRadius: 10,
      paddingHorizontal: 12,
      marginBottom: 24,
    },
    buscadorInput: { flex: 1, paddingVertical: 12, paddingLeft: 8, fontSize: 14, color: c.texto },
    seccionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    seccion: { fontSize: 13, fontWeight: '700', color: c.textoSuave },
    verTodas: { fontSize: 13, fontWeight: '700', color: c.azul },
    listasFila: { flexDirection: 'row', gap: 10 },
    listaCard: { flex: 1, aspectRatio: 1, borderRadius: 16, padding: 10, justifyContent: 'flex-end' },
    cancionImg: { width: 40, height: 40, borderRadius: 10 },
  });