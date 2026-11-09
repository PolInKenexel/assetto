// src/app/mis-canciones.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Pantalla from '../components/Pantalla';
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
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS);
  const [abierto, setAbierto] = useState<NombreFiltro | null>(null);

  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    const obtenerCanciones = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          router.replace('/');
          return;
        }

        const response = await fetch(`${API_URL}/canciones`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) router.replace('/');
          return;
        }

        const data = await response.json();
        
        // Mapeamos los datos para que coincidan con la estructura que espera tu UI y tus filtros
        const cancionesMapeadas = data.map((cancion: any) => {
          let tonosParseados = [];
          try {
            tonosParseados = typeof cancion.tonalidades === 'string' 
              ? JSON.parse(cancion.tonalidades) 
              : cancion.tonalidades;
          } catch (e) {
            tonosParseados = [];
          }

          return {
            ...cancion,
            tonalidades: tonosParseados,
            // El endpoint GET /canciones no hace JOIN con categorías todavía, 
            // así que le pasamos un arreglo vacío por ahora para evitar errores.
            categorias: [] 
          };
        });

        setCancionesDB(cancionesMapeadas);
      } catch (error) {
        console.error('Error al obtener canciones:', error);
      } finally {
        setCargando(false);
      }
    };

    obtenerCanciones();
  }, []);

  const cambiar = (campo: keyof Filtros, valor: string) => {
    setFiltros({ ...filtros, [campo]: valor });
  };

  // Aplicamos tu función de filtrado a los datos reales de la base de datos
  const canciones = filtrarCanciones(cancionesDB, filtros);

  const hayBpm = filtros.bpmMin !== '' || filtros.bpmMax !== '';
  const textoBpm = `BPM: ${filtros.bpmMin || '…'}–${filtros.bpmMax || '…'}`;

  const alternarPanel = (nombre: NombreFiltro) => {
    setAbierto(abierto === nombre ? null : nombre);
  };

  const quitarBpm = () => {
    setFiltros({ ...filtros, bpmMin: '', bpmMax: '' });
  };

  const colores = [
    ['#24509E', '#F0752A'],
    ['#142C57', '#E8973F'],
    ['#3A6FC4', '#F2A65A'],
  ];

  return (
    <Pantalla titulo="Mis canciones" activo={3}>
      <BarraBusqueda
        value={filtros.busqueda}
        onChangeText={(t) => cambiar('busqueda', t)}
        placeholder="Buscar canción"
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginBottom: 12 }}>
        <Chip
          texto={filtros.categoria ? `Categoría: ${filtros.categoria}` : 'Categoría'}
          activo={filtros.categoria !== ''}
          icono={filtros.categoria ? 'close' : 'chevron-down'}
          onPress={() => (filtros.categoria ? cambiar('categoria', '') : alternarPanel('categoria'))}
        />
        <Chip
          texto={filtros.tonalidad ? `Tonalidad: ${filtros.tonalidad}` : 'Tonalidad'}
          activo={filtros.tonalidad !== ''}
          icono={filtros.tonalidad ? 'close' : 'chevron-down'}
          onPress={() => (filtros.tonalidad ? cambiar('tonalidad', '') : alternarPanel('tonalidad'))}
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
          onPress={() => (filtros.instrumento ? cambiar('instrumento', '') : alternarPanel('instrumento'))}
        />
      </ScrollView>

      {abierto === 'categoria' && (
        <FilaFiltro
          titulo="Categoría"
          opciones={CATEGORIAS}
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
          opciones={TONALIDADES}
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
          opciones={INSTRUMENTOS}
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
            <Campo etiqueta="BPM mínimo" value={filtros.bpmMin} onChangeText={(t) => cambiar('bpmMin', t)} placeholder="90" teclado="numeric" maxLength={5} />
          </View>
          <View style={{ flex: 1 }}>
            <Campo etiqueta="BPM máximo" value={filtros.bpmMax} onChangeText={(t) => cambiar('bpmMax', t)} placeholder="120" teclado="numeric" maxLength={5} />
          </View>
        </View>
      )}

      {cargando ? (
        <ActivityIndicator size="large" color={c.azul} style={{ marginTop: 40 }} />
      ) : (
        <>
          <SeccionTitulo texto={`${canciones.length} canciones`} />

          {canciones.length === 0 && (
            <Text style={{ fontFamily: fuentes.normal, fontSize: 12, color: c.textoTenue }}>
              Ninguna canción coincide con la búsqueda.
            </Text>
          )}

          {canciones.map((cancion, i) => (
            <View
              key={cancion.id_cancion}
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
                style={{ width: 38, height: 38, borderRadius: 10 }}
              />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ fontFamily: fuentes.negrita, fontWeight: '700', fontSize: 13.5, color: c.texto }}>
                  {cancion.nombre}
                </Text>
                <Text style={{ fontFamily: fuentes.normal, fontSize: 11.5, color: c.textoTenue, marginTop: 2 }}>
                  {cancion.tempo ? `${cancion.tempo} BPM` : 'Sin BPM'} 
                  {cancion.categorias && cancion.categorias.length > 0 ? ` · ${cancion.categorias.join(', ')}` : ''}
                </Text>
              </View>
              <Tonalidades lista={cancion.tonalidades} />
            </View>
          ))}
        </>
      )}
    </Pantalla>
  );
}