// src/components/Header.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tema } from '../constants/theme';
import { useTema } from '../context/TemaContext';

export default function Header({ titulo }: { titulo: string }) {
    const router = useRouter();
    const { colores } = useTema();
    const styles = useMemo(() => crearEstilos(colores), [colores]);

    return (
        <>
            <View style={styles.header}>
                <Text style={styles.titulo}>{titulo}</Text>
                <Pressable style={styles.avatar} onPress={() => router.push('/perfil')}>
                    <Ionicons name="person-outline" size={18} color={colores.texto} />
                </Pressable>
            </View>
            <View style={styles.linea} />
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
        linea: { height: 2, backgroundColor: c.linea, borderRadius: 2, marginTop: 8, marginBottom: 20 },
    });