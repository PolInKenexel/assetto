// src/app/agregar-cancion.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  PantallaForm,
  Encabezado,
  SeccionTitulo,
  Campo,
  Chip,
  BotonPrimario,
  Segmentado,
  useColores,
  fuentes,
} from '../components/form';

function tempoValido(texto: string): boolean {
  if (texto.trim() === '') return true;
  const n = Number(texto);
  return Number.isInteger(n) && n > 0 && n <= 65535;
}

/* ---------- Modo MANUAL ---------- */

type Categoria = { id_categoria: number; nombre: string };

const CATEGORIAS_DEMO: Categoria[] = [
  { id_categoria: 1, nombre: 'Vals' },
  { id_categoria: 2, nombre: 'Balada' },
  { id_categoria: 3, nombre: 'Bossa' },
  { id_categoria: 4, nombre: 'Rock' },
  { id_categoria: 5, nombre: 'Infantil' },
];

const INSTRUMENTOS_LISTA = [
  { id_instrumento: 1, nombre: 'Guitarra' },
  { id_instrumento: 2, nombre: 'Piano' },
  { id_instrumento: 3, nombre: 'Voz' },
  { id_instrumento: 4, nombre: 'Violín' },
  { id_instrumento: 5, nombre: 'Flauta' },
  { id_instrumento: 6, nombre: 'Batería' },
];

type CancionNueva = {
  nombre: string;
  tonalidades: string[];
  tempo: number | null;
  categorias: number[];
  instrumentos: number[];
};

