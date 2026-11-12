// src/app/crear-lista.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  PantallaForm,
  Encabezado,
  SeccionTitulo,
  Campo,
  FilaFiltro,
  BotonPrimario,
  Tonalidades,
  useColores,
  fuentes,
} from '../components/form';
import {
  INSTRUMENTOS,
  FILTROS_VACIOS,
  filtrarCanciones,
  Filtros,
} from '../constants/cancionesDemo';

interface CancionBD {
  id_cancion: number;
  nombre: string;
  tempo: number | null;
  tonalidades: string[];
  categorias: string[]; 
  instrumentos: string[]; 
}

export default function CrearLista() {
  const c = useColores();
  const router = useRouter();
  
  const [cancionesDB, setCancionesDB] = useState<CancionBD[]>([]);
  const [cargando, setCargando] = useState(true);
  
  // Estados para las listas dinámicas de los filtros
  const [misCategorias, setMisCategorias] = useState<string[]>([]);
  const [misTonalidades, setMisTonalidades] = useState<string[]>([]);
  
  const [nombre, setNombre] = useState('');
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS);
  const [seleccionadas, setSeleccionadas] = useState<CancionBD[]>([]);
  const [guardando, setGuardando] = useState(false);

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

        // Traemos las canciones y las categorías en paralelo
        const [resCanciones, resCategorias] = await Promise.all([
          fetch(`${API_URL}/canciones`, opcionesFetch),
          fetch(`${API_URL}/categorias`, opcionesFetch)
        ]);

        if (resCategorias.ok) {
          const dataCategorias = await resCategorias.json();
          // Extraemos los nombres y los ordenamos alfabéticamente
          setMisCategorias(dataCategorias.map((cat: any) => cat.nombre).sort());
        }

        if (resCanciones.ok) {
          const dataCanciones = await resCanciones.json();
          const tonosUnicos = new Set<string>();
          
          const cancionesMapeadas = dataCanciones.map((cancion: any) => {
            // Parsear tonalidades
            let tonosParseados: string[] = [];
            try {
              tonosParseados = typeof cancion.tonalidades === 'string' 
                ? JSON.parse(cancion.tonalidades) 
                : (cancion.tonalidades || []);
            } catch (e) { tonosParseados = []; }
            
            // Recolectar todos los tonos existentes para el filtro
            tonosParseados.forEach(t => tonosUnicos.add(t));

            // Parsear las categorías que enviamos pegadas con "||" desde la base de datos
            const catParseadas = cancion.categorias_texto 
                ? cancion.categorias_texto.split('||') 
                : [];

            return {
              id_cancion: cancion.id_cancion,
              nombre: cancion.nombre,
              tempo: cancion.tempo,
              tonalidades: tonosParseados,
              categorias: catParseadas, 
              instrumentos: [] // Pendiente hasta agregar la tabla
            };
          });

          setCancionesDB(cancionesMapeadas);
          setMisTonalidades(Array.from(tonosUnicos).sort());
        }
      } catch (error) {
        console.error('Error al obtener datos:', error);
      } finally {
        setCargando(false);
      }
    };

    obtenerDatos();
  }, []);

  const cambiar = (campo: keyof Filtros, valor: string) => {
    setFiltros({ ...filtros, [campo]: valor });
  };

  const cancionesParaFiltrar = cancionesDB.map(c => ({
    ...c,
    tonalidades: c.tonalidades.join(', ')
  }));

  const coincidenFiltradas = filtrarCanciones(cancionesParaFiltrar as any, filtros);
  
  const coinciden = coincidenFiltradas.map(c => 
    cancionesDB.find(db => db.id_cancion === c.id_cancion)
  ).filter(Boolean) as CancionBD[];

  const posicionDe = (id: number): number => seleccionadas.findIndex((x) => x.id_cancion === id);

  const alternar = (cancion: CancionBD) => {
    if (posicionDe(cancion.id_cancion) >= 0) {
      setSeleccionadas(seleccionadas.filter((x) => x.id_cancion !== cancion.id_cancion));
    } else {
      setSeleccionadas([...seleccionadas, cancion]);
    }
  };

  const seleccionarTodas = () => {
    const nuevas = coinciden.filter((x) => posicionDe(x.id_cancion) < 0);
    setSeleccionadas([...seleccionadas, ...nuevas]);
  };

  const mover = (indice: number, direccion: number) => {
    const nuevoIndice = indice + direccion;
    if (nuevoIndice < 0 || nuevoIndice >= seleccionadas.length) return;
    const copia = [...seleccionadas];
    const temporal = copia[indice];
    copia[indice] = copia[nuevoIndice];
    copia[nuevoIndice] = temporal;
    setSeleccionadas(copia);
  };

  const crearLista = async () => {
    if (!nombre.trim()) {
      Alert.alert('Falta el nombre', 'Escribe un nombre para la lista.');
      return;
    }

    setGuardando(true);

    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_URL}/listas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          canciones: seleccionadas.map((cancion) => ({
            id_cancion: cancion.id_cancion,
          })),
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'No se pudo crear la lista');
        setGuardando(false);
        return;
      }

      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('Error de red', 'Verifica tu conexión al servidor.');
      setGuardando(false);
    }
  };

  return (
    <PantallaForm>
      <Encabezado titulo="Crear nueva lista" onBack={() => router.back()} />

      <Campo etiqueta="Nombre de la lista *" value={nombre} onChangeText={setNombre} placeholder="Ensayo jueves" maxLength={150} />

      {/* Aquí le pasamos las variables dinámicas misCategorias y misTonalidades en vez de las de prueba */}
      <FilaFiltro titulo="Categoría" opciones={misCategorias} valor={filtros.categoria} onChange={(v) => cambiar('categoria', v)} />
      <FilaFiltro titulo="Instrumento" opciones={INSTRUMENTOS} valor={filtros.instrumento} onChange={(v) => cambiar('instrumento', v)} />
      <FilaFiltro titulo="Tonalidad" opciones={misTonalidades} valor={filtros.tonalidad} onChange={(v) => cambiar('tonalidad', v)} />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Campo etiqueta="BPM mínimo" value={filtros.bpmMin} onChangeText={(t) => cambiar('bpmMin', t)} placeholder="90" teclado="numeric" maxLength={5} />
        </View>
        <View style={{ flex: 1 }}>
          <Campo etiqueta="BPM máximo" value={filtros.bpmMax} onChangeText={(t) => cambiar('bpmMax', t)} placeholder="120" teclado="numeric" maxLength={5} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 10 }}>
        <Text style={{ fontFamily: fuentes.extra, fontSize: 11.5, color: c.textoSuave }}>
          Canciones guardadas ({coinciden.length})
        </Text>
        <TouchableOpacity onPress={seleccionarTodas}>
          <Text style={{ fontFamily: fuentes.negrita, fontSize: 11, color: c.azul }}>Seleccionar todas</Text>
        </TouchableOpacity>
      </View>

      {cargando ? (
        <ActivityIndicator size="small" color={c.azul} style={{ marginVertical: 20 }} />
      ) : coinciden.length === 0 ? (
        <Text style={{ fontFamily: fuentes.normal, fontSize: 12, color: c.textoTenue, marginBottom: 12 }}>
          Ninguna canción coincide con los filtros o no tienes canciones registradas.
        </Text>
      ) : (
        coinciden.map((cancion) => {
          const pos = posicionDe(cancion.id_cancion);
          const marcada = pos >= 0;
          return (
            <TouchableOpacity
              key={cancion.id_cancion}
              onPress={() => alternar(cancion)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.linea }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: marcada ? c.azul : 'transparent',
                  borderWidth: marcada ? 0 : 2,
                  borderColor: c.linea,
                }}
              >
                {marcada && <Text style={{ fontFamily: fuentes.extra, fontSize: 10.5, color: '#FFFFFF' }}>{pos + 1}</Text>}
              </View>

              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ fontFamily: fuentes.negrita, fontSize: 13.5, color: c.texto }}>
                  {cancion.nombre}
                </Text>
                <Text style={{ fontFamily: fuentes.normal, fontSize: 11.5, color: c.textoTenue, marginTop: 2 }}>
                  {cancion.tempo ? `${cancion.tempo} BPM` : 'Sin BPM'}
                </Text>
              </View>

              <Tonalidades lista={cancion.tonalidades} />
            </TouchableOpacity>
          );
        })
      )}

      {seleccionadas.length > 0 && (
        <Text style={{ fontFamily: fuentes.normal, fontSize: 11, color: c.textoTenue, textAlign: 'center', marginTop: 10 }}>
          El número es la posición en la lista. Podrás reordenarlas después.
        </Text>
      )}

      {seleccionadas.length > 1 && (
        <View style={{ marginTop: 18 }}>
          <SeccionTitulo texto="Orden de la lista" />
          {seleccionadas.map((cancion, i) => (
            <View key={cancion.id_cancion} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
              <Text style={{ width: 18, fontFamily: fuentes.extra, fontSize: 11.5, color: c.azul }}>{i + 1}</Text>
              <Text numberOfLines={1} style={{ flex: 1, fontFamily: fuentes.media, fontSize: 13, color: c.texto }}>
                {cancion.nombre}
              </Text>
              <TouchableOpacity onPress={() => mover(i, -1)} hitSlop={8}>
                <Ionicons name="chevron-up" size={18} color={c.textoTenue} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => mover(i, 1)} hitSlop={8}>
                <Ionicons name="chevron-down" size={18} color={c.textoTenue} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={{ marginTop: 16 }}>
        {guardando ? (
          <ActivityIndicator size="large" color={c.azul} />
        ) : (
          <BotonPrimario texto={`Crear lista (${seleccionadas.length} canciones)`} onPress={crearLista} />
        )}
      </View>
    </PantallaForm>
  );
}