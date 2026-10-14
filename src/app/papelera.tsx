import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import FilaItem from '../components/FilaItem';
import GradientBox from '../components/GradientBox';
import Pantalla from '../components/Pantalla';
import { Tema } from '../constants/theme';
import { useTema } from '../context/TemaContext';
import { useSeleccion } from '../hooks/useSeleccion';

const LISTAS = [
  { id: 1, nombre: 'Clásica', canciones: 10, colores: ['#3A5BA9', '#E8793A'] },
  { id: 2, nombre: 'Pop-Rock', canciones: 5, colores: ['#1F2F55', '#E8A23A'] },
  { id: 3, nombre: 'Cumbia', canciones: 13, colores: ['#3F6FC0', '#F0B070'] },
];

const CANCIONES = [
  { id: 1, titulo: 'Vals en Sol mayor', eliminada: 'hace 2 días', colores: ['#3A5BA9', '#E8793A'] },
  { id: 2, titulo: 'Balada nocturna', eliminada: 'hace 5 días', colores: ['#1F2F55', '#E8A23A'] },
  { id: 3, titulo: 'Bossa de otoño', eliminada: 'hace 6 días', colores: ['#5A7FB8', '#F0B070'] },
  { id: 4, titulo: 'Canción de cuna', eliminada: 'hace 9 días', colores: ['#3A5BA9', '#E8793A'] },
  { id: 5, titulo: 'Interludio en Re', eliminada: 'hace 12 días', colores: ['#1F2F55', '#E8A23A'] },
];

export default function Papelera() {
  const { colores } = useTema();
  const styles = useMemo(() => crearEstilos(colores), [colores]);
  const listas = useSeleccion();
  const canciones = useSeleccion();

  return (
    <Pantalla titulo="Papelera" activo={4}>
      {/* Listas */}
      <Text style={styles.seccion}>Listas</Text>
      <View style={styles.listasFila}>
        {LISTAS.map((lista) => {
          const marcada = listas.estaSeleccionado(lista.id);
          return (
            <Pressable
              key={lista.id}
              style={{ flex: 1 }}
              onPress={() => listas.alternar(lista.id)}
            >
              <GradientBox colores={lista.colores} style={styles.listaCard}>
                <View style={[styles.check, marcada && styles.checkMarcado]}>
                  {marcada && <Ionicons name="checkmark" size={12} color={colores.naranja} />}
                </View>
                <Text style={styles.listaNombre}>{lista.nombre}</Text>
                <Text style={styles.listaCanciones}>{lista.canciones} canciones</Text>
              </GradientBox>
            </Pressable>
          );
        })}
      </View>

      {/* Canciones */}
      <Text style={[styles.seccion, { marginTop: 24 }]}>Canciones</Text>
      {CANCIONES.map((c) => {
        const marcada = canciones.estaSeleccionado(c.id);
        return (
          <FilaItem
            key={c.id}
            izquierda={<GradientBox colores={c.colores} style={styles.cancionImg} />}
            titulo={c.titulo}
            detalle={`eliminada ${c.eliminada}`}
            onPress={() => canciones.alternar(c.id)}
            derecha={
              <View style={[styles.circulo, marcada && styles.circuloMarcado]}>
                {marcada && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
            }
          />
        );
      })}

      <Text style={styles.nota}>
        Los elementos se eliminarán permanentemente después de 30 días.
      </Text>
    </Pantalla>
  );
}

const crearEstilos = (c: Tema) =>
  StyleSheet.create({
    seccion: { fontSize: 13, fontWeight: '700', color: c.textoSuave, marginBottom: 10 },
    listasFila: { flexDirection: 'row', gap: 10 },
    listaCard: {
      aspectRatio: 1,
      borderRadius: 16,
      padding: 10,
      justifyContent: 'flex-end',
    },
    listaNombre: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
    listaCanciones: { color: 'rgba(255,255,255,0.8)', fontSize: 10, marginTop: 2 },
    check: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: 'rgba(255,255,255,0.85)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkMarcado: { backgroundColor: '#FFFFFF' },
    cancionImg: { width: 40, height: 40, borderRadius: 10 },
    circulo: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: c.borde,
      alignItems: 'center',
      justifyContent: 'center',
    },
    circuloMarcado: { backgroundColor: c.naranja, borderColor: c.naranja },
    nota: {
      textAlign: 'center',
      fontSize: 12,
      color: c.textoGris,
      marginTop: 20,
      paddingHorizontal: 20,
    },
  });