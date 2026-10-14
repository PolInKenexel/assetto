import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Tema } from '../constants/theme';
import { useTema } from '../context/TemaContext';

export default function PerfilButton() {
    const router = useRouter();
    const { colores } = useTema();
    const styles = useMemo(() => crearEstilos(colores), [colores]);

    return (
        <Pressable style={styles.avatar} onPress={() => router.push('/perfil')}>
            <Ionicons name="person-outline" size={18} color={colores.texto} />
        </Pressable>
    );
}

const crearEstilos = (c: Tema) =>
    StyleSheet.create({
        avatar: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: c.naranjaClaro,
            alignItems: 'center',
            justifyContent: 'center',
        },
    });