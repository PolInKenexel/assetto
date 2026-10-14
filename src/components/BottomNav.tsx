// src/components/BottomNav.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Tema } from '../constants/theme';
import { useTema } from '../context/TemaContext';

type Item = {
  icono: keyof typeof Ionicons.glyphMap;
  ruta?: string; // sin ruta = abre el menú de agregar
};

const ITEMS: Item[] = [
  { icono: 'home-outline', ruta: '/inicio' },
  { icono: 'list-outline', ruta: '/mis-listas' },
  { icono: 'add' }, // menú: nueva lista / nueva canción
  { icono: 'swap-horizontal', ruta: '/instrumentos' },
  { icono: 'trash-outline', ruta: '/papelera' },
];

type Props = {
  activo?: number;
  onNuevaLista?: () => void;
  onNuevaCancion?: () => void;
};

export default function BottomNav({
  activo = 0,
  onNuevaLista = () => console.log('Nueva lista'),
  onNuevaCancion = () => console.log('Nueva canción'),
}: Props) {
  const router = useRouter();
  const { colores } = useTema();
  const styles = useMemo(() => crearEstilos(colores), [colores]);
  const [menu, setMenu] = useState(false);

  const alPresionar = (item: Item) => {
    if (item.ruta) {
      router.replace(item.ruta as any);
    } else {
      setMenu(true);
    }
  };

  const elegir = (accion: () => void) => {
    setMenu(false);
    accion();
  };

  return (
    <>
      <View style={styles.wrapper} pointerEvents="box-none">
        <View style={styles.barra}>
          {ITEMS.map((item, i) => {
            const esMas = !item.ruta; // el botón "+"
            const esActivo = esMas ? menu : i === activo;
            return (
              <Pressable
                key={i}
                style={[styles.item, esActivo && styles.itemActivo]}
                onPress={() => alPresionar(item)}
              >
                <Ionicons
                  name={item.icono}
                  size={22}
                  color={esActivo ? colores.naranja : colores.textoGris}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      <Modal visible={menu} transparent animationType="fade" onRequestClose={() => setMenu(false)}>
        <Pressable style={styles.fondoModal} onPress={() => setMenu(false)}>
          <View style={styles.menu}>
            <Pressable style={styles.opcion} onPress={() => elegir(onNuevaLista)}>
              <View style={styles.opcionIcono}>
                <Ionicons name="list-outline" size={18} color={colores.naranja} />
              </View>
              <Text style={styles.opcionTexto}>Nueva lista</Text>
            </Pressable>
            <View style={styles.separador} />
            <Pressable style={styles.opcion} onPress={() => elegir(onNuevaCancion)}>
              <View style={styles.opcionIcono}>
                <Ionicons name="musical-notes-outline" size={18} color={colores.naranja} />
              </View>
              <Text style={styles.opcionTexto}>Nueva canción</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const crearEstilos = (c: Tema) =>
  StyleSheet.create({
    wrapper: { position: 'absolute', left: 16, right: 16, bottom: 20 },
    barra: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: c.barra,
      borderWidth: 1,
      borderColor: c.borde,
      borderRadius: 28,
      paddingVertical: 10,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 8,
    },
    item: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemActivo: { backgroundColor: c.naranjaClaro },
    fondoModal: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingBottom: 100,
    },
    menu: {
      width: 220,
      backgroundColor: c.fondo,
      borderWidth: 1,
      borderColor: c.borde,
      borderRadius: 16,
      paddingVertical: 6,
      elevation: 10,
    },
    opcion: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    opcionIcono: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.naranjaClaro,
      alignItems: 'center',
      justifyContent: 'center',
    },
    opcionTexto: { fontSize: 14, fontWeight: '700', color: c.texto },
    separador: { height: 1, backgroundColor: c.separador, marginHorizontal: 14 },
  });