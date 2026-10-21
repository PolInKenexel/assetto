// Datos de ejemplo. Reemplázalos con las canciones reales que regrese el servidor (carpeta /server).

export type Cancion = {
  id_cancion: number;
  nombre: string;
  tonalidades: string[]; // una canción puede tener varias
  tempo: number | null; // BPM, opcional
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

export const CANCIONES_DEMO: Cancion[] = [
  { id_cancion: 1, nombre: 'Vals en Sol mayor', tonalidades: ['G', 'Em'], tempo: 96, categorias: ['Vals'], instrumentos: ['Guitarra', 'Voz'] },
  { id_cancion: 2, nombre: 'Balada nocturna', tonalidades: ['Dm'], tempo: 72, categorias: ['Balada'], instrumentos: ['Piano'] },
  { id_cancion: 3, nombre: 'Bossa de otoño', tonalidades: ['Am', 'C'], tempo: 110, categorias: ['Bossa'], instrumentos: ['Guitarra'] },
  { id_cancion: 4, nombre: 'Camino de sol', tonalidades: ['G'], tempo: 104, categorias: ['Bossa'], instrumentos: ['Guitarra'] },
  { id_cancion: 5, nombre: 'Balada de la lluvia', tonalidades: ['G', 'D'], tempo: 78, categorias: ['Balada'], instrumentos: ['Guitarra', 'Voz'] },
  { id_cancion: 6, nombre: 'Rock del patio', tonalidades: ['G'], tempo: 120, categorias: ['Rock'], instrumentos: ['Guitarra', 'Batería'] },
  { id_cancion: 7, nombre: 'Canción de cuna', tonalidades: ['C'], tempo: null, categorias: ['Infantil'], instrumentos: ['Voz'] },
];

const unicos = (lista: string[]): string[] => [...new Set(lista)];

// Opciones de los filtros: salen de lo que ya hay guardado
export const CATEGORIAS = unicos(CANCIONES_DEMO.flatMap((x) => x.categorias));
export const INSTRUMENTOS = unicos(CANCIONES_DEMO.flatMap((x) => x.instrumentos));
export const TONALIDADES = unicos(CANCIONES_DEMO.flatMap((x) => x.tonalidades));

export function filtrarCanciones(canciones: Cancion[], f: Filtros): Cancion[] {
  const texto = f.busqueda.trim().toLowerCase();
  return canciones.filter(
    (x) =>
      (texto === '' || x.nombre.toLowerCase().includes(texto)) &&
      (f.categoria === '' || x.categorias.includes(f.categoria)) &&
      (f.instrumento === '' || x.instrumentos.includes(f.instrumento)) &&
      (f.tonalidad === '' || x.tonalidades.includes(f.tonalidad)) &&
      (f.bpmMin === '' || (x.tempo !== null && x.tempo >= Number(f.bpmMin))) &&
      (f.bpmMax === '' || (x.tempo !== null && x.tempo <= Number(f.bpmMax)))
  );
}
