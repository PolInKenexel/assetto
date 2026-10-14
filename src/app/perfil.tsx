//perfil.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import BottomNav from '../components/BottomNav';
import Fondo from '../components/Fondo';
import { ModoTema, Tema } from '../constants/theme';
import { useTema } from '../context/TemaContext';

const OPCIONES: { valor: ModoTema; texto: string }[] = [
  { valor: 'claro', texto: 'Claro' },
  { valor: 'oscuro', texto: 'Oscuro' },
  { valor: 'sistema', texto: 'Sistema' },
];

export default function Perfil() {
  const router = useRouter();
  const { colores, modo, setModo } = useTema();
  const styles = useMemo(() => crearEstilos(colores), [colores]);
  const [modoMusico, setModoMusico] = useState(true);

  const cerrarSesion = () => {
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <Fondo />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Encabezado */}
        <View style={styles.header}>
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={18} color={colores.texto} />
          </Pressable>
          <Text style={styles.titulo}>Perfil</Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarAnillo}>
          <LinearGradient
            colors={['#3A5BA9', '#E8793A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Ionicons name="person-outline" size={36} color="#FFFFFF" />
          </LinearGradient>
        </View>
        <Text style={styles.nombre}>Username</Text>
        <Text style={styles.correo}>username@email.com</Text>

        {/* Estadísticas */}
        <View style={styles.statsFila}>
          <View style={styles.stat}>
            <Text style={styles.statNumero}>6</Text>
            <Text style={styles.statTexto}>Listas</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumero}>10</Text>
            <Text style={styles.statTexto}>Canciones</Text>
          </View>
        </View>

        {/* Modo músico */}
        <View style={styles.modoFila}>
          <Text style={styles.modoTexto}>Modo Músico</Text>
          <Switch
            value={modoMusico}
            onValueChange={setModoMusico}
            trackColor={{ false: colores.borde, true: colores.azul }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Cerrar sesión */}
        <Pressable style={styles.botonSalir} onPress={cerrarSesion}>
          <Text style={styles.botonSalirTexto}>Cerrar sesión</Text>
        </Pressable>

        {/* Ajustes */}
        <Text style={styles.ajustes}>Ajustes</Text>

        <View style={styles.temaBloque}>
          <Text style={styles.ajusteTexto}>Tema</Text>
          <View style={styles.opcionesFila}>
            {OPCIONES.map((o) => {
              const activo = modo === o.valor;
              return (
                <Pressable
                  key={o.valor}
                  onPress={() => setModo(o.valor)}
                  style={[styles.opcion, activo && styles.opcionActiva]}
                >
                  <Text style={[styles.opcionTexto, activo && styles.opcionTextoActivo]}>
                    {o.texto}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable style={styles.ajusteFila}>
          <Text style={styles.ajusteTexto}>Privacidad</Text>
          <Ionicons name="chevron-forward" size={18} color={colores.textoGris} />
        </Pressable>
      </ScrollView>

      <BottomNav activo={-1} />
    </View>
  );
}

const crearEstilos = (c: Tema) =>
  StyleSheet.create({
    container: { flex: 1 },
    scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 140 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    back: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: c.campo,
      borderWidth: 1,
      borderColor: c.borde,
      alignItems: 'center',
      justifyContent: 'center',
    },
    titulo: { fontSize: 18, fontWeight: '800', color: c.texto },
    avatarAnillo: {
      alignSelf: 'center',
      marginTop: 20,
      width: 108,
      height: 108,
      borderRadius: 54,
      borderWidth: 2,
      borderColor: c.borde,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    nombre: { textAlign: 'center', fontSize: 20, fontWeight: '800', color: c.texto, marginTop: 12 },
    correo: { textAlign: 'center', fontSize: 12, color: c.textoGris, marginTop: 2 },
    statsFila: { flexDirection: 'row', gap: 12, marginTop: 20 },
    stat: {
      flex: 1,
      backgroundColor: c.campo,
      borderWidth: 1,
      borderColor: c.borde,
      borderRadius: 16,
      paddingVertical: 20,
      alignItems: 'center',
    },
    statNumero: { fontSize: 26, fontWeight: '800', color: c.azul },
    statTexto: { fontSize: 11, color: c.textoGris, marginTop: 4 },
    modoFila: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 20,
    },
    modoTexto: { fontSize: 14, fontWeight: '700', color: c.texto },
    botonSalir: {
      marginTop: 16,
      borderWidth: 1.5,
      borderColor: c.naranja,
      borderRadius: 12,
      paddingVertical: 13,
      alignItems: 'center',
    },
    botonSalirTexto: { color: c.naranja, fontWeight: '700', fontSize: 14 },
    ajustes: { fontSize: 13, fontWeight: '700', color: c.textoSuave, marginTop: 24, marginBottom: 4 },
    temaBloque: {
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.separador,
    },
    opcionesFila: { flexDirection: 'row', gap: 8, marginTop: 10 },
    opcion: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
      borderWidth: 1,
      backgroundColor: c.campo,
      borderColor: c.borde,
    },
    opcionActiva: { backgroundColor: c.azul, borderColor: c.azul },
    opcionTexto: { fontSize: 12, fontWeight: '700', color: c.textoSuave },
    opcionTextoActivo: { color: '#FFFFFF' },
    ajusteFila: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.separador,
    },
    ajusteTexto: { fontSize: 14, fontWeight: '700', color: c.texto },
  });