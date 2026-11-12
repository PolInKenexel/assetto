// src/app/inicio.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, TouchableOpacity } from 'react-native';
import Badge from '../components/Badge';
import FilaItem from '../components/FilaItem';
import GradientBox from '../components/GradientBox';
import Pantalla from '../components/Pantalla';
import { Tema } from '../constants/theme';
import { useTema } from '../context/TemaContext';
import ModalResumen from '../components/ModalResumen';

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

  useEffect(() => {
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
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };

        const [resCanciones, resListas] = await Promise.all([
          fetch(`${API_URL}/canciones`, opcionesFetch),
          fetch(`${API_URL}/listas`, opcionesFetch)
        ]);

        if (!resCanciones.ok || !resListas.ok) {
          if (resCanciones.status === 401 || resListas.status === 401) router.replace('/');
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
  }, []);

  const obtenerTonoPrincipal = (tonalidades: string | string[]) => {
    try {
      const tonos = typeof tonalidades === 'string' ? JSON.parse(tonalidades) : tonalidades;
      return tonos && tonos.length > 0 ? tonos[0] : '-';
    } catch (e) {
      return '-';
    }
  };

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
        <Pressable onPress={() => router.replace('/mis-listas')}>
          <Text style={styles.verTodas}>Ver todas</Text>
        </Pressable>
      </View>
      <View style={styles.listasFila}>
        {cargando ? (
          <ActivityIndicator size="small" color={colores.azul} style={{ marginTop: 10 }} />
        ) : listas.length === 0 ? (
          <Text style={{ color: colores.textoGris, fontSize: 13, marginTop: 10 }}>
            No tienes listas creadas.
          </Text>
        ) : (
          listas.map((lista) => (
            <Pressable
              key={lista.id_lista}
              style={{ flex: 1 }}
              onPress={() => router.replace('/mis-listas')}
            >
              <GradientBox colores={['#24509E', '#C4571A']} style={styles.listaCard}>
                <Text style={{ color: '#FFF', fontWeight: 'bold', marginBottom: 4, fontSize: 12 }}>
                  {lista.nombre}
                </Text>
                <Ionicons name="musical-notes-outline" size={16} color="#FFFFFF" />
              </GradientBox>
            </Pressable>
          ))
        )}
      </View>

      <Text style={[styles.seccion, { marginTop: 24, marginBottom: 8 }]}>Canciones recientes</Text>

      {cargando ? (
        <ActivityIndicator size="large" color={colores.azul} style={{ marginTop: 20 }} />
      ) : canciones.length === 0 ? (
        <Text style={{ color: colores.textoGris, textAlign: 'center', marginTop: 20 }}>
          No tienes canciones registradas.
        </Text>
      ) : (
        canciones.map((c) => (
          <TouchableOpacity
            key={c.id_cancion}
            activeOpacity={0.7}
            onLongPress={() => {
              setCancionSeleccionada(c);
              setModalVisible(true);
            }}
          >
            {/* Si FilaItem intercepta los toques normales, le pasamos también el onPress normal ahí */}
            <View pointerEvents="none">
              <FilaItem
                izquierda={<GradientBox colores={['#24509E', '#C4571A']} style={styles.cancionImg} />}
                titulo={c.nombre}
                detalle={`${c.tempo ? c.tempo + ' BPM' : 'Sin tempo registrado'}`}
                derecha={<Badge texto={obtenerTonoPrincipal(c.tonalidades)} />}
                onPress={() => {}} // Lo anulamos porque el TouchableOpacity padre lo maneja
              />
            </View>
          </TouchableOpacity>
        ))
      )}

      {/* Renderizamos el modal al final */}
      <ModalResumen 
        visible={modalVisible} 
        cancion={cancionSeleccionada} 
        onClose={() => setModalVisible(false)} 
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