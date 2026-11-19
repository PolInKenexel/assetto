// src/app/detalleLista.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  GestureResponderEvent,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomNav from '../components/BottomNav';
import Fondo from '../components/Fondo';
import { LineaCurly } from '../components/Header';
import ModalResumen from '../components/ModalResumen';
import { Tema } from '../constants/theme';
import { useTema } from '../context/TemaContext';

const LETRAS_GRUPOS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
] as const;

interface CancionLista {
  id_cancion: number;
  nombre: string;
  tempo: number | null;
  tonalidades: string | string[];
  posicion: number;
  grupo: string | null;
  categorias_texto?: string | null;
  instrumentos_texto?: string | null;
}

interface Rectangulo {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface NodoMedible {
  measureInWindow: (
    callback: (x: number, y: number, width: number, height: number) => void
  ) => void;
}

function parsearTonalidades(tonalidades: string | string[] | undefined): string[] {
  if (!tonalidades) return [];
  if (Array.isArray(tonalidades)) return tonalidades;
  try {
    const parsed = JSON.parse(tonalidades);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parsearEtiquetas(texto?: string | null): string[] {
  if (!texto) return [];
  return texto.split('||').filter(Boolean);
}

// Icono de 6 puntos (drag handle) igual al del Mockup 4b
function IconoArrastre({ color }: { color: string }) {
  const punto = {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: color,
  };
  return (
    <View style={{ width: 14, height: 16, justifyContent: 'space-between', paddingVertical: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 }}>
        <View style={punto} />
        <View style={punto} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 }}>
        <View style={punto} />
        <View style={punto} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 }}>
        <View style={punto} />
        <View style={punto} />
      </View>
    </View>
  );
}

// Fila individual de canción con soporte de arrastre (drag & drop)
function FilaCancionDraggable({
  cancion,
  posicion,
  c,
  vistaAgrupada,
  estaArrastrandose,
  esDestinoOrden,
  onRegistrarRef,
  onIniciarArrastre,
  onMoverArrastre,
  onSoltarArrastre,
  onPressCancion,
}: {
  cancion: CancionLista;
  posicion: number;
  c: Tema;
  vistaAgrupada: boolean;
  estaArrastrandose: boolean;
  esDestinoOrden: boolean;
  onRegistrarRef: (idCancion: number, ref: NodoMedible | null) => void;
  onIniciarArrastre: (cancion: CancionLista, pageX: number, pageY: number) => void;
  onMoverArrastre: (pageX: number, pageY: number, dx: number, dy: number) => void;
  onSoltarArrastre: () => void;
  onPressCancion: (cancion: CancionLista) => void;
}) {
  const styles = useMemo(() => crearEstilosFila(c), [c]);
  const tonos = useMemo(() => parsearTonalidades(cancion.tonalidades), [cancion.tonalidades]);
  const categorias = useMemo(
    () => parsearEtiquetas(cancion.categorias_texto),
    [cancion.categorias_texto]
  );
  const instrumentos = useMemo(
    () => parsearEtiquetas(cancion.instrumentos_texto),
    [cancion.instrumentos_texto]
  );

  const indiceGrupo = cancion.grupo
    ? LETRAS_GRUPOS.indexOf(cancion.grupo as (typeof LETRAS_GRUPOS)[number])
    : -1;
  const esGrupoPar = indiceGrupo >= 0 && indiceGrupo % 2 === 1;

  const detallePartes = [
    cancion.tempo ? `${cancion.tempo} BPM` : 'Sin BPM',
    ...categorias,
    ...instrumentos,
  ];

  const inicioTouchRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const arrastrandoLocalRef = useRef(false);
  const timerLongPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const limpiarTimer = () => {
    if (timerLongPressRef.current) {
      clearTimeout(timerLongPressRef.current);
      timerLongPressRef.current = null;
    }
  };

  // Arrastre inmediato desde el ícono de 6 puntos
  const alIniciarHandle = (evt: GestureResponderEvent) => {
    const { pageX, pageY } = evt.nativeEvent;
    inicioTouchRef.current = { x: pageX, y: pageY };
    arrastrandoLocalRef.current = true;
    onIniciarArrastre(cancion, pageX, pageY);
  };

  const alMoverHandle = (evt: GestureResponderEvent) => {
    if (!arrastrandoLocalRef.current) return;
    const { pageX, pageY } = evt.nativeEvent;
    onMoverArrastre(
      pageX,
      pageY,
      pageX - inicioTouchRef.current.x,
      pageY - inicioTouchRef.current.y
    );
  };

  const alSoltarHandle = () => {
    if (arrastrandoLocalRef.current) {
      arrastrandoLocalRef.current = false;
      onSoltarArrastre();
    }
  };

  // Arrastre manteniendo presionada la fila (~180ms) o toque corto para abrir resumen
  const alIniciarFila = (evt: GestureResponderEvent) => {
    const { pageX, pageY } = evt.nativeEvent;
    inicioTouchRef.current = { x: pageX, y: pageY };
    limpiarTimer();
    timerLongPressRef.current = setTimeout(() => {
      arrastrandoLocalRef.current = true;
      onIniciarArrastre(cancion, pageX, pageY);
    }, 180);
  };

  const alMoverFila = (evt: GestureResponderEvent) => {
    const { pageX, pageY } = evt.nativeEvent;
    const dx = pageX - inicioTouchRef.current.x;
    const dy = pageY - inicioTouchRef.current.y;

    if (!arrastrandoLocalRef.current) {
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        limpiarTimer();
      }
      return;
    }

    onMoverArrastre(pageX, pageY, dx, dy);
  };

  const alSoltarFila = (evt: GestureResponderEvent) => {
    limpiarTimer();
    const { pageX, pageY } = evt.nativeEvent;
    const dx = pageX - inicioTouchRef.current.x;
    const dy = pageY - inicioTouchRef.current.y;

    if (arrastrandoLocalRef.current) {
      arrastrandoLocalRef.current = false;
      onSoltarArrastre();
    } else if (Math.abs(dx) < 6 && Math.abs(dy) < 6) {
      onPressCancion(cancion);
    }
  };

  const alCancelarFila = () => {
    limpiarTimer();
    if (arrastrandoLocalRef.current) {
      arrastrandoLocalRef.current = false;
      onSoltarArrastre();
    }
  };

  return (
    <View
      ref={(r) => onRegistrarRef(cancion.id_cancion, r as unknown as NodoMedible | null)}
      collapsable={false}
      style={[
        styles.container,
        estaArrastrandose && styles.filaFantasma,
        esDestinoOrden && styles.filaDestinoOrden,
      ]}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => arrastrandoLocalRef.current}
      onResponderTerminationRequest={() => !arrastrandoLocalRef.current}
      onResponderGrant={alIniciarFila}
      onResponderMove={alMoverFila}
      onResponderRelease={alSoltarFila}
      onResponderTerminate={alCancelarFila}
    >
      <View style={styles.numeroCirculo}>
        <Text style={styles.numeroTexto}>{posicion}</Text>
      </View>

      <View style={styles.meta}>
        <Text style={styles.titulo} numberOfLines={1}>
          {cancion.nombre}
        </Text>
        <Text style={styles.detalle} numberOfLines={1}>
          {detallePartes.join(' · ')}
        </Text>
      </View>

      <View style={styles.derechaColumna}>
        {tonos.length > 0 && (
          <View style={styles.tonosFila}>
            {tonos.map((t) => (
              <View key={t} style={styles.tonoBadge}>
                <Text style={styles.tonoTexto}>{t}</Text>
              </View>
            ))}
          </View>
        )}

        {!vistaAgrupada && cancion.grupo && (
          <View
            style={[
              styles.grupoTag,
              esGrupoPar && { backgroundColor: c.azulClaro },
            ]}
          >
            <Text
              style={[
                styles.grupoTagTexto,
                esGrupoPar && { color: c.azul },
              ]}
            >
              Grupo {cancion.grupo}
            </Text>
          </View>
        )}
      </View>

      {/* Handle de 6 puntos para arrastrar inmediatamente */}
      <View
        style={styles.dragHandle}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={alIniciarHandle}
        onResponderMove={alMoverHandle}
        onResponderRelease={alSoltarHandle}
        onResponderTerminate={alSoltarHandle}
      >
        <IconoArrastre color={c.textoGris} />
      </View>
    </View>
  );
}

