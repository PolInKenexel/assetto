//theme.ts
export const temas = {
    claro: {
        fondo: '#FFFFFF',
        texto: '#1B2A4A',
        textoSuave: '#5B6B8C',
        textoGris: '#8A97B0',
        azul: '#24509E',
        azulClaro: '#E4ECFB',
        naranja: '#F0752A',
        naranjaClaro: '#FCE6D6',
        linea: '#F4B48A',
        campo: '#F3F6FB',
        borde: '#E1E8F2',
        separador: '#EEF2F8',
        barra: 'rgba(255,255,255,0.94)',
    },
    oscuro: {
        fondo: '#0E1525',
        texto: '#E6EDFB',
        textoSuave: '#C7D8FA',
        textoGris: '#8A97B0',
        azul: '#6E9EED',
        azulClaro: '#1B2A4A',
        naranja: '#FF9757',
        naranjaClaro: '#3A2618',
        linea: '#FFC79A',
        campo: '#17213A',
        borde: '#26345A',
        separador: '#1F2A47',
        barra: 'rgba(23,33,58,0.96)',
    },
};

export type Tema = typeof temas.claro;
export type ModoTema = 'claro' | 'oscuro' | 'sistema';