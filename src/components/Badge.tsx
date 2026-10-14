// src/components/Badge.tsx
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Tema } from '../constants/theme';
import { useTema } from '../context/TemaContext';

type Props = { texto: string; variante?: 'azul' | 'naranja' };

export default function Badge({ texto, variante = 'azul' }: Props) {
    const { colores } = useTema();
    const styles = useMemo(() => crearEstilos(colores), [colores]);
    const esAzul = variante === 'azul';

    return (
        <View style={[styles.badge, { backgroundColor: esAzul ? colores.azulClaro : colores.naranjaClaro }]}>
            <Text style={[styles.texto, { color: esAzul ? colores.azul : colores.naranja }]}>{texto}</Text>
        </View>
    );
}

const crearEstilos = (_c: Tema) =>
    StyleSheet.create({
        badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
        texto: { fontSize: 12, fontWeight: '700' },
    });