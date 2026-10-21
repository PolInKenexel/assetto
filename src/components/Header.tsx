// src/components/Header.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Tema } from '../constants/theme';
import { useTema } from '../context/TemaContext';

export function LineaCurly({
    color,
    marginTop = 8,
    marginBottom = 20,
}: {
    color?: string;
    marginTop?: number;
    marginBottom?: number;
}) {
    const { colores } = useTema();
    const colorFinal = color || colores.naranja;

    // Menos ondas y más anchas = curvas mucho más abiertas y suaves
    const totalOndas = 7;
    const anchoOnda = 60;
    const mitad = anchoOnda / 2;
    const cuarto = anchoOnda / 4;

    const d = Array.from({ length: totalOndas })
        .map((_, i) => {
            const x = i * anchoOnda;
            return `${i === 0 ? `M 0 5` : ''} Q ${x + cuarto} 1.5, ${x + mitad} 5 T ${x + anchoOnda} 5`;
        })
        .join(' ');

    return (
        <View style={{ height: 10, width: '100%', overflow: 'hidden', marginTop, marginBottom }}>
            <Svg
                height="10"
                width="100%"
                viewBox={`0 0 ${totalOndas * anchoOnda} 10`}
                preserveAspectRatio="none"
            >
                <Path
                    d={d}
                    fill="none"
                    stroke={colorFinal}
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </Svg>
        </View>
    );
}

type Props = {
    titulo: string;
    colorLinea?: 'naranja' | 'azul';
};

export default function Header({ titulo, colorLinea = 'naranja' }: Props) {
    const router = useRouter();
    const { colores } = useTema();
    const styles = useMemo(() => crearEstilos(colores), [colores]);

    const colorHex = colorLinea === 'azul' ? colores.azul : colores.naranja;

    return (
        <>
            <View style={styles.header}>
                <Text style={styles.titulo}>{titulo}</Text>
                <Pressable style={styles.avatar} onPress={() => router.push('/perfil')}>
                    <Ionicons name="person-outline" size={18} color={colores.texto} />
                </Pressable>
            </View>
            <LineaCurly color={colorHex} marginTop={8} marginBottom={20} />
        </>
    );
}

const crearEstilos = (c: Tema) =>
    StyleSheet.create({
        header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        titulo: { fontSize: 26, fontWeight: '800', color: c.texto },
        avatar: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: c.naranjaClaro,
            alignItems: 'center',
            justifyContent: 'center',
        },
    });