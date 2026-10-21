// src/app/mis-canciones.tsx
import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Pantalla from '../components/Pantalla';
import {
  BarraBusqueda,
  Chip,
  FilaFiltro,
  Campo,
  SeccionTitulo,
  Tonalidades,
  useColores,
  fuentes,
} from '../components/form';
import {
  CANCIONES_DEMO,
  CATEGORIAS,
  INSTRUMENTOS,
  TONALIDADES,
  FILTROS_VACIOS,
  filtrarCanciones,
  Filtros,
} from '../constants/cancionesDemo';

type NombreFiltro = 'categoria' | 'tonalidad' | 'bpm' | 'instrumento';

export default function MisCanciones() {
  const c = useColores();
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS);
  const [abierto, setAbierto] = useState<NombreFiltro | null>(null);

  const cambiar = (campo: keyof Filtros, valor: string) => {
    setFiltros({ ...filtros, [campo]: valor });
  };

  const canciones = filtrarCanciones(CANCIONES_DEMO, filtros);

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

      {/* Chips de filtro: tocar abre el panel; si ya hay un valor, tocar lo quita */}
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

      {/* Panel con las opciones del filtro abierto */}
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
              {cancion.tempo ? `${cancion.tempo} BPM` : 'Sin BPM'} · {cancion.categorias.join(', ')}
            </Text>
          </View>
          <Tonalidades lista={cancion.tonalidades} />
        </View>
      ))}
    </Pantalla>
  );
}