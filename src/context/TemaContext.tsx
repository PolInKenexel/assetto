//TemaContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { ModoTema, Tema, temas } from '../constants/theme';

type TemaContextType = {
    colores: Tema;
    modo: ModoTema;
    esOscuro: boolean;
    setModo: (m: ModoTema) => void;
};

const TemaContext = createContext<TemaContextType | null>(null);
const CLAVE = 'modo-tema';

export function TemaProvider({ children }: { children: ReactNode }) {
    const sistema = useColorScheme();
    const [modo, setModoState] = useState<ModoTema>('sistema');

    useEffect(() => {
        AsyncStorage.getItem(CLAVE).then((valor) => {
            if (valor === 'claro' || valor === 'oscuro' || valor === 'sistema') {
                setModoState(valor);
            }
        });
    }, []);

    const setModo = (m: ModoTema) => {
        setModoState(m);
        AsyncStorage.setItem(CLAVE, m);
    };

    const esOscuro = modo === 'oscuro' || (modo === 'sistema' && sistema === 'dark');
    const colores = esOscuro ? temas.oscuro : temas.claro;

    return (
        <TemaContext.Provider value={{ colores, modo, esOscuro, setModo }}>
            {children}
        </TemaContext.Provider>
    );
}

export function useTema() {
    const ctx = useContext(TemaContext);
    if (!ctx) throw new Error('useTema debe usarse dentro de TemaProvider');
    return ctx;
}