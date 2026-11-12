// src/constants/cancionesDemo.ts

export type Cancion = {
  id_cancion: number;
  nombre: string;
  tonalidades: string[] | string; // Permitimos string para compatibilidad con crear-lista
  tempo: number | null; 
  categorias: string[];
  instrumentos: string[];
};

export type Filtros = {
  busqueda: string;
  categoria: string;
  instrumento: string;
  tonalidad: string;
  bpmMin: string;
  bpmMax: string;
};

export const FILTROS_VACIOS: Filtros = {
  busqueda: '',
  categoria: '',
  instrumento: '',
  tonalidad: '',
  bpmMin: '',
  bpmMax: '',
};

// Dejamos las canciones demo por si alguna otra pantalla vieja las usa,
// pero ya no dependeremos de ellas para los filtros.
export const CANCIONES_DEMO: Cancion[] = [
  { id_cancion: 1, nombre: 'Vals en Sol mayor', tonalidades: ['G', 'Em'], tempo: 96, categorias: ['Vals'], instrumentos: ['Guitarra', 'Voz'] },
  { id_cancion: 2, nombre: 'Balada nocturna', tonalidades: ['Dm'], tempo: 72, categorias: ['Balada'], instrumentos: ['Piano'] },
  { id_cancion: 3, nombre: 'Bossa de otoño', tonalidades: ['Am', 'C'], tempo: 110, categorias: ['Bossa'], instrumentos: ['Guitarra'] },
  { id_cancion: 4, nombre: 'Camino de sol', tonalidades: ['G'], tempo: 104, categorias: ['Bossa'], instrumentos: ['Guitarra'] },
  { id_cancion: 5, nombre: 'Balada de la lluvia', tonalidades: ['G', 'D'], tempo: 78, categorias: ['Balada'], instrumentos: ['Guitarra', 'Voz'] },
  { id_cancion: 6, nombre: 'Rock del patio', tonalidades: ['G'], tempo: 120, categorias: ['Rock'], instrumentos: ['Guitarra', 'Batería'] },
  { id_cancion: 7, nombre: 'Canción de cuna', tonalidades: ['C'], tempo: null, categorias: ['Infantil'], instrumentos: ['Voz'] },
];


// --- OPCIONES PREDETERMINADAS PARA LOS FILTROS --- //

export const CATEGORIAS = [
  'Rock Clásico', 'Acústico', 'Jazz Fusion', 'Pop Latino', 'Práctica Diaria',
  'Rock', 'Pop', 'Balada', 'Vals', 'Bossa', 'Infantil', 'Cumbia', 'Norteño'
];

export const INSTRUMENTOS = [
  'Guitarra', 'Guitarra Eléctrica', 'Piano', 'Teclado', 'Voz', 'Batería', 'Bajo', 'Violín', 'Flauta'
];

export const TONALIDADES = [
  // Notación anglosajona (Mayores y menores)
  'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'Bbm', 'Bm',
  
  // Notación latina (que también detecté en tus inserts)
  'DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI', 'DOM', 'LAM', 'FAM', 'REBM', 'SIBM'
];

export function filtrarCanciones(canciones: Cancion[], f: Filtros): Cancion[] {
  const texto = f.busqueda.trim().toLowerCase();
  
  return canciones.filter((x) => {
    // Manejo seguro por si tonalidades viene como arreglo o como string unido por comas
    const tieneTono = f.tonalidad === '' || 
      (Array.isArray(x.tonalidades) ? x.tonalidades.includes(f.tonalidad) : x.tonalidades.includes(f.tonalidad));

    return (
      (texto === '' || x.nombre.toLowerCase().includes(texto)) &&
      (f.categoria === '' || x.categorias.includes(f.categoria)) &&
      (f.instrumento === '' || x.instrumentos.includes(f.instrumento)) &&
      tieneTono &&
      (f.bpmMin === '' || (x.tempo !== null && x.tempo >= Number(f.bpmMin))) &&
      (f.bpmMax === '' || (x.tempo !== null && x.tempo <= Number(f.bpmMax)))
    );
  });
}