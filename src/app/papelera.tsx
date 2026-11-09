// src/app/papelera.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import FilaItem from '../components/FilaItem';
import GradientBox from '../components/GradientBox';
import Pantalla from '../components/Pantalla';
import { Tema } from '../constants/theme';
import { useTema } from '../context/TemaContext';
import { useSeleccion } from '../hooks/useSeleccion';

export default function Papelera() {
  const router = useRouter();
  const { colores } = useTema();
  const styles = useMemo(() => crearEstilos(colores), [colores]);
  const listas = useSeleccion();
  const canciones = useSeleccion();

  const [listasDB, setListasDB] = useState<any[]>([]);
  const [cancionesDB, setCancionesDB] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    const obtenerPapelera = async () => {
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
          fetch(`${API_URL}/canciones/papelera`, opcionesFetch),
          fetch(`${API_URL}/listas/papelera`, opcionesFetch)
        ]);

        if (!resCanciones.ok || !resListas.ok) {
          if (resCanciones.status === 401 || resListas.status === 401) router.replace('/');
          return;
        }

        const dataCanciones = await resCanciones.json();
        const dataListas = await resListas.json();

        setCancionesDB(dataCanciones);
        setListasDB(dataListas);
      } catch (error) {
        console.error('Error al obtener la papelera:', error);
      } finally {
        setCargando(false);
      }
    };

    obtenerPapelera();
  }, []);

  const calcularDiasEliminado = (fechaEliminacion: string) => {
    const fecha = new Date(fechaEliminacion);
    const ahora = new Date();
    const diferenciaMillis = ahora.getTime() - fecha.getTime();
    const dias = Math.floor(diferenciaMillis / (1000 * 60 * 60 * 24));
    return dias === 0 ? 'hoy' : `hace ${dias} día${dias > 1 ? 's' : ''}`;
  };

  const paletaColores = [
    ['#3A5BA9', '#E8793A'],
    ['#1F2F55', '#E8A23A'],
    ['#3F6FC0', '#F0B070']
  ];

  return (
    <Pantalla titulo="Papelera" activo={4}>
      {cargando ? (
        <ActivityIndicator size="large" color={colores.azul} style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* Listas */}
          <Text style={styles.seccion}>Listas</Text>
          {listasDB.length === 0 ? (
            <Text style={{ color: colores.textoGris, fontSize: 13, marginBottom: 10 }}>No hay listas eliminadas.</Text>
          ) : (
            <View style={styles.listasFila}>
              {listasDB.map((lista, index) => {
                const marcada = listas.estaSeleccionado(lista.id_lista);
                const coloresLista = paletaColores[index % paletaColores.length] as [string, string];
                return (
                  <Pressable
                    key={lista.id_lista}
                    style={{ flex: 1 }}
                    onPress={() => listas.alternar(lista.id_lista)}
                  >
                    <GradientBox colores={coloresLista} style={styles.listaCard}>
                      <View style={[styles.check, marcada && styles.checkMarcado]}>
                        {marcada && <Ionicons name="checkmark" size={12} color={colores.naranja} />}
                      </View>
                      <Text style={styles.listaNombre}>{lista.nombre}</Text>
                      {/* Por ahora mostramos cuándo fue eliminada en lugar del conteo de canciones */}
                      <Text style={styles.listaCanciones}>eliminada {calcularDiasEliminado(lista.fecha_eliminacion)}</Text>
                    </GradientBox>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Canciones */}
          <Text style={[styles.seccion, { marginTop: 24 }]}>Canciones</Text>
          {cancionesDB.length === 0 ? (
            <Text style={{ color: colores.textoGris, fontSize: 13 }}>No hay canciones eliminadas.</Text>
          ) : (
            cancionesDB.map((c, index) => {
              const marcada = canciones.estaSeleccionado(c.id_cancion);
              const coloresCancion = paletaColores[index % paletaColores.length] as [string, string];
              return (
                <FilaItem
                  key={c.id_cancion}
                  izquierda={<GradientBox colores={coloresCancion} style={styles.cancionImg} />}
                  titulo={c.nombre}
                  detalle={`eliminada ${calcularDiasEliminado(c.fecha_eliminacion)}`}
                  onPress={() => canciones.alternar(c.id_cancion)}
                  derecha={
                    <View style={[styles.circulo, marcada && styles.circuloMarcado]}>
                      {marcada && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                    </View>
                  }
                />
              );
            })
          )}

          <Text style={styles.nota}>
            Los elementos se eliminarán permanentemente después de 30 días.
          </Text>
        </>
      )}
    </Pantalla>
  );
}

const crearEstilos = (c: Tema) =>
  StyleSheet.create({
    seccion: { fontSize: 13, fontWeight: '700', color: c.textoSuave, marginBottom: 10 },
    listasFila: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    listaCard: {
      aspectRatio: 1,
      minWidth: 100, // Ayuda si solo hay 1 lista
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