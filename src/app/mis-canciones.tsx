// src/app/mis-canciones.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BarraBusqueda,
  Campo,
  Chip,
  FilaFiltro,
  SeccionTitulo,
  Tonalidades,
  fuentes,
  useColores,
} from '../components/form';
import ModalResumen from '../components/ModalResumen';
import Pantalla from '../components/Pantalla';
import {
  CATEGORIAS,
  FILTROS_VACIOS,
  Filtros,
  INSTRUMENTOS,
  TONALIDADES,
  filtrarCanciones,
} from '../constants/cancionesDemo';

type NombreFiltro = 'categoria' | 'tonalidad' | 'bpm' | 'instrumento';

export default function MisCanciones() {
  const router = useRouter();
  const c = useColores();

  const [cancionesDB, setCancionesDB] = useState<any[]>([]);
  const [categoriasUsuario, setCategoriasUsuario] = useState<string[]>([]);
  const [instrumentosUsuario, setInstrumentosUsuario] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS);
  const [abierto, setAbierto] = useState<NombreFiltro | null>(null);

  // Modal de resumen / edición de canción
  const [cancionSeleccionada, setCancionSeleccionada] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  const obtenerDatos = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/');
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const [resCanciones, resCategorias] = await Promise.all([
        fetch(`${API_URL}/canciones`, { method: 'GET', headers }),
        fetch(`${API_URL}/categorias`, { method: 'GET', headers }),
      ]);

      if (resCanciones.status === 401 || resCategorias.status === 401) {
        router.replace('/');
        return;
      }

      if (resCategorias.ok) {
        const dataCats = await resCategorias.json();
        setCategoriasUsuario(
          dataCats.filter((cat: any) => cat.tipo !== 'instrumento').map((cat: any) => cat.nombre)
        );
        setInstrumentosUsuario(
          dataCats.filter((cat: any) => cat.tipo === 'instrumento').map((cat: any) => cat.nombre)
        );
      }

      if (resCanciones.ok) {
        const data = await resCanciones.json();

        const cancionesMapeadas = data.map((cancion: any) => {
          let tonosParseados: string[] = [];
          try {
            tonosParseados =
              typeof cancion.tonalidades === 'string'
                ? JSON.parse(cancion.tonalidades)
                : cancion.tonalidades || [];
          } catch {
            tonosParseados = [];
          }

          const categoriasParseadas = cancion.categorias_texto
            ? cancion.categorias_texto.split('||').filter(Boolean)
            : [];

          const instrumentosParseados = cancion.instrumentos_texto
            ? cancion.instrumentos_texto.split('||').filter(Boolean)
            : [];

          return {
            ...cancion,
            tonalidades: Array.isArray(tonosParseados) ? tonosParseados : [],
            categorias: categoriasParseadas,
            instrumentos: instrumentosParseados,
          };
        });

        setCancionesDB(cancionesMapeadas);
      }
    } catch (error) {
      console.error('Error al obtener canciones:', error);
    } finally {
      setCargando(false);
    }
  }, [API_URL]);

  useFocusEffect(
    useCallback(() => {
      obtenerDatos();
    }, [obtenerDatos])
  );

  // Construimos las opciones dinámicas de filtro combinando las canciones del usuario, la BD y las predeterminadas
  const opcionesCategorias = useMemo(() => {
    const set = new Set<string>();
    cancionesDB.forEach((x) => x.categorias?.forEach((cat: string) => set.add(cat)));
    categoriasUsuario.forEach((cat) => set.add(cat));
    if (set.size === 0) CATEGORIAS.forEach((cat) => set.add(cat));
    return Array.from(set).sort();
  }, [cancionesDB, categoriasUsuario]);

  const opcionesInstrumentos = useMemo(() => {
    const set = new Set<string>();
    cancionesDB.forEach((x) => x.instrumentos?.forEach((inst: string) => set.add(inst)));
    instrumentosUsuario.forEach((inst) => set.add(inst));
    INSTRUMENTOS.forEach((inst) => set.add(inst));
    return Array.from(set);
  }, [cancionesDB, instrumentosUsuario]);

  const opcionesTonalidades = useMemo(() => {
    const set = new Set<string>();
    cancionesDB.forEach((x) =>
      (Array.isArray(x.tonalidades) ? x.tonalidades : []).forEach((t: string) => set.add(t))
    );
    if (set.size === 0) TONALIDADES.forEach((t) => set.add(t));
    return Array.from(set);
  }, [cancionesDB]);

  const cambiar = (campo: keyof Filtros, valor: string) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  };

  const canciones = filtrarCanciones(cancionesDB, filtros);

  const hayBpm = filtros.bpmMin !== '' || filtros.bpmMax !== '';
  const textoBpm = `BPM: ${filtros.bpmMin || '…'}–${filtros.bpmMax || '…'}`;

  const hayFiltrosActivos =
    filtros.busqueda.trim() !== '' ||
    filtros.categoria !== '' ||
    filtros.tonalidad !== '' ||
    filtros.instrumento !== '' ||
    hayBpm;

  const alternarPanel = (nombre: NombreFiltro) => {
    setAbierto(abierto === nombre ? null : nombre);
  };

  const quitarBpm = () => {
    setFiltros((prev) => ({ ...prev, bpmMin: '', bpmMax: '' }));
  };

  const limpiarTodosLosFiltros = () => {
    setFiltros(FILTROS_VACIOS);
    setAbierto(null);
  };

  const colores = [
    ['#24509E', '#F0752A'],
    ['#142C57', '#E8973F'],
    ['#3A6FC4', '#F2A65A'],
  ];

  const fab = (
    <Pressable
      style={[styles.fab, { backgroundColor: c.naranja, shadowColor: c.naranja }]}
      onPress={() => router.push('/agregar-cancion')}
    >
      <Ionicons name="add" size={28} color="#FFFFFF" />
    </Pressable>
  );

  return (
    <Pantalla titulo="Mis canciones" activo={3} flotante={fab}>
      <BarraBusqueda
        value={filtros.busqueda}
        onChangeText={(t) => cambiar('busqueda', t)}
        placeholder="Buscar canción, categoría o instrumento"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
        style={{ marginBottom: 12 }}
      >
        <Chip
          texto={filtros.categoria ? `Categoría: ${filtros.categoria}` : 'Categoría'}
          activo={filtros.categoria !== ''}
          icono={filtros.categoria ? 'close' : 'chevron-down'}
          onPress={() =>
            filtros.categoria ? cambiar('categoria', '') : alternarPanel('categoria')
          }
        />
        <Chip
          texto={filtros.tonalidad ? `Tonalidad: ${filtros.tonalidad}` : 'Tonalidad'}
          activo={filtros.tonalidad !== ''}
          icono={filtros.tonalidad ? 'close' : 'chevron-down'}
          onPress={() =>
            filtros.tonalidad ? cambiar('tonalidad', '') : alternarPanel('tonalidad')
          }
        />
        <Chip
          texto={hayBpm ? textoBpm : 'BPM'}
          activo={hayBpm}
          icono={hayBpm ? 'close' : 'chevron-down'}
          onPress={() => (hayBpm ? quitarBpm() : alternarPanel('bpm'))}
        />
        <Chip
          texto={filtros.instrumento ? `Instrumento: ${filtros.instrumento}` : 'Instrumento'}
          activo={filtros.instrumento !== ''}
          icono={filtros.instrumento ? 'close' : 'chevron-down'}
          onPress={() =>
            filtros.instrumento ? cambiar('instrumento', '') : alternarPanel('instrumento')
          }
        />
      </ScrollView>

      {abierto === 'categoria' && (
        <FilaFiltro
          titulo="Categoría"
          opciones={opcionesCategorias}
          valor={filtros.categoria}
          onChange={(v) => {
            cambiar('categoria', v);
            setAbierto(null);
          }}
        />
      )}
      {abierto === 'tonalidad' && (
        <FilaFiltro
          titulo="Tonalidad"
          opciones={opcionesTonalidades}
          valor={filtros.tonalidad}
          onChange={(v) => {
            cambiar('tonalidad', v);
            setAbierto(null);
          }}
        />
      )}
      {abierto === 'instrumento' && (
        <FilaFiltro
          titulo="Instrumento"
          opciones={opcionesInstrumentos}
          valor={filtros.instrumento}
          onChange={(v) => {
            cambiar('instrumento', v);
            setAbierto(null);
          }}
        />
      )}
      {abierto === 'bpm' && (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Campo
              etiqueta="BPM mínimo"
              value={filtros.bpmMin}
              onChangeText={(t) => cambiar('bpmMin', t)}
              placeholder="90"
              teclado="numeric"
              maxLength={5}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Campo
              etiqueta="BPM máximo"
              value={filtros.bpmMax}
              onChangeText={(t) => cambiar('bpmMax', t)}
              placeholder="120"
              teclado="numeric"
              maxLength={5}
            />
          </View>
        </View>
      )}

      {cargando ? (
        <ActivityIndicator size="large" color={c.azul} style={{ marginTop: 40 }} />
      ) : (
        <>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <SeccionTitulo
              texto={`${canciones.length} ${canciones.length === 1 ? 'canción' : 'canciones'}`}
            />
            {hayFiltrosActivos && (
              <TouchableOpacity onPress={limpiarTodosLosFiltros} style={{ marginBottom: 10 }}>
                <Text
                  style={{
                    fontFamily: fuentes.negrita,
                    fontWeight: '700',
                    fontSize: 11.5,
                    color: c.azul,
                  }}
                >
                  Limpiar filtros
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {cancionesDB.length === 0 ? (
            <View style={styles.vacioCaja}>
              <Text style={{ fontFamily: fuentes.normal, fontSize: 13, color: c.textoTenue, textAlign: 'center', marginBottom: 14 }}>
                Aún no tienes canciones registradas en tu repertorio.
              </Text>
              <TouchableOpacity
                style={[styles.botonAccion, { backgroundColor: c.azul }]}
                onPress={() => router.push('/agregar-cancion')}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.botonAccionTexto}>Agregar primera canción</Text>
              </TouchableOpacity>
            </View>
          ) : canciones.length === 0 ? (
            <View style={styles.vacioCaja}>
              <Text style={{ fontFamily: fuentes.normal, fontSize: 13, color: c.textoTenue, textAlign: 'center', marginBottom: 12 }}>
                Ninguna canción coincide con los filtros seleccionados.
              </Text>
              <TouchableOpacity
                style={[styles.botonAccion, { backgroundColor: c.azul }]}
                onPress={limpiarTodosLosFiltros}
              >
                <Text style={styles.botonAccionTexto}>Quitar filtros</Text>
              </TouchableOpacity>
            </View>
          ) : (
            canciones.map((cancion, i) => {
              const etiquetasExtra = [
                ...(cancion.categorias || []),
                ...(cancion.instrumentos || []),
              ];

              return (
                <TouchableOpacity
                  key={cancion.id_cancion}
                  activeOpacity={0.7}
                  onPress={() => {
                    setCancionSeleccionada(cancion);
                    setModalVisible(true);
                  }}
                  onLongPress={() => {
                    setCancionSeleccionada(cancion);
                    setModalVisible(true);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: c.linea,
                  }}
                >
                  <LinearGradient
                    colors={colores[i % colores.length] as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="musical-note" size={16} color="rgba(255,255,255,0.85)" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: fuentes.negrita,
                        fontWeight: '700',
                        fontSize: 13.5,
                        color: c.texto,
                      }}
                    >
                      {cancion.nombre}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: fuentes.normal,
                        fontSize: 11.5,
                        color: c.textoTenue,
                        marginTop: 2,
                      }}
                    >
                      {cancion.tempo ? `${cancion.tempo} BPM` : 'Sin BPM'}
                      {etiquetasExtra.length > 0 ? ` · ${etiquetasExtra.join(' · ')}` : ''}
                    </Text>
                  </View>
                  <Tonalidades
                    lista={Array.isArray(cancion.tonalidades) ? cancion.tonalidades : []}
                  />
                </TouchableOpacity>
              );
            })
          )}
        </>
      )}

      <ModalResumen
        visible={modalVisible}
        cancion={cancionSeleccionada}
        onClose={() => setModalVisible(false)}
        onEliminada={(idEliminada) => {
          setCancionesDB((prev) => prev.filter((x) => x.id_cancion !== idEliminada));
        }}
      />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  vacioCaja: {
    alignItems: 'center',
    marginTop: 28,
    paddingHorizontal: 20,
  },
  botonAccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  botonAccionTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12.5,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
});
