import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Badge from '../components/Badge';
import FilaItem from '../components/FilaItem';
import GradientBox from '../components/GradientBox';
import Pantalla from '../components/Pantalla';
import { Tema } from '../constants/theme';
import { useTema } from '../context/TemaContext';

const CATEGORIAS = ['Cuerda', 'Teclado', 'Percusión', 'Voz'];

const ICONOS: Record<string, any> = {
  Cuerda: 'musical-notes-outline',
  Teclado: 'grid-outline',
  Percusión: 'radio-button-on-outline',
  Voz: 'mic-outline',
};

const INSTRUMENTOS = [
  { id: 1, nombre: 'Guitarra acústica', detalle: 'Afinación estándar · rango E2–E5', categoria: 'Cuerda', principal: true, colores: ['#3A5BA9', '#E8793A'] },
  { id: 2, nombre: 'Violín', detalle: 'Afinación G3–D4–A4–E5', categoria: 'Cuerda', principal: false, colores: ['#1F2F55', '#E8A23A'] },
  { id: 3, nombre: 'Piano', detalle: '88 teclas · rango A0–C8', categoria: 'Teclado', principal: false, colores: ['#5A7FB8', '#F0B070'] },
  { id: 4, nombre: 'Cajón flamenco', detalle: 'Sin tono definido', categoria: 'Percusión', principal: false, colores: ['#3A5BA9', '#E8793A'] },
  { id: 5, nombre: 'Voz', detalle: 'Mezzosoprano · rango A3–A5', categoria: 'Voz', principal: false, colores: ['#1F2F55', '#E8A23A'] },
];

export default function MisInstrumentos() {
  const { colores } = useTema();
  const styles = useMemo(() => crearEstilos(colores), [colores]);
  const [filtro, setFiltro] = useState('Todos');

  const categoriasVisibles =
    filtro === 'Todos' ? CATEGORIAS : CATEGORIAS.filter((c) => c === filtro);

  return (
    <Pantalla titulo="Mis instrumentos" activo={3}>
      {/* Filtros */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 8 }}
        contentContainerStyle={{ gap: 8 }}
      >
        {['Todos', ...CATEGORIAS].map((cat) => {
          const activo = filtro === cat;
          return (
            <Pressable key={cat} onPress={() => setFiltro(cat)}>
              {activo ? (
                <GradientBox colores={[colores.azul, colores.naranja]} style={styles.chip}>
                  <Text style={[styles.chipTexto, { color: '#FFFFFF' }]}>{cat}</Text>
                </GradientBox>
              ) : (
                <View style={[styles.chip, styles.chipInactivo]}>
                  <Text style={styles.chipTexto}>{cat}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Secciones */}
      {categoriasVisibles.map((cat) => (
        <View key={cat}>
          <Text style={styles.seccion}>{cat}</Text>
          {INSTRUMENTOS.filter((i) => i.categoria === cat).map((inst) => (
            <FilaItem
              key={inst.id}
              izquierda={
                <GradientBox colores={inst.colores} style={styles.icono}>
                  <Ionicons name={ICONOS[inst.categoria]} size={20} color="#FFFFFF" />
                </GradientBox>
              }
              titulo={inst.nombre}
              detalle={inst.detalle}
              etiqueta={inst.principal ? <Badge texto="Principal" variante="naranja" /> : undefined}
              derecha={<Ionicons name="chevron-forward" size={18} color={colores.textoGris} />}
            />
          ))}
        </View>
      ))}

      {/* Agregar */}
      <Pressable style={styles.agregar} onPress={() => console.log('Agregar instrumento')}>
        <Ionicons name="add" size={18} color={colores.naranja} />
        <Text style={styles.agregarTexto}>Agregar instrumento</Text>
      </Pressable>
    </Pantalla>
  );
}

const crearEstilos = (c: Tema) =>
  StyleSheet.create({
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    chipInactivo: { backgroundColor: c.campo, borderWidth: 1, borderColor: c.borde },
    chipTexto: { fontSize: 12, fontWeight: '700', color: c.textoSuave },
    seccion: { fontSize: 12, fontWeight: '700', color: c.textoSuave, marginTop: 16, marginBottom: 4 },
    icono: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    agregar: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      marginTop: 20,
      paddingVertical: 14,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: c.linea,
      borderRadius: 12,
      backgroundColor: c.naranjaClaro,
    },
    agregarTexto: { color: c.naranja, fontWeight: '700', fontSize: 13 },
  });