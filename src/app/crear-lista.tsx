import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
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
  CANCIONES_DEMO,
  CATEGORIAS,
  INSTRUMENTOS,
  TONALIDADES,
  FILTROS_VACIOS,
  filtrarCanciones,
  Cancion,
  Filtros,
} from '../constants/cancionesDemo';

export default function CrearLista() {
  const c = useColores();
  const router = useRouter();
  const [nombre, setNombre] = useState(''); // listas.nombre (máx. 150)
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS);

  // Canciones elegidas, en orden: el lugar en el arreglo es la posición
  const [seleccionadas, setSeleccionadas] = useState<Cancion[]>([]);

  const cambiar = (campo: keyof Filtros, valor: string) => {
    setFiltros({ ...filtros, [campo]: valor });
  };

  // Solo salen de las canciones que el usuario ya tiene guardadas
  const coinciden = filtrarCanciones(CANCIONES_DEMO, filtros);

  const posicionDe = (id: number): number => seleccionadas.findIndex((x) => x.id_cancion === id); // -1 si no está

  const alternar = (cancion: Cancion) => {
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

  // direccion: -1 sube, 1 baja
  const mover = (indice: number, direccion: number) => {
    const nuevoIndice = indice + direccion;
    if (nuevoIndice < 0 || nuevoIndice >= seleccionadas.length) return;
    const copia = [...seleccionadas];
    const temporal = copia[indice];
    copia[indice] = copia[nuevoIndice];
    copia[nuevoIndice] = temporal;
    setSeleccionadas(copia);
  };

  const crearLista = () => {
    if (!nombre.trim()) {
      Alert.alert('Falta el nombre', 'Escribe un nombre para la lista.');
      return;
    }
    // Datos listos para la base de datos:
    // INSERT en `listas` (nombre) y una fila en `listas_canciones` por canción
    const lista = {
      nombre: nombre.trim(),
      canciones: seleccionadas.map((cancion, i) => ({
        id_cancion: cancion.id_cancion,
        posicion: i + 1, // listas_canciones.posicion (única por lista)
      })),
    };
    console.log(lista); // TODO: enviar `lista` al servidor
    router.back();
  };

  return (
    <PantallaForm>
      <Encabezado titulo="Crear nueva lista" onBack={() => router.back()} />

      <Campo etiqueta="Nombre de la lista *" value={nombre} onChangeText={setNombre} placeholder="Ensayo jueves" maxLength={150} />

      <FilaFiltro titulo="Categoría" opciones={CATEGORIAS} valor={filtros.categoria} onChange={(v) => cambiar('categoria', v)} />
      <FilaFiltro titulo="Instrumento" opciones={INSTRUMENTOS} valor={filtros.instrumento} onChange={(v) => cambiar('instrumento', v)} />
      <FilaFiltro titulo="Tonalidad" opciones={TONALIDADES} valor={filtros.tonalidad} onChange={(v) => cambiar('tonalidad', v)} />

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
          Canciones que coinciden ({coinciden.length})
        </Text>
        <TouchableOpacity onPress={seleccionarTodas}>
          <Text style={{ fontFamily: fuentes.negrita, fontSize: 11, color: c.azul }}>Seleccionar todas</Text>
        </TouchableOpacity>
      </View>

      {coinciden.length === 0 && (
        <Text style={{ fontFamily: fuentes.normal, fontSize: 12, color: c.textoTenue, marginBottom: 12 }}>
          Ninguna canción guardada coincide con estos filtros.
        </Text>
      )}

      {coinciden.map((cancion) => {
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
                {cancion.tempo ? `${cancion.tempo} BPM` : 'Sin BPM'} · {cancion.categorias.join(', ')} · {cancion.instrumentos.join(', ')}
              </Text>
            </View>

            <Tonalidades lista={cancion.tonalidades} />
          </TouchableOpacity>
        );
      })}

      <Text style={{ fontFamily: fuentes.normal, fontSize: 11, color: c.textoTenue, textAlign: 'center', marginTop: 10 }}>
        El número es la posición en la lista. Podrás reordenarlas después.
      </Text>

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
        <BotonPrimario texto={`Crear lista (${seleccionadas.length} canciones)`} onPress={crearLista} />
      </View>
    </PantallaForm>
  );
}