function FormManual({ onGuardar, guardando }: { onGuardar: (cancion: CancionNueva) => void, guardando: boolean }) {
  const c = useColores();
  const [nombre, setNombre] = useState('');
  const [tonalidades, setTonalidades] = useState<string[]>([]);
  const [nuevaTonalidad, setNuevaTonalidad] = useState('');
  const [tempo, setTempo] = useState('');
  const [categorias, setCategorias] = useState<Categoria[]>(CATEGORIAS_DEMO);
  const [categoriasElegidas, setCategoriasElegidas] = useState<number[]>([]);
  const [instrumentosElegidos, setInstrumentosElegidos] = useState<number[]>([]);
  const [creando, setCreando] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState('');

  const agregarTonalidad = () => {
    const texto = nuevaTonalidad.trim();
    if (!texto) return;
    if (tonalidades.some((t) => t.toLowerCase() === texto.toLowerCase())) {
      Alert.alert('Esa tonalidad ya está agregada');
      return;
    }
    setTonalidades([...tonalidades, texto]);
    setNuevaTonalidad('');
  };

  const quitarTonalidad = (texto: string) => {
    setTonalidades(tonalidades.filter((t) => t !== texto));
  };

  const alternarCategoria = (id: number) => {
    if (categoriasElegidas.includes(id)) {
      setCategoriasElegidas(categoriasElegidas.filter((x) => x !== id));
    } else {
      setCategoriasElegidas([...categoriasElegidas, id]);
    }
  };

  const alternarInstrumento = (id: number) => {
    if (instrumentosElegidos.includes(id)) {
      setInstrumentosElegidos(instrumentosElegidos.filter((x) => x !== id));
    } else {
      setInstrumentosElegidos([...instrumentosElegidos, id]);
    }
  };

  const crearCategoria = () => {
    const texto = nuevaCategoria.trim();
    if (!texto) return;
    const repetida = categorias.some((x) => x.nombre.toLowerCase() === texto.toLowerCase());
    if (repetida) {
      Alert.alert('Esa categoría ya existe');
      return;
    }
    const nueva: Categoria = { id_categoria: Date.now(), nombre: texto };
    setCategorias([...categorias, nueva]);
    setCategoriasElegidas([...categoriasElegidas, nueva.id_categoria]);
    setNuevaCategoria('');
    setCreando(false);
  };

  const guardar = () => {
    if (!nombre.trim()) {
      Alert.alert('Falta el nombre', 'Escribe el nombre de la canción.');
      return;
    }
    if (tonalidades.length === 0) {
      Alert.alert('Falta la tonalidad', 'Agrega al menos una tonalidad (ej. G, Am, F#m).');
      return;
    }
    if (!tempoValido(tempo)) {
      Alert.alert('Tempo no válido', 'Escribe un número entero mayor que 0 o déjalo vacío.');
      return;
    }
    
    // Procesamos las categorías para separar IDs reales de las nuevas (que son Date.now())
    const categoriasProcesadas = categoriasElegidas.map(id => {
      if (id > 1000000000000) { // Si es un ID gigante de Date.now()
        const cat = categorias.find(c => c.id_categoria === id);
        return cat ? cat.nombre : id; // Enviamos el texto ("Tango", "Salsa")
      }
      return id; // Si es un ID real (1, 2, 3), lo dejamos igual
    });

    onGuardar({
      nombre: nombre.trim(),
      tonalidades,
      tempo: tempo.trim() === '' ? null : Number(tempo),
      categorias: categoriasProcesadas as any, // Enviamos mezcla de números y textos
      instrumentos: instrumentosElegidos,
    });
  };

  return (
    <View>
      <Campo etiqueta="Nombre *" value={nombre} onChangeText={setNombre} placeholder="Vals en Sol mayor" maxLength={200} />

      <Text style={{ fontFamily: fuentes.negrita, fontSize: 11.5, color: c.textoTenue, marginBottom: 5, marginLeft: 3 }}>
        Tonalidades *
      </Text>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          padding: 10,
          borderWidth: 1.4,
          borderColor: c.linea,
          borderRadius: 12,
          backgroundColor: c.superficie2,
          marginBottom: 8,
        }}
      >
        {tonalidades.map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => quitarTonalidad(t)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: c.azulTenue }}
          >
            <Text style={{ fontFamily: fuentes.extra, fontSize: 12, color: c.azul }}>{t}</Text>
            <Ionicons name="close" size={12} color={c.azul} />
          </TouchableOpacity>
        ))}
        {tonalidades.length === 0 && (
          <Text style={{ fontFamily: fuentes.normal, fontSize: 12, color: c.textoTenue }}>Aún no hay tonalidades</Text>
        )}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Campo etiqueta="Agregar tonalidad" value={nuevaTonalidad} onChangeText={setNuevaTonalidad} placeholder="G" maxLength={10} />
        </View>
        <TouchableOpacity
          onPress={agregarTonalidad}
          style={{ marginTop: 21, backgroundColor: c.azul, paddingHorizontal: 16, height: 46, borderRadius: 12, justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: fuentes.extra, fontSize: 12.5, color: '#FFFFFF' }}>Agregar</Text>
        </TouchableOpacity>
      </View>
      <Text style={{ fontFamily: fuentes.normal, fontSize: 11, color: c.textoTenue, marginLeft: 3, marginBottom: 14 }}>
        Puedes agregar varias (ej. G, Am, F#m). Toca una para quitarla.
      </Text>

      <Campo etiqueta="Tempo (BPM) · opcional" value={tempo} onChangeText={setTempo} placeholder="96" teclado="numeric" maxLength={5} />

      <SeccionTitulo texto="Categorías" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {categorias.map((cat) => (
          <Chip
            key={cat.id_categoria}
            texto={cat.nombre}
            activo={categoriasElegidas.includes(cat.id_categoria)}
            onPress={() => alternarCategoria(cat.id_categoria)}
          />
        ))}
        <TouchableOpacity
          onPress={() => setCreando(!creando)}
          style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.4, borderStyle: 'dashed', borderColor: c.linea }}
        >
          <Text style={{ fontFamily: fuentes.extra, fontSize: 11.5, color: c.naranja }}>+ Nueva</Text>
        </TouchableOpacity>
      </View>

      {creando && (
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Campo etiqueta="Nueva categoría" value={nuevaCategoria} onChangeText={setNuevaCategoria} placeholder="Tango" maxLength={100} />
          </View>
          <TouchableOpacity
            onPress={crearCategoria}
            style={{ marginTop: 21, backgroundColor: c.azul, paddingHorizontal: 16, height: 46, borderRadius: 12, justifyContent: 'center' }}
          >
            <Text style={{ fontFamily: fuentes.extra, fontSize: 12.5, color: '#FFFFFF' }}>Crear</Text>
          </TouchableOpacity>
        </View>
      )}

      <SeccionTitulo texto="Instrumentos" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {INSTRUMENTOS_LISTA.map((instr) => (
          <Chip
            key={instr.id_instrumento}
            texto={instr.nombre}
            activo={instrumentosElegidos.includes(instr.id_instrumento)}
            onPress={() => alternarInstrumento(instr.id_instrumento)}
          />
        ))}
      </View>

      <Text style={{ fontFamily: fuentes.normal, fontSize: 11, color: c.textoTenue, marginBottom: 10, marginLeft: 3 }}>
        Podrás modificar estos datos cuando quieras desde Mis canciones.
      </Text>

      {guardando ? (
        <ActivityIndicator size="large" color={c.azul} />
      ) : (
        <BotonPrimario texto="Guardar canción" onPress={guardar} />
      )}
    </View>
  );
}


