// src/constants/cancionesDemo.ts

export type Cancion = {
  id_cancion: number;
  nombre: string;
  tonalidades: string[] | string;
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
  // Notación latina
  'DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI', 'DOM', 'LAM', 'FAM', 'REBM', 'SIBM'
];

export function filtrarCanciones(canciones: Cancion[], f: Filtros): Cancion[] {
  const texto = f.busqueda.trim().toLowerCase();
  const catFiltro = f.categoria.trim().toLowerCase();
  const instFiltro = f.instrumento.trim().toLowerCase();
  const tonoFiltro = f.tonalidad.trim().toLowerCase();

  return canciones.filter((x) => {
    const listaTonos = Array.isArray(x.tonalidades)
      ? x.tonalidades
      : typeof x.tonalidades === 'string'
      ? x.tonalidades.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const tieneTono =
      tonoFiltro === '' ||
      listaTonos.some((t) => t.trim().toLowerCase() === tonoFiltro);

    const listaCategorias = Array.isArray(x.categorias) ? x.categorias : [];
    const tieneCategoria =
      catFiltro === '' ||
      listaCategorias.some((c) => c.trim().toLowerCase() === catFiltro);

    const listaInstrumentos = Array.isArray(x.instrumentos) ? x.instrumentos : [];
    const tieneInstrumento =
      instFiltro === '' ||
      listaInstrumentos.some((i) => i.trim().toLowerCase() === instFiltro);

    const coincideTexto =
      texto === '' ||
      x.nombre.toLowerCase().includes(texto) ||
      listaCategorias.some((c) => c.toLowerCase().includes(texto)) ||
      listaInstrumentos.some((i) => i.toLowerCase().includes(texto));

    const minVal = f.bpmMin.trim() !== '' ? Number(f.bpmMin) : null;
    const maxVal = f.bpmMax.trim() !== '' ? Number(f.bpmMax) : null;

    const cumpleBpmMin =
      minVal === null || !Number.isFinite(minVal) || (x.tempo !== null && x.tempo >= minVal);
    const cumpleBpmMax =
      maxVal === null || !Number.isFinite(maxVal) || (x.tempo !== null && x.tempo <= maxVal);

    return (
      coincideTexto &&
      tieneCategoria &&
      tieneInstrumento &&
      tieneTono &&
      cumpleBpmMin &&
      cumpleBpmMax
    );
  });
}