export default function DetalleLista() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const idLista = Array.isArray(params.id) ? params.id[0] : params.id;

  const { colores } = useTema();
  const styles = useMemo(() => crearEstilos(colores), [colores]);

  const [lista, setLista] = useState<any>(null);
  const [canciones, setCanciones] = useState<CancionLista[]>([]);
  const [cargando, setCargando] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);

  // Alternar entre vista agrupada (Mockup 4b) y vista de lista compacta (Mockup 4c)
  const [vistaAgrupada, setVistaAgrupada] = useState(true);
  const [gruposCreadosSesion, setGruposCreadosSesion] = useState<string[]>([]);

  // Estado de arrastre (Drag & Drop)
  const [cancionArrastrada, setCancionArrastrada] = useState<CancionLista | null>(null);
  const [posicionArrastrada, setPosicionArrastrada] = useState<number>(1);
  const [desplazamiento, setDesplazamiento] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [rectInicialFila, setRectInicialFila] = useState<Rectangulo>({
    x: 20,
    y: 200,
    width: 320,
    height: 58,
  });
  const [zonaHover, setZonaHover] = useState<string | null>(null);
  const [cancionDestinoOrdenId, setCancionDestinoOrdenId] = useState<number | null>(null);

  const contenedorRef = useRef<NodoMedible | null>(null);
  const offsetContenedorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const filasRefs = useRef<Record<number, NodoMedible | null>>({});
  const zonasRefs = useRef<Record<string, NodoMedible | null>>({});
  const rectZonasRef = useRef<Record<string, Rectangulo>>({});
  const rectFilasRef = useRef<Record<number, Rectangulo>>({});

  const zonaHoverRef = useRef<string | null>(null);
  const cancionDestinoOrdenRef = useRef<number | null>(null);
  const cancionArrastradaRef = useRef<CancionLista | null>(null);

  // Modal de resumen de canción
  const [cancionResumen, setCancionResumen] = useState<CancionLista | null>(null);
  const [modalResumenVisible, setModalResumenVisible] = useState(false);

  // Modal de opciones de la lista (...)
  const [menuListaVisible, setMenuListaVisible] = useState(false);
  const [modalRenombrarVisible, setModalRenombrarVisible] = useState(false);
  const [nuevoNombreLista, setNuevoNombreLista] = useState('');

  // Modal para agregar canciones existentes a la lista
  const [modalAgregarCancionVisible, setModalAgregarCancionVisible] = useState(false);
  const [cancionesUsuario, setCancionesUsuario] = useState<any[]>([]);
  const [cargandoRepertorio, setCargandoRepertorio] = useState(false);

  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  const obtenerToken = useCallback(async (): Promise<string | null> => {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      router.replace('/');
      return null;
    }
    return token;
  }, [router]);

  const cargarDetalle = useCallback(async () => {
    if (!idLista) {
      router.back();
      return;
    }

    try {
      const token = await obtenerToken();
      if (!token) return;

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const [resLista, resCanciones] = await Promise.all([
        fetch(`${API_URL}/listas/${idLista}`, { method: 'GET', headers }),
        fetch(`${API_URL}/listas/${idLista}/canciones`, { method: 'GET', headers }),
      ]);

      if (resLista.status === 401 || resCanciones.status === 401) {
        router.replace('/');
        return;
      }

      if (!resLista.ok) {
        const resTodas = await fetch(`${API_URL}/listas`, { method: 'GET', headers });
        if (resTodas.ok) {
          const todas = await resTodas.json();
          const encontrada = todas.find((l: any) => String(l.id_lista) === String(idLista));
          if (encontrada) {
            setLista(encontrada);
            setNuevoNombreLista(encontrada.nombre);
          } else {
            Alert.alert('Error', 'La lista no existe o fue eliminada.');
            router.back();
            return;
          }
        }
      } else {
        const dataLista = await resLista.json();
        setLista(dataLista);
        setNuevoNombreLista(dataLista.nombre);
      }

      if (resCanciones.ok) {
        const dataCanciones = await resCanciones.json();
        setCanciones(dataCanciones);
      } else {
        setCanciones([]);
      }
    } catch (error) {
      console.error('Error al obtener detalle de lista:', error);
    } finally {
      setCargando(false);
    }
  }, [API_URL, idLista, obtenerToken, router]);

  useFocusEffect(
    useCallback(() => {
      cargarDetalle();
    }, [cargarDetalle])
  );

  // Grupos existentes en las canciones + grupos creados en la sesión
  const gruposActivos = useMemo(() => {
    const set = new Set<string>();
    canciones.forEach((c) => {
      if (c.grupo) set.add(c.grupo);
    });
    gruposCreadosSesion.forEach((g) => set.add(g));
    return Array.from(set).sort();
  }, [canciones, gruposCreadosSesion]);

  // Siguiente letra de grupo disponible (A..O)
  const siguienteGrupoDisponible = useMemo(() => {
    return LETRAS_GRUPOS.find((letra) => !gruposActivos.includes(letra)) ?? null;
  }, [gruposActivos]);

  // Registrar referencias de filas y zonas de soltar
  const registrarRefFila = useCallback((idCancion: number, ref: NodoMedible | null) => {
    filasRefs.current[idCancion] = ref;
  }, []);

  const registrarRefZona = useCallback((claveZona: string, ref: NodoMedible | null) => {
    zonasRefs.current[claveZona] = ref;
  }, []);

  // Medir coordenadas de todas las zonas de soltar y filas en pantalla
  const medirZonasYFilas = useCallback(() => {
    contenedorRef.current?.measureInWindow((cx, cy) => {
      offsetContenedorRef.current = { x: cx || 0, y: cy || 0 };
    });

    const nuevasZonas: Record<string, Rectangulo> = {};
    Object.entries(zonasRefs.current).forEach(([clave, nodo]) => {
      if (nodo) {
        nodo.measureInWindow((x, y, width, height) => {
          if (width > 0 && height > 0) {
            nuevasZonas[clave] = { x, y, width, height };
          }
        });
      }
    });
    rectZonasRef.current = nuevasZonas;

    const nuevasFilas: Record<number, Rectangulo> = {};
    Object.entries(filasRefs.current).forEach(([idStr, nodo]) => {
      if (nodo) {
        nodo.measureInWindow((x, y, width, height) => {
          if (width > 0 && height > 0) {
            nuevasFilas[Number(idStr)] = { x, y, width, height };
          }
        });
      }
    });
    rectFilasRef.current = nuevasFilas;
  }, []);

  // Iniciar arrastre de una canción
  const iniciarArrastre = useCallback(
    (cancion: CancionLista, pageX: number, pageY: number) => {
      const idx = canciones.findIndex((x) => x.id_cancion === cancion.id_cancion);
      setPosicionArrastrada(idx >= 0 ? idx + 1 : 1);
      setCancionArrastrada(cancion);
      cancionArrastradaRef.current = cancion;
      setZonaHover(null);
      zonaHoverRef.current = null;
      setCancionDestinoOrdenId(null);
      cancionDestinoOrdenRef.current = null;
      setDesplazamiento({ x: 0, y: 0 });

      contenedorRef.current?.measureInWindow((cx, cy) => {
        const offsetX = cx || 0;
        const offsetY = cy || 0;
        offsetContenedorRef.current = { x: offsetX, y: offsetY };

        const nodoFila = filasRefs.current[cancion.id_cancion];
        if (nodoFila) {
          nodoFila.measureInWindow((fx, fy, fw, fh) => {
            if (fw > 0 && fh > 0) {
              setRectInicialFila({
                x: fx - offsetX,
                y: fy - offsetY,
                width: fw,
                height: fh,
              });
            } else {
              setRectInicialFila({
                x: 20,
                y: pageY - offsetY - 28,
                width: 320,
                height: 58,
              });
            }
          });
        } else {
          setRectInicialFila({
            x: 20,
            y: pageY - offsetY - 28,
            width: 320,
            height: 58,
          });
        }
      });

      medirZonasYFilas();
      setTimeout(medirZonasYFilas, 60);
    },
    [canciones, medirZonasYFilas]
  );

  // Actualizar posición durante el arrastre y detectar sobre qué grupo o canción está el dedo
  const moverArrastre = useCallback(
    (pageX: number, pageY: number, dx: number, dy: number) => {
      setDesplazamiento({ x: dx, y: dy });

      let zonaDetectada: string | null = null;
      const zonas = rectZonasRef.current;

      for (const clave of ['NUEVO_GRUPO', 'QUITAR_GRUPO']) {
        const r = zonas[clave];
        if (
          r &&
          pageY >= r.y - 10 &&
          pageY <= r.y + r.height + 10 &&
          pageX >= r.x - 10 &&
          pageX <= r.x + r.width + 10
        ) {
          zonaDetectada = clave;
          break;
        }
      }

      if (!zonaDetectada) {
        for (const [clave, r] of Object.entries(zonas)) {
          if (clave === 'NUEVO_GRUPO' || clave === 'QUITAR_GRUPO') continue;
          if (
            pageY >= r.y - 8 &&
            pageY <= r.y + r.height + 8 &&
            pageX >= r.x - 10 &&
            pageX <= r.x + r.width + 10
          ) {
            zonaDetectada = clave;
            break;
          }
        }
      }

      if (zonaHoverRef.current !== zonaDetectada) {
        zonaHoverRef.current = zonaDetectada;
        setZonaHover(zonaDetectada);
      }

      let filaDetectada: number | null = null;
      const arrastradaId = cancionArrastradaRef.current?.id_cancion;

      for (const [idStr, r] of Object.entries(rectFilasRef.current)) {
        const idNum = Number(idStr);
        if (idNum === arrastradaId) continue;
        if (pageY >= r.y && pageY <= r.y + r.height) {
          filaDetectada = idNum;
          break;
        }
      }

      if (cancionDestinoOrdenRef.current !== filaDetectada) {
        cancionDestinoOrdenRef.current = filaDetectada;
        setCancionDestinoOrdenId(filaDetectada);
      }
    },
    []
  );

  // Guardar cambio de grupo y/o reordenamiento en el backend al soltar la canción
  const aplicarCambiosArrastre = useCallback(
    async (
      cancionMovida: CancionLista,
      nuevoGrupo: string | null,
      idCancionDestinoOrden: number | null
    ) => {
      const cambioGrupo = cancionMovida.grupo !== nuevoGrupo;
      const cambioOrden =
        idCancionDestinoOrden !== null && idCancionDestinoOrden !== cancionMovida.id_cancion;

      if (!cambioGrupo && !cambioOrden) return;

      const estadoPrevio = [...canciones];
      let nuevaListaCanciones = canciones.map((c) =>
        c.id_cancion === cancionMovida.id_cancion ? { ...c, grupo: nuevoGrupo } : c
      );

      if (cambioOrden && idCancionDestinoOrden !== null) {
        const idxOrigen = nuevaListaCanciones.findIndex(
          (c) => c.id_cancion === cancionMovida.id_cancion
        );
        const idxDestino = nuevaListaCanciones.findIndex(
          (c) => c.id_cancion === idCancionDestinoOrden
        );
        if (idxOrigen >= 0 && idxDestino >= 0) {
          const [item] = nuevaListaCanciones.splice(idxOrigen, 1);
          nuevaListaCanciones.splice(idxDestino, 0, item);
          nuevaListaCanciones = nuevaListaCanciones.map((c, i) => ({ ...c, posicion: i }));
        }
      }

      setCanciones(nuevaListaCanciones);

      try {
        setSincronizando(true);
        const token = await obtenerToken();
        if (!token) return;

        const headers = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        if (cambioGrupo) {
          const resGrupo = await fetch(
            `${API_URL}/listas/${idLista}/canciones/${cancionMovida.id_cancion}/grupo`,
            {
              method: 'PATCH',
              headers,
              body: JSON.stringify({ grupo: nuevoGrupo }),
            }
          );

          if (!resGrupo.ok) {
            setCanciones(estadoPrevio);
            const err = await resGrupo.json().catch(() => ({}));
            Alert.alert('Error', err.error || 'No se pudo asignar el grupo.');
            return;
          }
        }

        if (cambioOrden) {
          const resOrden = await fetch(`${API_URL}/listas/${idLista}/canciones/orden`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
              idsCanciones: nuevaListaCanciones.map((c) => c.id_cancion),
            }),
          });

          if (!resOrden.ok) {
            setCanciones(estadoPrevio);
            const err = await resOrden.json().catch(() => ({}));
            Alert.alert('Error', err.error || 'No se pudo reordenar la lista.');
            return;
          }
        }
      } catch (error) {
        console.error('Error al guardar cambios de arrastre:', error);
        setCanciones(estadoPrevio);
        Alert.alert('Error de red', 'No se pudo guardar el cambio en el servidor.');
      } finally {
        setSincronizando(false);
      }
    },
    [API_URL, canciones, idLista, obtenerToken]
  );

  // Soltar canción arrastrada
  const soltarArrastre = useCallback(() => {
    const cancionMovida = cancionArrastradaRef.current;
    const zona = zonaHoverRef.current;
    const destinoOrdenId = cancionDestinoOrdenRef.current;

    setCancionArrastrada(null);
    cancionArrastradaRef.current = null;
    setZonaHover(null);
    zonaHoverRef.current = null;
    setCancionDestinoOrdenId(null);
    cancionDestinoOrdenRef.current = null;

    if (!cancionMovida) return;

    let nuevoGrupo: string | null = cancionMovida.grupo;

    if (zona === 'NUEVO_GRUPO') {
      if (siguienteGrupoDisponible) {
        nuevoGrupo = siguienteGrupoDisponible;
        setVistaAgrupada(true);
      }
    } else if (zona === 'QUITAR_GRUPO') {
      nuevoGrupo = null;
    } else if (zona && zona.startsWith('GRUPO_')) {
      nuevoGrupo = zona.replace('GRUPO_', '');
    } else if (destinoOrdenId !== null) {
      const cancionDestino = canciones.find((x) => x.id_cancion === destinoOrdenId);
      if (cancionDestino) {
        nuevoGrupo = cancionDestino.grupo;
      }
    }

    aplicarCambiosArrastre(cancionMovida, nuevoGrupo, destinoOrdenId);
  }, [aplicarCambiosArrastre, canciones, siguienteGrupoDisponible]);

  // También permitir tocar "+ Arrastra aquí para crear el Grupo X" para añadir el contenedor vacío
  const crearContenedorGrupoAlTocar = () => {
    if (!siguienteGrupoDisponible) return;
    setGruposCreadosSesion((prev) =>
      prev.includes(siguienteGrupoDisponible) ? prev : [...prev, siguienteGrupoDisponible]
    );
    setVistaAgrupada(true);
  };

  // Abrir modal para agregar canciones del repertorio del usuario a la lista
  const abrirModalAgregarCanciones = async () => {
    setMenuListaVisible(false);
    setModalAgregarCancionVisible(true);
    setCargandoRepertorio(true);

    try {
      const token = await obtenerToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/canciones`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const todas = await res.json();
        setCancionesUsuario(todas);
      }
    } catch (error) {
      console.error('Error al cargar repertorio:', error);
    } finally {
      setCargandoRepertorio(false);
    }
  };

  const agregarCancionALista = async (idCancion: number) => {
    try {
      setSincronizando(true);
      const token = await obtenerToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/listas/${idLista}/canciones/${idCancion}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ incluida: true }),
      });
      
      if (res.ok) {
        // En lugar de usar el JSON de respuesta, recargamos toda la lista
        await cargarDetalle();
      } else {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Aviso', err.error || 'No se pudo agregar la canción.');
      }
    } catch (error) {
      console.error('Error al agregar canción a la lista:', error);
      Alert.alert('Error de red', 'No se pudo conectar con el servidor.');
    } finally {
      setSincronizando(false);
    }
  };

  // Renombrar lista
  const guardarNuevoNombreLista = async () => {
    const nombreLimpio = nuevoNombreLista.trim();
    if (!nombreLimpio) {
      Alert.alert('Falta el nombre', 'Escribe un nombre válido para la lista.');
      return;
    }

    try {
      setSincronizando(true);
      const token = await obtenerToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/listas/${idLista}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre: nombreLimpio }),
      });

      if (res.ok) {
        const actualizada = await res.json();
        setLista(actualizada);
        setModalRenombrarVisible(false);
      } else {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.error || 'No se pudo renombrar la lista.');
      }
    } catch (error) {
      console.error('Error al renombrar lista:', error);
      Alert.alert('Error de red', 'No se pudo conectar con el servidor.');
    } finally {
      setSincronizando(false);
    }
  };

  // Enviar lista a la papelera
  const confirmarEliminarLista = () => {
    setMenuListaVisible(false);
    Alert.alert(
      'Enviar a la papelera',
      `¿Quieres mover la lista "${lista?.nombre}" a la papelera?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Mover a papelera',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await obtenerToken();
              if (!token) return;

              const res = await fetch(`${API_URL}/listas/${idLista}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });

              if (res.ok) {
                router.replace('/mis-listas');
              } else {
                const err = await res.json().catch(() => ({}));
                Alert.alert('Error', err.error || 'No se pudo eliminar la lista.');
              }
            } catch (error) {
              console.error('Error al mover lista a papelera:', error);
              Alert.alert('Error de red', 'No se pudo conectar con el servidor.');
            }
          },
        },
      ]
    );
  };

  const cancionesDisponiblesParaAgregar = useMemo(() => {
    const idsEnLista = new Set(canciones.map((c) => Number(c.id_cancion)));
    return cancionesUsuario.filter((c) => !idsEnLista.has(Number(c.id_cancion)));
  }, [canciones, cancionesUsuario]);

  const mostrarBloquesDeGrupo =
    (vistaAgrupada && gruposActivos.length > 0) || cancionArrastrada !== null;
  const idCancionArrastrada: number | null = cancionArrastrada
    ? cancionArrastrada.id_cancion
    : null;

  return (
    <View
      ref={(r) => {
        contenedorRef.current = r as unknown as NodoMedible | null;
      }}
      collapsable={false}
      style={styles.container}
    >
      <Fondo />

      <ScrollView
        contentContainerStyle={styles.scroll}
        scrollEnabled={cancionArrastrada === null}
        onScrollEndDrag={medirZonasYFilas}
        onMomentumScrollEnd={medirZonasYFilas}
      >
        {/* Encabezado estilo Mockup 4b / 4c */}
        <View style={styles.header}>
          <View style={styles.headerIzquierda}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={18} color={colores.texto} />
            </Pressable>
            <Text style={styles.headerTitulo} numberOfLines={1}>
              {cargando ? 'Cargando...' : lista?.nombre || 'Detalle de lista'}
            </Text>
          </View>

          <Pressable style={styles.opcionesBtn} onPress={() => setMenuListaVisible(true)}>
            <Ionicons name="ellipsis-horizontal" size={18} color={colores.azul} />
          </Pressable>
        </View>

        <LineaCurly color={colores.azul} marginTop={8} marginBottom={16} />

        {cargando ? (
          <ActivityIndicator size="large" color={colores.azul} style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* Subtítulo: conteo real + "Mantén y arrastra" / "Editar grupos" */}
            <View style={styles.headerSecundario}>
              <Text style={styles.subtitulo}>
                {canciones.length} {canciones.length === 1 ? 'canción' : 'canciones'} ·{' '}
                {gruposActivos.length} {gruposActivos.length === 1 ? 'grupo' : 'grupos'}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {sincronizando && <ActivityIndicator size="small" color={colores.azul} />}
                {gruposActivos.length > 0 ? (
                  <TouchableOpacity onPress={() => setVistaAgrupada(!vistaAgrupada)}>
                    <Text style={styles.destaque}>
                      {vistaAgrupada ? 'Mantén y arrastra · Vista compacta' : 'Editar grupos'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.destaque}>Mantén y arrastra</Text>
                )}
              </View>
            </View>

            {canciones.length === 0 ? (
              <View style={styles.vacioCaja}>
                <Text style={styles.vacioTexto}>Esta lista aún no tiene canciones.</Text>
                <TouchableOpacity
                  style={styles.agregarPrimeraBtn}
                  onPress={abrirModalAgregarCanciones}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.agregarPrimeraTexto}>Agregar canciones</Text>
                </TouchableOpacity>
              </View>
            ) : mostrarBloquesDeGrupo ? (
              /* Vista con bloques de Grupo (Mockup 4b: "Detalle de lista · arrastrar para agrupar") */
              <>
                {gruposActivos.map((letraGrupo) => {
                  const claveZona = `GRUPO_${letraGrupo}`;
                  const esHover = zonaHover === claveZona;
                  const cancionesDeGrupo = canciones.filter((c) => c.grupo === letraGrupo);

                  return (
                    <View
                      key={letraGrupo}
                      ref={(r) => registrarRefZona(claveZona, r as unknown as NodoMedible | null)}
                      collapsable={false}
                      style={[
                        styles.bloqueGrupo,
                        (esHover || cancionArrastrada !== null) && styles.bloqueGrupoBordeado,
                        esHover && styles.bloqueGrupoHover,
                      ]}
                    >
                      <View style={styles.encabezadoGrupo}>
                        <Text style={styles.encabezadoGrupoTexto}>GRUPO {letraGrupo}</Text>
                        <View style={styles.encabezadoGrupoLinea} />
                        <Text style={styles.encabezadoGrupoConteo}>
                          {cancionesDeGrupo.length}
                        </Text>
                      </View>

                      {/* Banner "Soltar en el Grupo X" idéntico al Mockup 4b */}
                      {(esHover || cancionesDeGrupo.length === 0) && (
                        <View
                          style={[
                            styles.cajaSoltarGrupo,
                            esHover && styles.cajaSoltarGrupoActiva,
                          ]}
                        >
                          <Text style={styles.cajaSoltarGrupoTexto}>
                            {cancionArrastrada
                              ? `Soltar en el Grupo ${letraGrupo}`
                              : `Arrastra una canción aquí para el Grupo ${letraGrupo}`}
                          </Text>
                        </View>
                      )}

                      {cancionesDeGrupo.map((cancion) => {
                        const indexGlobal = canciones.findIndex(
                          (x) => x.id_cancion === cancion.id_cancion
                        );
                        return (
                          <FilaCancionDraggable
                            key={cancion.id_cancion}
                            cancion={cancion}
                            posicion={indexGlobal + 1}
                            c={colores}
                            vistaAgrupada={true}
                            estaArrastrandose={idCancionArrastrada === cancion.id_cancion}
                            esDestinoOrden={cancionDestinoOrdenId === cancion.id_cancion}
                            onRegistrarRef={registrarRefFila}
                            onIniciarArrastre={iniciarArrastre}
                            onMoverArrastre={moverArrastre}
                            onSoltarArrastre={soltarArrastre}
                            onPressCancion={(item) => {
                              setCancionResumen(item);
                              setModalResumenVisible(true);
                            }}
                          />
                        );
                      })}
                    </View>
                  );
                })}

                {/* Canciones sin grupo */}
                {canciones.some((c) => !c.grupo) && (
                  <View
                    ref={(r) => registrarRefZona('QUITAR_GRUPO', r as unknown as NodoMedible | null)}
                    collapsable={false}
                    style={[
                      styles.bloqueSinGrupo,
                      zonaHover === 'QUITAR_GRUPO' && styles.bloqueSinGrupoHover,
                    ]}
                  >
                    {gruposActivos.length > 0 && (
                      <View style={styles.encabezadoGrupo}>
                        <Text
                          style={[styles.encabezadoGrupoTexto, { color: colores.textoSuave }]}
                        >
                          SIN GRUPO
                        </Text>
                        <View style={styles.encabezadoGrupoLinea} />
                        <Text style={styles.encabezadoGrupoConteo}>
                          {canciones.filter((c) => !c.grupo).length}
                        </Text>
                      </View>
                    )}

                    {canciones
                      .filter((c) => !c.grupo)
                      .map((cancion) => {
                        const indexGlobal = canciones.findIndex(
                          (x) => x.id_cancion === cancion.id_cancion
                        );
                        return (
                          <FilaCancionDraggable
                            key={cancion.id_cancion}
                            cancion={cancion}
                            posicion={indexGlobal + 1}
                            c={colores}
                            vistaAgrupada={false}
                            estaArrastrandose={idCancionArrastrada === cancion.id_cancion}
                            esDestinoOrden={cancionDestinoOrdenId === cancion.id_cancion}
                            onRegistrarRef={registrarRefFila}
                            onIniciarArrastre={iniciarArrastre}
                            onMoverArrastre={moverArrastre}
                            onSoltarArrastre={soltarArrastre}
                            onPressCancion={(item) => {
                              setCancionResumen(item);
                              setModalResumenVisible(true);
                            }}
                          />
                        );
                      })}
                  </View>
                )}

                {/* Zona para soltar y quitar de grupo si todas las canciones actuales tienen grupo */}
                {cancionArrastrada?.grupo && !canciones.some((c) => !c.grupo) && (
                  <View
                    ref={(r) => registrarRefZona('QUITAR_GRUPO', r as unknown as NodoMedible | null)}
                    collapsable={false}
                    style={[
                      styles.zonaQuitarGrupo,
                      zonaHover === 'QUITAR_GRUPO' && styles.zonaQuitarGrupoActiva,
                    ]}
                  >
                    <Text style={styles.zonaQuitarGrupoTexto}>
                      Soltar aquí para dejar sin grupo
                    </Text>
                  </View>
                )}
              </>
            ) : (
              /* Vista compacta de lista con badges de Grupo A / Grupo B (Mockup 4c) */
              canciones.map((cancion, index) => (
                <FilaCancionDraggable
                  key={cancion.id_cancion}
                  cancion={cancion}
                  posicion={index + 1}
                  c={colores}
                  vistaAgrupada={false}
                  estaArrastrandose={idCancionArrastrada === cancion.id_cancion}
                  esDestinoOrden={cancionDestinoOrdenId === cancion.id_cancion}
                  onRegistrarRef={registrarRefFila}
                  onIniciarArrastre={iniciarArrastre}
                  onMoverArrastre={moverArrastre}
                  onSoltarArrastre={soltarArrastre}
                  onPressCancion={(item) => {
                    setCancionResumen(item);
                    setModalResumenVisible(true);
                  }}
                />
              ))
            )}

            {/* Zona de arrastre "+ Arrastra aquí para crear el Grupo X" (Mockup 4b) */}
            {siguienteGrupoDisponible && canciones.length > 0 && (
              <View
                ref={(r) => registrarRefZona('NUEVO_GRUPO', r as unknown as NodoMedible | null)}
                collapsable={false}
              >
                <Pressable
                  onPress={crearContenedorGrupoAlTocar}
                  style={[
                    styles.grupoBoton,
                    zonaHover === 'NUEVO_GRUPO' && styles.grupoBotonHover,
                  ]}
                >
                  <Text
                    style={[
                      styles.grupoBotonTexto,
                      zonaHover === 'NUEVO_GRUPO' && { fontSize: 13 },
                    ]}
                  >
                    {zonaHover === 'NUEVO_GRUPO'
                      ? `Soltar aquí para crear el Grupo ${siguienteGrupoDisponible}`
                      : `+ Arrastra aquí para crear el Grupo ${siguienteGrupoDisponible}`}
                  </Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Tarjeta flotante que sigue el dedo durante el arrastre (idéntica al Mockup 4b) */}
      {cancionArrastrada && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View
            style={[
              styles.tarjetaFlotante,
              {
                top: rectInicialFila.y,
                left: rectInicialFila.x,
                width: rectInicialFila.width,
                transform: [
                  { translateX: desplazamiento.x },
                  { translateY: desplazamiento.y },
                  { rotate: '-1.5deg' },
                  { scale: 1.03 },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={[colores.azul, colores.naranja]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.numeroCirculoActivo}
            >
              <Text style={styles.numeroTextoActivo}>{posicionArrastrada}</Text>
            </LinearGradient>

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{ fontSize: 13.5, fontWeight: '700', color: colores.texto }}
                numberOfLines={1}
              >
                {cancionArrastrada.nombre}
              </Text>
              <Text
                style={{ fontSize: 11.5, color: colores.textoGris, marginTop: 2 }}
                numberOfLines={1}
              >
                {cancionArrastrada.tempo ? `${cancionArrastrada.tempo} BPM` : 'Sin BPM'}
                {zonaHover === 'NUEVO_GRUPO' && siguienteGrupoDisponible
                  ? ` → Grupo ${siguienteGrupoDisponible}`
                  : zonaHover?.startsWith('GRUPO_')
                  ? ` → Grupo ${zonaHover.replace('GRUPO_', '')}`
                  : zonaHover === 'QUITAR_GRUPO'
                  ? ' → Sin grupo'
                  : ''}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 4 }}>
              {parsearTonalidades(cancionArrastrada.tonalidades).map((t) => (
                <View
                  key={t}
                  style={{
                    backgroundColor: colores.azulClaro,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 7,
                  }}
                >
                  <Text style={{ color: colores.azul, fontSize: 10.5, fontWeight: '800' }}>
                    {t}
                  </Text>
                </View>
              ))}
            </View>

            <IconoArrastre color={colores.naranja} />
          </View>
        </View>
      )}

      {/* Modal de resumen al tocar una canción */}
      <ModalResumen
        visible={modalResumenVisible}
        cancion={cancionResumen}
        onClose={() => setModalResumenVisible(false)}
        onEliminada={(idEliminada) => {
          setCanciones((prev) => prev.filter((x) => x.id_cancion !== idEliminada));
        }}
      />

      {/* Modal de opciones de la lista (...) */}
      <Modal
        visible={menuListaVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuListaVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setMenuListaVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitulo}>{lista?.nombre}</Text>

            <TouchableOpacity
              style={styles.opcionMenuFila}
              onPress={() => {
                setMenuListaVisible(false);
                setNuevoNombreLista(lista?.nombre || '');
                setModalRenombrarVisible(true);
              }}
            >
              <Ionicons name="pencil-outline" size={18} color={colores.texto} />
              <Text style={styles.opcionMenuTexto}>Cambiar nombre de la lista</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.opcionMenuFila}
              onPress={abrirModalAgregarCanciones}
            >
              <Ionicons name="add-circle-outline" size={18} color={colores.texto} />
              <Text style={styles.opcionMenuTexto}>Agregar canciones a la lista</Text>
            </TouchableOpacity>

            {gruposActivos.length > 0 && (
              <TouchableOpacity
                style={styles.opcionMenuFila}
                onPress={() => {
                  setMenuListaVisible(false);
                  setVistaAgrupada(!vistaAgrupada);
                }}
              >
                <Ionicons name="layers-outline" size={18} color={colores.texto} />
                <Text style={styles.opcionMenuTexto}>
                  {vistaAgrupada ? 'Ver como lista compacta' : 'Ver separada por grupos'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.opcionMenuFila, { borderBottomWidth: 0 }]}
              onPress={confirmarEliminarLista}
            >
              <Ionicons name="trash-outline" size={18} color={colores.naranja} />
              <Text style={[styles.opcionMenuTexto, { color: colores.naranja }]}>
                Enviar lista a la papelera
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal para renombrar la lista */}
      <Modal
        visible={modalRenombrarVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalRenombrarVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalRenombrarVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitulo}>Renombrar lista</Text>
            <TextInput
              style={styles.inputNombre}
              value={nuevoNombreLista}
              onChangeText={setNuevoNombreLista}
              placeholder="Nombre de la lista"
              placeholderTextColor={colores.textoGris}
              maxLength={150}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                style={[styles.modalBoton, { backgroundColor: colores.borde }]}
                onPress={() => setModalRenombrarVisible(false)}
              >
                <Text style={{ color: colores.texto, fontWeight: '700', fontSize: 13 }}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBoton, { backgroundColor: colores.azul }]}
                onPress={guardarNuevoNombreLista}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
                  Guardar
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal para agregar canciones existentes a la lista */}
      <Modal
        visible={modalAgregarCancionVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalAgregarCancionVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalAgregarCancionVisible(false)}
        >
          <Pressable style={[styles.modalCard, { maxHeight: '75%' }]} onPress={() => {}}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Text style={[styles.modalTitulo, { marginBottom: 0 }]}>
                Agregar canción a la lista
              </Text>
              <TouchableOpacity onPress={() => setModalAgregarCancionVisible(false)}>
                <Ionicons name="close" size={22} color={colores.textoGris} />
              </TouchableOpacity>
            </View>

            {cargandoRepertorio ? (
              <ActivityIndicator size="small" color={colores.azul} style={{ marginVertical: 24 }} />
            ) : cancionesDisponiblesParaAgregar.length === 0 ? (
              <Text style={styles.modalSubtitulo}>
                Todas tus canciones registradas ya están en esta lista o aún no has creado más canciones.
              </Text>
            ) : (
              <ScrollView style={{ maxHeight: 340 }}>
                {cancionesDisponiblesParaAgregar.map((c) => {
                  const tonos = parsearTonalidades(c.tonalidades);
                  return (
                    <TouchableOpacity
                      key={c.id_cancion}
                      style={styles.cancionDisponibleFila}
                      onPress={() => agregarCancionALista(c.id_cancion)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colores.texto, fontWeight: '700', fontSize: 13.5 }}>
                          {c.nombre}
                        </Text>
                        <Text style={{ color: colores.textoGris, fontSize: 11.5, marginTop: 2 }}>
                          {c.tempo ? `${c.tempo} BPM` : 'Sin BPM'}
                          {tonos.length > 0 ? ` · ${tonos.join(', ')}` : ''}
                        </Text>
                      </View>
                      <Ionicons name="add-circle" size={24} color={colores.azul} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <BottomNav activo={1} />
    </View>
  );
}

const crearEstilosFila = (c: Tema) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: c.separador,
    },
    filaFantasma: {
      opacity: 0.25,
    },
    filaDestinoOrden: {
      borderTopWidth: 2,
      borderTopColor: c.naranja,
    },
    numeroCirculo: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: c.azulClaro,
      alignItems: 'center',
      justifyContent: 'center',
    },
    numeroTexto: {
      color: c.azul,
      fontSize: 11.5,
      fontWeight: '800',
    },
    meta: {
      flex: 1,
      minWidth: 0,
    },
    titulo: {
      fontSize: 13.5,
      fontWeight: '700',
      color: c.texto,
    },
    detalle: {
      fontSize: 11.5,
      color: c.textoGris,
      marginTop: 2,
    },
    derechaColumna: {
      alignItems: 'flex-end',
      gap: 5,
    },
    tonosFila: {
      flexDirection: 'row',
      gap: 4,
    },
    tonoBadge: {
      backgroundColor: c.azulClaro,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 7,
    },
    tonoTexto: {
      color: c.azul,
      fontSize: 10.5,
      fontWeight: '800',
    },
    grupoTag: {
      backgroundColor: c.naranjaClaro,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 7,
    },
    grupoTagTexto: {
      color: c.naranja,
      fontSize: 10,
      fontWeight: '800',
    },
    dragHandle: {
      paddingVertical: 8,
      paddingHorizontal: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

const crearEstilos = (c: Tema) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scroll: {
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 160,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerIzquierda: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
      marginRight: 10,
    },
    backBtn: {
      width: 32,
      height: 32,
      borderRadius: 9,
      backgroundColor: c.campo,
      borderWidth: 1,
      borderColor: c.borde,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitulo: {
      fontSize: 20,
      fontWeight: '800',
      color: c.texto,
      flex: 1,
    },
    opcionesBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: c.azulClaro,
      borderWidth: 1,
      borderColor: c.borde,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerSecundario: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    subtitulo: {
      fontSize: 11.5,
      fontWeight: '800',
      color: c.textoSuave,
    },
    destaque: {
      color: c.azul,
      fontStyle: 'italic',
      fontWeight: '700',
      fontSize: 11.5,
    },
    bloqueGrupo: {
      borderRadius: 14,
      paddingHorizontal: 6,
      paddingBottom: 6,
      marginTop: 6,
    },
    bloqueGrupoBordeado: {
      borderWidth: 1.4,
      borderStyle: 'dashed',
      borderColor: c.linea,
      paddingHorizontal: 10,
    },
    bloqueGrupoHover: {
      borderColor: c.naranja,
      backgroundColor: 'rgba(240, 117, 42, 0.04)',
    },
    encabezadoGrupo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 10,
      marginBottom: 4,
    },
    encabezadoGrupoTexto: {
      fontSize: 10.5,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: c.naranja,
    },
    encabezadoGrupoLinea: {
      flex: 1,
      height: 1,
      backgroundColor: c.borde,
    },
    encabezadoGrupoConteo: {
      fontSize: 10.5,
      fontWeight: '700',
      color: c.textoGris,
    },
    cajaSoltarGrupo: {
      height: 40,
      borderWidth: 1.4,
      borderStyle: 'dashed',
      borderColor: c.linea,
      borderRadius: 10,
      backgroundColor: c.naranjaClaro,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 6,
    },
    cajaSoltarGrupoActiva: {
      borderColor: c.naranja,
    },
    cajaSoltarGrupoTexto: {
      fontSize: 11,
      fontWeight: '800',
      color: c.naranja,
    },
    bloqueSinGrupo: {
      marginTop: 6,
      borderRadius: 14,
      paddingHorizontal: 4,
    },
    bloqueSinGrupoHover: {
      borderWidth: 1.4,
      borderStyle: 'dashed',
      borderColor: c.azul,
      backgroundColor: c.azulClaro,
      paddingHorizontal: 10,
    },
    zonaQuitarGrupo: {
      marginTop: 10,
      borderWidth: 1.4,
      borderStyle: 'dashed',
      borderColor: c.borde,
      borderRadius: 12,
      padding: 10,
      alignItems: 'center',
    },
    zonaQuitarGrupoActiva: {
      borderColor: c.azul,
      backgroundColor: c.azulClaro,
    },
    zonaQuitarGrupoTexto: {
      fontSize: 11.5,
      fontWeight: '700',
      color: c.textoSuave,
    },
    vacioCaja: {
      alignItems: 'center',
      marginTop: 28,
      marginBottom: 12,
      paddingHorizontal: 20,
    },
    vacioTexto: {
      color: c.textoGris,
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 14,
    },
    agregarPrimeraBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: c.azul,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
    },
    agregarPrimeraTexto: {
      color: '#FFFFFF',
      fontSize: 12.5,
      fontWeight: '700',
    },
    grupoBoton: {
      marginTop: 14,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: c.linea,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
    },
    grupoBotonHover: {
      borderColor: c.naranja,
      backgroundColor: c.naranjaClaro,
    },
    grupoBotonTexto: {
      color: c.naranja,
      fontSize: 12,
      fontWeight: '800',
    },
    tarjetaFlotante: {
      position: 'absolute',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: c.fondo,
      borderWidth: 1.5,
      borderColor: c.naranja,
      borderRadius: 14,
      shadowColor: '#142C57',
      shadowOpacity: 0.35,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 10 },
      elevation: 12,
      zIndex: 999,
    },
    numeroCirculoActivo: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    numeroTextoActivo: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '800',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(9, 14, 26, 0.56)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalCard: {
      width: '100%',
      backgroundColor: c.campo,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: c.borde,
    },
    modalTitulo: {
      fontSize: 16,
      fontWeight: '800',
      color: c.texto,
      marginBottom: 6,
    },
    modalSubtitulo: {
      fontSize: 12,
      color: c.textoGris,
      marginBottom: 14,
    },
    opcionMenuFila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: c.separador,
    },
    opcionMenuTexto: {
      fontSize: 14,
      fontWeight: '600',
      color: c.texto,
    },
    inputNombre: {
      backgroundColor: c.fondo,
      borderWidth: 1,
      borderColor: c.borde,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      color: c.texto,
      marginTop: 8,
    },
    modalBoton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    cancionDisponibleFila: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.separador,
      gap: 10,
    },
  });
