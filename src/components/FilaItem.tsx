// src/components/FilaItem.tsx
import { ReactNode, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tema } from '../constants/theme';
import { useTema } from '../context/TemaContext';

type Props = {
    izquierda: ReactNode;
    titulo: string;
    detalle: string;
    etiqueta?: ReactNode;
    derecha?: ReactNode;
    onPress?: () => void;
};

export default function FilaItem({ izquierda, titulo, detalle, etiqueta, derecha, onPress }: Props) {
    const { colores } = useTema();
    const styles = useMemo(() => crearEstilos(colores), [colores]);

    return (
        <Pressable style={styles.fila} onPress={onPress}>
            {izquierda}
            <View style={{ flex: 1 }}>
                <View style={styles.tituloFila}>
                    <Text style={styles.titulo}>{titulo}</Text>
                    {etiqueta}
                </View>
                <Text style={styles.detalle}>{detalle}</Text>
            </View>
            {derecha}
        </Pressable>
    );
}

const crearEstilos = (c: Tema) =>
    StyleSheet.create({
        fila: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: c.separador,
            gap: 12,
        },
        tituloFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        titulo: { fontSize: 15, fontWeight: '700', color: c.texto },
        detalle: { fontSize: 12, color: c.textoGris, marginTop: 2 },
    });