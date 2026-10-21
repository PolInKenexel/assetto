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
    // Secuencia intercalada: Inicio (0) = naranja, Listas (1) = azul, Canciones (3) = naranja, Papelera (4) = azul
    const colorLinea = activo === 1 || activo === 4 ? 'azul' : 'naranja';

    return (
        <View style={styles.container}>
            <Fondo />
            <ScrollView contentContainerStyle={styles.scroll}>
                <Header titulo={titulo} colorLinea={colorLinea} />
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