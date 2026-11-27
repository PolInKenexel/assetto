// src/app/editar-cancion.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
    PantallaForm,
    Encabezado,
    SeccionTitulo,
    Campo,
    Chip,
    BotonPrimario,
    useColores,
    fuentes,
} from '../components/form';

type Categoria = {
    id_categoria: number;
    nombre: string;
    tipo?: string;
};

function tempoValido(texto: string): boolean {
    if (texto.trim() === '') return true;
    const n = Number(texto);
    return Number.isInteger(n) && n > 0 && n <= 65535;
}

export default function EditarCancion() {
    const router = useRouter();
    const c = useColores();
    const { id } = useLocalSearchParams<{ id: string }>();
    const API_URL = process.env.EXPO_PUBLIC_API_URL;

    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    const [nombre, setNombre] = useState('');
    const [tonalidades, setTonalidades] = useState<string[]>([]);
    const [nuevaTonalidad, setNuevaTonalidad] = useState('');
    const [tempo, setTempo] = useState('');

    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [instrumentos, setInstrumentos] = useState<Categoria[]>([]);
    const [seleccionInicial, setSeleccionInicial] = useState<number[]>([]);
    const [seleccionActual, setSeleccionActual] = useState<number[]>([]);

    const [creando, setCreando] = useState(false);
    const [nuevaCategoria, setNuevaCategoria] = useState('');

    useEffect(() => {
        const cargarDatos = async () => {
            if (!id) {
                Alert.alert('Error', 'No se recibió el ID de la canción.');
                router.back();
                return;
            }

            try {
                const token = await AsyncStorage.getItem('userToken');
                if (!token) {
                    router.replace('/');
                    return;
                }

                const headers = { Authorization: `Bearer ${token}` };

                const [resCancion, resTodasCats, resCatsCancion] = await Promise.all([
                    fetch(`${API_URL}/canciones/${id}`, { headers }),
                    fetch(`${API_URL}/categorias`, { headers }),
                    fetch(`${API_URL}/canciones/${id}/categorias`, { headers }),
                ]);

                if (resCancion.status === 401) {
                    router.replace('/');
                    return;
                }

                if (!resCancion.ok) {
                    Alert.alert('Error', 'No se pudo cargar la canción.');
                    router.back();
                    return;
                }

                const cancion = await resCancion.json();
                setNombre(cancion.nombre ?? '');
                setTempo(cancion.tempo ? String(cancion.tempo) : '');

                let tonos: string[] = [];
                try {
                    tonos =
                        typeof cancion.tonalidades === 'string'
                            ? JSON.parse(cancion.tonalidades)
                            : cancion.tonalidades || [];
                } catch {
                    tonos = [];
                }
                setTonalidades(tonos);

                if (resTodasCats.ok) {
                    const todas: Categoria[] = await resTodasCats.json();
                    setCategorias(todas.filter((cat) => cat.tipo !== 'instrumento'));
                    setInstrumentos(todas.filter((cat) => cat.tipo === 'instrumento'));
                }

                if (resCatsCancion.ok) {
                    const asignadas: Categoria[] = await resCatsCancion.json();
                    const ids = asignadas.map((cat) => Number(cat.id_categoria));
                    setSeleccionInicial(ids);
                    setSeleccionActual(ids);
                }
            } catch {
                Alert.alert('Error de red', 'No se pudo conectar al servidor.');
                router.back();
            } finally {
                setCargando(false);
            }
        };

        cargarDatos();
    }, [id, API_URL, router]);

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

    const alternarSeleccion = (idCat: number) => {
        if (seleccionActual.includes(idCat)) {
            setSeleccionActual(seleccionActual.filter((x) => x !== idCat));
        } else {
            setSeleccionActual([...seleccionActual, idCat]);
        }
    };

    const crearCategoria = async () => {
        const texto = nuevaCategoria.trim();
        if (!texto) return;

        const repetida = categorias.some((x) => x.nombre.toLowerCase() === texto.toLowerCase());
        if (repetida) {
            Alert.alert('Esa categoría ya existe');
            return;
        }

        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await fetch(`${API_URL}/categorias`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nombre: texto, tipo: 'genero' }),
            });

            if (!res.ok) {
                const err = await res.json();
                Alert.alert('Error', err.error || 'No se pudo crear la categoría.');
                return;
            }

            const nueva: Categoria = await res.json();
            setCategorias([...categorias, nueva]);
            setSeleccionActual([...seleccionActual, Number(nueva.id_categoria)]);
            setNuevaCategoria('');
            setCreando(false);
        } catch {
            Alert.alert('Error de red', 'No se pudo crear la categoría.');
        }
    };

    const guardarCambios = async () => {
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

        setGuardando(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const headers = {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            };

            // 1. Actualizar datos principales de la canción
            const resUpdate = await fetch(`${API_URL}/canciones/${id}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({
                    nombre: nombre.trim(),
                    tonalidades,
                    tempo: tempo.trim() === '' ? null : Number(tempo),
                }),
            });

            if (!resUpdate.ok) {
                const err = await resUpdate.json();
                Alert.alert('Error', err.error || 'No se pudo actualizar la canción.');
                setGuardando(false);
                return;
            }

            // 2. Sincronizar categorías e instrumentos agregados o quitados
            const agregadas = seleccionActual.filter((x) => !seleccionInicial.includes(x));
            const quitadas = seleccionInicial.filter((x) => !seleccionActual.includes(x));

            await Promise.all([
                ...agregadas.map((idCat) =>
                    fetch(`${API_URL}/canciones/${id}/categorias/${idCat}`, {
                        method: 'PATCH',
                        headers,
                        body: JSON.stringify({ asignada: true }),
                    })
                ),
                ...quitadas.map((idCat) =>
                    fetch(`${API_URL}/canciones/${id}/categorias/${idCat}`, {
                        method: 'PATCH',
                        headers,
                        body: JSON.stringify({ asignada: false }),
                    })
                ),
            ]);

            router.back();
        } catch {
            Alert.alert('Error de red', 'No se pudo conectar al servidor.');
            setGuardando(false);
        }
    };

    return (
        <PantallaForm>
            <Encabezado titulo="Editar canción" onBack={() => router.back()} />

            {cargando ? (
                <ActivityIndicator size="large" color={c.azul} style={{ marginTop: 40 }} />
            ) : (
                <View>
                    <Campo
                        etiqueta="Nombre *"
                        value={nombre}
                        onChangeText={setNombre}
                        placeholder="Vals en Sol mayor"
                        maxLength={200}
                    />

                    <Text
                        style={{
                            fontFamily: fuentes.negrita,
                            fontSize: 11.5,
                            color: c.textoTenue,
                            marginBottom: 5,
                            marginLeft: 3,
                        }}
                    >
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
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 7,
                                    paddingHorizontal: 10,
                                    paddingVertical: 7,
                                    borderRadius: 10,
                                    backgroundColor: c.azulTenue,
                                }}
                            >
                                <Text style={{ fontFamily: fuentes.extra, fontSize: 12, color: c.azul }}>{t}</Text>
                                <Ionicons name="close" size={12} color={c.azul} />
                            </TouchableOpacity>
                        ))}
                        {tonalidades.length === 0 && (
                            <Text style={{ fontFamily: fuentes.normal, fontSize: 12, color: c.textoTenue }}>
                                Aún no hay tonalidades
                            </Text>
                        )}
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                        <View style={{ flex: 1 }}>
                            <Campo
                                etiqueta="Agregar tonalidad"
                                value={nuevaTonalidad}
                                onChangeText={setNuevaTonalidad}
                                placeholder="G"
                                maxLength={10}
                            />
                        </View>
                        <TouchableOpacity
                            onPress={agregarTonalidad}
                            style={{
                                marginTop: 21,
                                backgroundColor: c.azul,
                                paddingHorizontal: 16,
                                height: 46,
                                borderRadius: 12,
                                justifyContent: 'center',
                            }}
                        >
                            <Text style={{ fontFamily: fuentes.extra, fontSize: 12.5, color: '#FFFFFF' }}>
                                Agregar
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Campo
                        etiqueta="Tempo (BPM) · opcional"
                        value={tempo}
                        onChangeText={setTempo}
                        placeholder="96"
                        teclado="numeric"
                        maxLength={5}
                    />

                    <SeccionTitulo texto="Categorías" />
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                        {categorias.map((cat) => (
                            <Chip
                                key={cat.id_categoria}
                                texto={cat.nombre}
                                activo={seleccionActual.includes(Number(cat.id_categoria))}
                                onPress={() => alternarSeleccion(Number(cat.id_categoria))}
                            />
                        ))}
                        <TouchableOpacity
                            onPress={() => setCreando(!creando)}
                            style={{
                                paddingHorizontal: 14,
                                paddingVertical: 8,
                                borderRadius: 999,
                                borderWidth: 1.4,
                                borderStyle: 'dashed',
                                borderColor: c.linea,
                            }}
                        >
                            <Text style={{ fontFamily: fuentes.extra, fontSize: 11.5, color: c.naranja }}>
                                + Nueva
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {creando && (
                        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                            <View style={{ flex: 1 }}>
                                <Campo
                                    etiqueta="Nueva categoría"
                                    value={nuevaCategoria}
                                    onChangeText={setNuevaCategoria}
                                    placeholder="Tango"
                                    maxLength={100}
                                />
                            </View>
                            <TouchableOpacity
                                onPress={crearCategoria}
                                style={{
                                    marginTop: 21,
                                    backgroundColor: c.azul,
                                    paddingHorizontal: 16,
                                    height: 46,
                                    borderRadius: 12,
                                    justifyContent: 'center',
                                }}
                            >
                                <Text style={{ fontFamily: fuentes.extra, fontSize: 12.5, color: '#FFFFFF' }}>
                                    Crear
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {instrumentos.length > 0 && (
                        <>
                            <SeccionTitulo texto="Instrumentos" />
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                                {instrumentos.map((instr) => (
                                    <Chip
                                        key={instr.id_categoria}
                                        texto={instr.nombre}
                                        activo={seleccionActual.includes(Number(instr.id_categoria))}
                                        onPress={() => alternarSeleccion(Number(instr.id_categoria))}
                                    />
                                ))}
                            </View>
                        </>
                    )}

                    {guardando ? (
                        <ActivityIndicator size="large" color={c.azul} />
                    ) : (
                        <BotonPrimario texto="Guardar cambios" onPress={guardarCambios} />
                    )}
                </View>
            )}
        </PantallaForm>
    );
}