// src/app/papelera.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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
  const [procesando, setProcesando] = useState(false);

  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  const obtenerPapelera = useCallback(async () => {
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
        fetch(`${API_URL}/canciones/papelera`, opcionesFetch),
        fetch(`${API_URL}/listas/papelera`, opcionesFetch),
      ]);

      if (resCanciones.status === 401 || resListas.status === 401) {
        router.replace('/');
        return;
      }

      if (resCanciones.ok) {
        setCancionesDB(await resCanciones.json());
      }
      if (resListas.ok) {
        setListasDB(await resListas.json());
      }
    } catch (error) {
      console.error('Error al obtener la papelera:', error);
    } finally {
      setCargando(false);
    }
  }, [API_URL, router]);

  useFocusEffect(
    useCallback(() => {
      listas.limpiar();
      canciones.limpiar();
      obtenerPapelera();
    }, [obtenerPapelera])
  );

  const calcularDiasEliminado = (fechaEliminacion: string) => {
    const fecha = new Date(fechaEliminacion);
    const ahora = new Date();
    const diferenciaMillis = ahora.getTime() - fecha.getTime();
    const dias = Math.max(0, Math.floor(diferenciaMillis / (1000 * 60 * 60 * 24)));
    return dias === 0 ? 'hoy' : `hace ${dias} día${dias > 1 ? 's' : ''}`;
  };

  const totalSeleccionados = listas.seleccion.length + canciones.seleccion.length;

  const restaurarSeleccionados = async () => {
    if (totalSeleccionados === 0) return;
    setProcesando(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/');
        return;
      }

      // Agregamos Content-Type por seguridad con las peticiones POST
      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      await Promise.all([
        ...listas.seleccion.map((id) =>
          // Cambiamos a POST y a la ruta /restore
          fetch(`${API_URL}/listas/${id}/restore`, { method: 'POST', headers })
        ),
        ...canciones.seleccion.map((id) =>
          // Cambiamos a POST y a la ruta /restore
          fetch(`${API_URL}/canciones/${id}/restore`, { method: 'POST', headers })
        ),
      ]);

      listas.limpiar();
      canciones.limpiar();
      await obtenerPapelera();
    } catch {
      Alert.alert('Error de red', 'No se pudieron restaurar algunos elementos.');
    } finally {
      setProcesando(false);
    }
  };

  const confirmarEliminarPermanente = () => {
    if (totalSeleccionados === 0) return;
    Alert.alert(
      'Eliminar definitivamente',
      `¿Seguro que quieres eliminar permanentemente ${totalSeleccionados} elemento(s)? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setProcesando(true);
            try {
              const token = await AsyncStorage.getItem('userToken');
              if (!token) {
                router.replace('/');
                return;
              }

              const headers = { Authorization: `Bearer ${token}` };

              await Promise.all([
                ...listas.seleccion.map((id) =>
                  fetch(`${API_URL}/listas/${id}/permanente`, { method: 'DELETE', headers })
                ),
                ...canciones.seleccion.map((id) =>
                  fetch(`${API_URL}/canciones/${id}/permanente`, { method: 'DELETE', headers })
                ),
              ]);

              listas.limpiar();
              canciones.limpiar();
              await obtenerPapelera();
            } catch {
              Alert.alert('Error de red', 'No se pudieron eliminar algunos elementos.');
            } finally {
              setProcesando(false);
            }
          },
        },
      ]
    );
  };

  const paletaColores = [
    ['#3A5BA9', '#E8793A'],
    ['#1F2F55', '#E8A23A'],
    ['#3F6FC0', '#F0B070'],
  ];

  return (
    <Pantalla titulo="Papelera" activo={4}>
      {cargando ? (
        <ActivityIndicator size="large" color={colores.azul} style={{ marginTop: 40 }} />
      ) : (
        <>
          {totalSeleccionados > 0 && (
            <View style={styles.barraAcciones}>
              <Text style={styles.seleccionTexto}>
                {totalSeleccionados} seleccionado{totalSeleccionados > 1 ? 's' : ''}
              </Text>
              {procesando ? (
                <ActivityIndicator size="small" color={colores.azul} />
              ) : (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.botonAccion, { backgroundColor: colores.azul }]}
                    onPress={restaurarSeleccionados}
                  >
                    <Ionicons name="refresh" size={14} color="#FFFFFF" />
                    <Text style={styles.botonAccionTexto}>Restaurar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.botonAccion, { backgroundColor: colores.naranja }]}
                    onPress={confirmarEliminarPermanente}
                  >
                    <Ionicons name="trash-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.botonAccionTexto}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Listas */}
          <Text style={styles.seccion}>Listas</Text>
          {listasDB.length === 0 ? (
            <Text style={{ color: colores.textoGris, fontSize: 13, marginBottom: 10 }}>
              No hay listas eliminadas.
            </Text>
          ) : (
            <View style={styles.listasFila}>
              {listasDB.map((lista, index) => {
                const marcada = listas.estaSeleccionado(lista.id_lista);
                const coloresLista = paletaColores[index % paletaColores.length] as [
                  string,
                  string,
                ];
                return (
                  <Pressable
                    key={lista.id_lista}
                    style={{ flex: 1 }}
                    onPress={() => listas.alternar(lista.id_lista)}
                  >
                    <GradientBox colores={coloresLista} style={styles.listaCard}>
                      <View style={[styles.check, marcada && styles.checkMarcado]}>
                        {marcada && (
                          <Ionicons name="checkmark" size={12} color={colores.naranja} />
                        )}
                      </View>
                      <Text style={styles.listaNombre}>{lista.nombre}</Text>
                      <Text style={styles.listaCanciones}>
                        eliminada {calcularDiasEliminado(lista.fecha_eliminacion)}
                      </Text>
                    </GradientBox>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Canciones */}
          <Text style={[styles.seccion, { marginTop: 24 }]}>Canciones</Text>
          {cancionesDB.length === 0 ? (
            <Text style={{ color: colores.textoGris, fontSize: 13 }}>
              No hay canciones eliminadas.
            </Text>
          ) : (
            cancionesDB.map((c, index) => {
              const marcada = canciones.estaSeleccionado(c.id_cancion);
              const coloresCancion = paletaColores[index % paletaColores.length] as [
                string,
                string,
              ];
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
    barraAcciones: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: c.campo,
      borderWidth: 1,
      borderColor: c.borde,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 16,
    },
    seleccionTexto: {
      fontSize: 13,
      fontWeight: '700',
      color: c.texto,
    },
    botonAccion: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 9,
    },
    botonAccionTexto: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    seccion: { fontSize: 13, fontWeight: '700', color: c.textoSuave, marginBottom: 10 },
    listasFila: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    listaCard: {
      aspectRatio: 1,
      minWidth: 100,
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
