//Fondo.tsx
import { StyleSheet, View } from 'react-native';
import FondoOscuro from '../../assets/images/backgrounds/dark-mode-bg.svg';
import FondoClaro from '../../assets/images/backgrounds/light-mode-bg.svg';
import { useTema } from '../context/TemaContext';

export default function Fondo() {
    const { esOscuro, colores } = useTema();
    const Imagen = esOscuro ? FondoOscuro : FondoClaro;

    return (
        <View
            style={[StyleSheet.absoluteFill, { backgroundColor: colores.fondo }]}
            pointerEvents="none"
        >
            <Imagen width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
        </View>
    );
}