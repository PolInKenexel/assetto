// src/app/inicio.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Badge from '../components/Badge';
import FilaItem from '../components/FilaItem';
import GradientBox from '../components/GradientBox';
import ModalResumen from '../components/ModalResumen';
import Pantalla from '../components/Pantalla';
import { Tema } from '../constants/theme';
import { useTema } from '../context/TemaContext';

const PALETA_PORTADAS: [string, string][] = [
  ['#2B5FB0', '#F0752A'],
  ['#142C57', '#E8973F'],
  ['#3A6FC4', '#F2A65A'],
];

function obtenerTonalidades(tonalidades: string | string[] | undefined): string[] {
  if (!tonalidades) return [];
  if (Array.isArray(tonalidades)) return tonalidades;
  try {
    const parsed = JSON.parse(tonalidades);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function obtenerEtiquetasCancion(cancion: any): string[] {
  const cats = cancion.categorias_texto
    ? cancion.categorias_texto.split('||').filter(Boolean)
    : [];
  const insts = cancion.instrumentos_texto
    ? cancion.instrumentos_texto.split('||').filter(Boolean)
    : [];
  return [...cats, ...insts];
}

export default function Inicio() {
  const router = useRouter();
  const { colores } = useTema();
  const styles = useMemo(() => crearEstilos(colores), [colores]);

  const [busqueda, setBusqueda] = useState('');
  const [canciones, setCanciones] = useState<any[]>([]);
  const [listas, setListas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  // Estados para el modal flotante
  const [cancionSeleccionada, setCancionSeleccionada] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  useFocusEffect(
    useCallback(() => {
      const obtenerDatos = async () => {
        try {
          const token = await AsyncStorage.getItem('userToken');
          if (!token) {
            router.replace('/');
            return;
          }

          const opcionesFetch = {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          };

          const [resCanciones, resListas] = await Promise.all([
            fetch(`${API_URL}/canciones`, opcionesFetch),
            fetch(`${API_URL}/listas`, opcionesFetch),
          ]);

          if (!resCanciones.ok || !resListas.ok) {
            if (resCanciones.status === 401 || resListas.status === 401) {
              router.replace('/');
            }
            return;
          }

          const dataCanciones = await resCanciones.json();
          const dataListas = await resListas.json();

          setCanciones(dataCanciones);
          setListas(dataListas);
        } catch (error) {
          console.error('Error al obtener los datos:', error);
        } finally {
          setCargando(false);
        }
      };

      obtenerDatos();
    }, [API_URL, router])
  );

  // Mantener referencia a useEffect por compatibilidad de recarga en caliente
  useEffect(() => {}, []);

  const textoBusqueda = busqueda.trim().toLowerCase();

  // Listas filtradas y limitadas a las 3 más recientes (para evitar que se aplasten en la fila)
  const listasMostradas = useMemo(() => {
    const filtradas =
      textoBusqueda === ''
        ? listas
        : listas.filter((l) => l.nombre?.toLowerCase().includes(textoBusqueda));

    return filtradas.slice(0, 3);
  }, [listas, textoBusqueda]);

  // Canciones ordenadas de la más reciente a la más antigua y filtradas por búsqueda
  const cancionesRecientes = useMemo(() => {
    const ordenadas = [...canciones].sort((a, b) => {
      const fechaA = a.fecha_creacion ? new Date(a.fecha_creacion).getTime() : 0;
      const fechaB = b.fecha_creacion ? new Date(b.fecha_creacion).getTime() : 0;
      if (fechaB !== fechaA) return fechaB - fechaA;
      return Number(b.id_cancion) - Number(a.id_cancion);
    });

    if (textoBusqueda === '') {
      return ordenadas.slice(0, 6);
    }

    return ordenadas.filter((c) => {
      const tonos = obtenerTonalidades(c.tonalidades);
      const etiquetas = obtenerEtiquetasCancion(c);
      return (
        c.nombre?.toLowerCase().includes(textoBusqueda) ||
        tonos.some((t) => t.toLowerCase().includes(textoBusqueda)) ||
        etiquetas.some((e) => e.toLowerCase().includes(textoBusqueda))
      );
    });
  }, [canciones, textoBusqueda]);

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
        {busqueda.length > 0 && (
          <TouchableOpacity onPress={() => setBusqueda('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colores.textoGris} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.seccionHeader}>
        <Text style={styles.seccion}>
          {textoBusqueda ? 'Listas que coinciden' : 'Listas recientes'}
        </Text>
        <Pressable onPress={() => router.replace('/mis-listas')}>
          <Text style={styles.verTodas}>Ver todas</Text>
        </Pressable>
      </View>

      <View style={styles.listasFila}>
        {cargando ? (
          <ActivityIndicator size="small" color={colores.azul} style={{ marginTop: 10 }} />
        ) : listasMostradas.length === 0 ? (
          <Text style={{ color: colores.textoGris, fontSize: 13, marginTop: 6 }}>
            {textoBusqueda
              ? 'Ninguna lista coincide con la búsqueda.'
              : 'No tienes listas creadas.'}
          </Text>
        ) : (
          listasMostradas.map((lista, index) => {
            const paleta = PALETA_PORTADAS[index % PALETA_PORTADAS.length];
            return (
              <Pressable
                key={lista.id_lista}
                style={styles.listaItemWrapper}
                onPress={() =>
                  router.push({ pathname: '/detalleLista', params: { id: lista.id_lista } })
                }
              >
                <GradientBox colores={paleta} style={styles.listaCard}>
                  <Text
                    numberOfLines={2}
                    style={{ color: '#FFF', fontWeight: '700', marginBottom: 4, fontSize: 12 }}
                  >
                    {lista.nombre}
                  </Text>
                  <Ionicons name="musical-notes-outline" size={15} color="rgba(255,255,255,0.88)" />
                </GradientBox>
              </Pressable>
            );
          })
        )}
      </View>

      <View style={[styles.seccionHeader, { marginTop: 24, marginBottom: 8 }]}>
        <Text style={styles.seccion}>
          {textoBusqueda ? 'Canciones que coinciden' : 'Canciones recientes'}
        </Text>
        <Pressable onPress={() => router.replace('/mis-canciones')}>
          <Text style={styles.verTodas}>Ver todas</Text>
        </Pressable>
      </View>

      {cargando ? (
        <ActivityIndicator size="large" color={colores.azul} style={{ marginTop: 20 }} />
      ) : cancionesRecientes.length === 0 ? (
        <Text style={{ color: colores.textoGris, textAlign: 'center', marginTop: 20 }}>
          {textoBusqueda
            ? 'Ninguna canción coincide con la búsqueda.'
            : 'No tienes canciones registradas.'}
        </Text>
      ) : (
        cancionesRecientes.map((c, index) => {
          const paleta = PALETA_PORTADAS[index % PALETA_PORTADAS.length];
          const tonos = obtenerTonalidades(c.tonalidades);
          const etiquetas = obtenerEtiquetasCancion(c);
          const detalleTexto = [
            c.tempo ? `${c.tempo} BPM` : 'Sin BPM',
            ...etiquetas,
          ].join(' · ');

          return (
            <TouchableOpacity
              key={c.id_cancion}
              activeOpacity={0.7}
              onPress={() => {
                setCancionSeleccionada(c);
                setModalVisible(true);
              }}
              onLongPress={() => {
                setCancionSeleccionada(c);
                setModalVisible(true);
              }}
            >
              <View pointerEvents="none">
                <FilaItem
                  izquierda={<GradientBox colores={paleta} style={styles.cancionImg} />}
                  titulo={c.nombre}
                  detalle={detalleTexto}
                  derecha={
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      {tonos.length > 0 ? (
                        tonos.map((tono) => <Badge key={tono} texto={tono} />)
                      ) : (
                        <Badge texto="-" />
                      )}
                    </View>
                  }
                  onPress={() => {}}
                />
              </View>
            </TouchableOpacity>
          );
        })
      )}

      {/* Modal de resumen al tocar o mantener presionada una canción */}
      <ModalResumen
        visible={modalVisible}
        cancion={cancionSeleccionada}
        onClose={() => setModalVisible(false)}
        onEliminada={(idEliminada) => {
          setCanciones((prev) => prev.filter((x) => x.id_cancion !== idEliminada));
        }}
      />
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
      borderRadius: 12,
      paddingHorizontal: 12,
      marginBottom: 24,
    },
    buscadorInput: { flex: 1, paddingVertical: 12, paddingLeft: 8, fontSize: 14, color: c.texto },
    seccionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    seccion: { fontSize: 13, fontWeight: '700', color: c.textoSuave },
    verTodas: { fontSize: 13, fontWeight: '700', color: c.azul },
    listasFila: { flexDirection: 'row', gap: 10 },
    listaItemWrapper: { width: '31%' },
    listaCard: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: 16,
      padding: 10,
      justifyContent: 'flex-end',
    },
    cancionImg: { width: 40, height: 40, borderRadius: 10 },
  });