/* ---------- Modo IMPORTAR (Bloqueado) ---------- */

function TarjetaFuente({ nombre, icono, activa }: { nombre: string; icono: 'play-circle-outline' | 'radio-outline'; activa: boolean; }) {
  const c = useColores();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1.6,
        borderColor: activa ? c.naranja : c.linea,
        backgroundColor: activa ? c.naranjaTenue : c.superficie2,
      }}
    >
      <LinearGradient
        colors={[c.azul, c.naranja]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name={icono} size={17} color="#FFFFFF" />
      </LinearGradient>
      <Text style={{ fontFamily: fuentes.extra, fontSize: 12, color: c.texto }}>{nombre}</Text>
    </View>
  );
}

function FormImportarDummy() {
  const c = useColores();

  const advertenciaBloqueo = () => {
    Alert.alert('Próximamente', 'La opción de importar desde playlists aún no está disponible.');
  };

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={advertenciaBloqueo} style={{ opacity: 0.45, marginTop: 5 }}>
      {/* El pointerEvents="none" evita que se puedan tocar los inputs/botones internos, 
          haciendo que el TouchableOpacity padre atrape todo el click */}
      <View pointerEvents="none">
        
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <TarjetaFuente nombre="YouTube" icono="play-circle-outline" activa={true} />
          <TarjetaFuente nombre="Spotify" icono="radio-outline" activa={false} />
        </View>

        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Campo
              etiqueta="Link de la playlist"
              value=""
              onChangeText={() => {}}
              placeholder="youtube.com/playlist?list=…"
            />
          </View>
          <View
            style={{ marginTop: 21, backgroundColor: c.azul, paddingHorizontal: 16, height: 46, borderRadius: 12, justifyContent: 'center' }}
          >
            <Text style={{ fontFamily: fuentes.extra, fontSize: 12.5, color: '#FFFFFF' }}>Buscar</Text>
          </View>
        </View>

      </View>
    </TouchableOpacity>
  );
}


/* ---------- Pantalla Principal ---------- */

const MODOS = ['Manual', 'Importar'] as const;
type Modo = (typeof MODOS)[number];

export default function AgregarCancion() {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>('Manual');
  const [guardando, setGuardando] = useState(false);
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  const guardarManual = async (cancion: CancionNueva) => {
    setGuardando(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const response = await fetch(`${API_URL}/canciones`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: cancion.nombre,
          tonalidades: cancion.tonalidades,
          tempo: cancion.tempo,
          categorias: cancion.categorias,
          instrumentos: cancion.instrumentos 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'No se pudo guardar la canción');
        setGuardando(false);
        return;
      }

      router.back();
    } catch (error) {
      Alert.alert('Error de red', 'No se pudo conectar al servidor.');
      setGuardando(false);
    }
  };

  return (
    <PantallaForm>
      <Encabezado titulo="Agregar canción" onBack={() => router.back()} />
      <Segmentado opciones={MODOS} valor={modo} onChange={setModo} />
      
      {modo === 'Manual' ? (
        <FormManual onGuardar={guardarManual} guardando={guardando} />
      ) : (
        <FormImportarDummy />
      )}
    </PantallaForm>
  );
}