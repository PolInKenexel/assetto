// src/app/detalleLista.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Pantalla from '../components/Pantalla';
import { Tema } from '../constants/theme';
import { useTema } from '../context/TemaContext';

// Componente para representar una canción en la lista
function FilaCancionLista({
  cancion,
  posicion,
  c,
}: {
  cancion: any;
  posicion: number;
  c: Tema;
}) {
  const styles = useMemo(() => crearEstilosFila(c), [c]);
  
  // Procesar tonalidades de manera segura
  let tonos: string[] = [];
  try {
    tonos = typeof cancion.tonalidades === 'string' 
      ? JSON.parse(cancion.tonalidades) 
      : cancion.tonalidades;
  } catch (e) {
    tonos = [];
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.numeroCirculo}>
        <Text style={styles.numeroTexto}>{posicion}</Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.titulo} numberOfLines={1}>
          {cancion.nombre}
        </Text>
        <Text style={styles.detalle}>
          {cancion.tempo ? `${cancion.tempo} BPM` : 'Sin BPM'}
          {cancion.grupo ? ` · Grupo ${cancion.grupo}` : ''}
        </Text>
      </View>
      {cancion.grupo && (
        <View style={styles.grupoTag}>
          <Text style={styles.grupoTagTexto}>Grupo {cancion.grupo}</Text>
        </View>
      )}
    </View>
  );
}

export default function DetalleLista() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const idLista = params.id as string;
  
  const { colores } = useTema();
  const styles = useMemo(() => crearEstilos(colores), [colores]);
  
  const [lista, setLista] = useState<any>(null);
  const [canciones, setCanciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    if (!idLista) {
      router.back();
      return;
    }
    
    const obtenerDetalle = async () => {
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

        const resListas = await fetch(`${API_URL}/listas`, opcionesFetch);
        if (!resListas.ok) {
           if (resListas.status === 401) router.replace('/');
           return;
        }
        
        const dataListas = await resListas.json();
        const listaEncontrada = dataListas.find((l: any) => l.id_lista.toString() === idLista);
        
        if (listaEncontrada) {
            setLista(listaEncontrada);
        } else {
            Alert.alert("Error", "La lista no existe o fue eliminada.");
            router.back();
            return;
        }
        
        // Simulación: Como no hay endpoint de canciones por lista, mostraremos un arreglo vacío
        // hasta que implementes la ruta GET /listas/:id/canciones en el backend.
        setCanciones([]);

      } catch (error) {
        console.error('Error al obtener detalle de lista:', error);
      } finally {
        setCargando(false);
      }
    };

    obtenerDetalle();
  }, [idLista]);

  if (cargando) {
    return (
      <Pantalla titulo="Cargando..." activo={-1}>
        <ActivityIndicator size="large" color={colores.azul} style={{ marginTop: 60 }} />
      </Pantalla>
    );
  }

  return (
    <Pantalla titulo={lista?.nombre || "Detalle de lista"} activo={1}>
      <View style={styles.headerSecundario}>
        <Text style={styles.subtitulo}>
          {canciones.length} canciones · 0 grupos <Text style={styles.destaque}>Mantén y arrastra</Text>
        </Text>
      </View>
      
      {canciones.length === 0 ? (
        <Text style={styles.vacioTexto}>
          Esta lista aún no tiene canciones, o falta configurar el endpoint de canciones de la lista en tu backend.
        </Text>
      ) : (
        canciones.map((cancion, index) => (
          <FilaCancionLista 
            key={cancion.id_cancion} 
            cancion={cancion} 
            posicion={index + 1} 
            c={colores} 
          />
        ))
      )}
      
      <Pressable style={styles.grupoBoton}>
         <Text style={styles.grupoBotonTexto}>+ Arrastra aquí para crear grupo</Text>
      </Pressable>
    </Pantalla>
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
      borderBottomColor: c.linea,
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
    }
  });

const crearEstilos = (c: Tema) =>
  StyleSheet.create({
    headerSecundario: {
      marginBottom: 16,
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
    },
    vacioTexto: {
      color: c.textoGris,
      fontSize: 13,
      marginTop: 20,
      textAlign: 'center',
      paddingHorizontal: 20,
      lineHeight: 20,
    },
    grupoBoton: {
      marginTop: 24,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: c.linea,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
    },
    grupoBotonTexto: {
      color: c.naranja,
      fontSize: 12,
      fontWeight: '800',
    }
  });