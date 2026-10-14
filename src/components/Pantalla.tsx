// src/components/Pantalla.tsx
import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import BottomNav from './BottomNav';
import Fondo from './Fondo';
import Header from './Header';

type Props = {
    titulo: string;
    activo?: number;
    flotante?: ReactNode;
    children: ReactNode;
};

export default function Pantalla({ titulo, activo = 0, flotante, children }: Props) {
    return (
        <View style={styles.container}>
            <Fondo />
            <ScrollView contentContainerStyle={styles.scroll}>
                <Header titulo={titulo} />
                {children}
            </ScrollView>
            {flotante}
            <BottomNav activo={activo} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 160 },
});