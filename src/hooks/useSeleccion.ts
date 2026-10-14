// src/hooks/useSeleccion.ts
import { useState } from 'react';

export function useSeleccion() {
    const [seleccion, setSeleccion] = useState<number[]>([]);

    const alternar = (id: number) =>
        setSeleccion((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );

    const estaSeleccionado = (id: number) => seleccion.includes(id);
    const limpiar = () => setSeleccion([]);

    return { seleccion, alternar, estaSeleccionado, limpiar };
}