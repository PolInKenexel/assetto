// src/components/BottomNav.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Tema } from '../constants/theme';
import { useTema } from '../context/TemaContext';
import MenuAgregar from './MenuAgregar';

type Item = {
  icono: keyof typeof Ionicons.glyphMap;
  ruta?: string;
};

const ITEMS: Item[] = [
  { icono: 'home-outline', ruta: '/inicio' },
  { icono: 'list-outline', ruta: '/mis-listas' },
  { icono: 'add' },
  { icono: 'musical-notes-outline', ruta: '/mis-canciones' },
  { icono: 'trash-outline', ruta: '/papelera' },
];

type Props = {
  activo?: number;
};

export default function BottomNav({ activo = 0 }: Props) {
  const router = useRouter();
  const { colores } = useTema();
  const styles = useMemo(() => crearEstilos(colores), [colores]);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const alPresionar = (item: Item) => {
    if (item.ruta) {
      router.replace(item.ruta as any);
    } else {
      setMenuAbierto(true);
    }
  };

  return (
    <>
      <View style={styles.wrapper} pointerEvents="box-none">
        <View style={styles.barra}>
          {ITEMS.map((item, i) => {
            const esMas = !item.ruta;
            const esActivo = esMas ? menuAbierto : i === activo;
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

      <MenuAgregar
        visible={menuAbierto}
        onClose={() => setMenuAbierto(false)}
      />
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
  });