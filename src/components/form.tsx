// src/components/form.tsx
import { ReactNode } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardTypeOptions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';
import Fondo from './Fondo';

export type Colores = {
  fondo: string;
  superficie2: string;
  texto: string;
  textoSuave: string;
  textoTenue: string;
  linea: string;
  azul: string;
  azulTenue: string;
  naranja: string;
  naranjaTenue: string;
  gradienteBoton: [string, string];
};

export function useColores(): Colores {
  const { colores, esOscuro } = useTema();
  return {
    fondo: colores.fondo,
    superficie2: colores.campo,
    texto: colores.texto,
    textoSuave: colores.textoSuave,
    textoTenue: colores.textoGris,
    linea: colores.borde,
    azul: colores.azul,
    azulTenue: colores.azulClaro,
    naranja: colores.naranja,
    naranjaTenue: colores.naranjaClaro,
    gradienteBoton: esOscuro ? ['#3D6FC4', '#24509E'] : ['#24509E', '#142C57'],
  };
}

export const fuentes = {
  titulo: undefined,
  normal: undefined,
  media: undefined,
  negrita: undefined,
  extra: undefined,
};

/* ---------- Pantalla con scroll y fondo ---------- */
export function PantallaForm({ children, paddingInferior = 40 }: { children: ReactNode; paddingInferior?: number }) {
  return (
    <View style={{ flex: 1 }}>
      <Fondo />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: paddingInferior }}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/* ---------- Encabezados ---------- */
export function Encabezado({ titulo, onBack }: { titulo: string; onBack: () => void }) {
  const c = useColores();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <TouchableOpacity
        onPress={onBack}
        style={{
          width: 30,
          height: 30,
          borderRadius: 9,
          backgroundColor: c.superficie2,
          borderWidth: 1,
          borderColor: c.linea,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="chevron-back" size={16} color={c.texto} />
      </TouchableOpacity>
      <Text style={{ fontFamily: fuentes.titulo, fontWeight: '700', fontSize: 19, color: c.texto }}>{titulo}</Text>
    </View>
  );
}

export function EncabezadoPrincipal({ titulo, onPerfil }: { titulo: string; onPerfil: () => void }) {
  const c = useColores();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <Text style={{ fontFamily: fuentes.titulo, fontWeight: '700', fontSize: 22, color: c.texto }}>{titulo}</Text>
      <TouchableOpacity
        onPress={onPerfil}
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: c.azulTenue,
          borderWidth: 1,
          borderColor: c.linea,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="person-outline" size={16} color={c.azul} />
      </TouchableOpacity>
    </View>
  );
}

export function SeccionTitulo({ texto }: { texto: string }) {
  const c = useColores();
  return (
    <Text style={{ fontFamily: fuentes.extra, fontWeight: '700', fontSize: 11.5, color: c.textoSuave, marginBottom: 10 }}>{texto}</Text>
  );
}

/* ---------- Formularios ---------- */
type CampoProps = {
  etiqueta: string;
  value: string;
  onChangeText: (texto: string) => void;
  placeholder?: string;
  multilinea?: boolean;
  teclado?: KeyboardTypeOptions;
  maxLength?: number;
};

export function Campo({ etiqueta, value, onChangeText, placeholder, multilinea, teclado, maxLength }: CampoProps) {
  const c = useColores();
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontFamily: fuentes.negrita, fontWeight: '700', fontSize: 11.5, color: c.textoTenue, marginBottom: 5, marginLeft: 3 }}>
        {etiqueta}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textoTenue}
        multiline={multilinea}
        keyboardType={teclado}
        maxLength={maxLength}
        style={{
          fontFamily: fuentes.normal,
          fontSize: 13.5,
          color: c.texto,
          backgroundColor: c.superficie2,
          borderWidth: 1.4,
          borderColor: c.linea,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 13,
          minHeight: multilinea ? 72 : undefined,
          textAlignVertical: multilinea ? 'top' : 'center',
        }}
      />
    </View>
  );
}

export function BarraBusqueda({ value, onChangeText, placeholder }: { value: string; onChangeText: (t: string) => void; placeholder: string }) {
  const c = useColores();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
        paddingHorizontal: 14,
        borderRadius: 13,
        backgroundColor: c.superficie2,
        borderWidth: 1.4,
        borderColor: c.linea,
        marginBottom: 14,
      }}
    >
      <Ionicons name="search" size={15} color={c.textoTenue} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textoTenue}
        style={{ flex: 1, fontFamily: fuentes.normal, fontSize: 13, color: c.texto, paddingVertical: 12 }}
      />
    </View>
  );
}

export function BotonPrimario({ texto, onPress, deshabilitado }: { texto: string; onPress: () => void; deshabilitado?: boolean }) {
  const c = useColores();
  return (
    <TouchableOpacity onPress={onPress} disabled={deshabilitado} activeOpacity={0.85} style={{ opacity: deshabilitado ? 0.5 : 1, marginTop: 8 }}>
      <LinearGradient
        colors={c.gradienteBoton}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 13, paddingVertical: 14, alignItems: 'center' }}
      >
        <Text style={{ fontFamily: fuentes.negrita, fontWeight: '700', fontSize: 14.5, color: '#FFFFFF' }}>{texto}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

/* ---------- Chips y filtros ---------- */
type ChipProps = {
  texto: string;
  activo?: boolean;
  onPress: () => void;
  icono?: 'chevron-down' | 'close';
};

export function Chip({ texto, activo, onPress, icono }: ChipProps) {
  const c = useColores();
  const colorTexto = activo ? '#FFFFFF' : c.textoSuave;
  const contenido = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Text style={{ fontFamily: fuentes.extra, fontWeight: '700', fontSize: 11.5, color: colorTexto }}>{texto}</Text>
      {icono && <Ionicons name={icono} size={11} color={colorTexto} />}
    </View>
  );
  if (activo) {
    return (
      <TouchableOpacity onPress={onPress}>
        <LinearGradient
          colors={[c.azul, c.naranja]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 }}
        >
          {contenido}
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1.4,
        borderColor: c.linea,
        backgroundColor: c.superficie2,
      }}
    >
      {contenido}
    </TouchableOpacity>
  );
}

export function FilaFiltro({ titulo, opciones, valor, onChange }: { titulo: string; opciones: string[]; valor: string; onChange: (v: string) => void }) {
  const c = useColores();
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontFamily: fuentes.extra, fontWeight: '700', fontSize: 11.5, color: c.textoSuave, marginBottom: 8 }}>{titulo}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {opciones.map((op) => (
          <Chip key={op} texto={op} activo={valor === op} onPress={() => onChange(valor === op ? '' : op)} />
        ))}
      </ScrollView>
    </View>
  );
}

export function Segmentado<T extends string>({ opciones, valor, onChange }: { opciones: readonly T[]; valor: T; onChange: (v: T) => void }) {
  const c = useColores();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: c.superficie2,
        borderWidth: 1,
        borderColor: c.linea,
        borderRadius: 14,
        padding: 4,
        marginBottom: 20,
      }}
    >
      {opciones.map((op) => {
        const activo = op === valor;
        return (
          <TouchableOpacity key={op} onPress={() => onChange(op)} style={{ flex: 1 }}>
            {activo ? (
              <LinearGradient
                colors={[c.azul, c.naranja]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 11, paddingVertical: 10, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: fuentes.extra, fontWeight: '700', fontSize: 12.5, color: '#FFFFFF' }}>{op}</Text>
              </LinearGradient>
            ) : (
              <View style={{ paddingVertical: 10, alignItems: 'center' }}>
                <Text style={{ fontFamily: fuentes.extra, fontWeight: '700', fontSize: 12.5, color: c.textoSuave }}>{op}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ---------- Etiquetas de tonalidad ---------- */
export function Tonalidades({ lista }: { lista: string[] }) {
  const c = useColores();
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {lista.map((t) => (
        <View key={t} style={{ backgroundColor: c.azulTenue, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 }}>
          <Text style={{ fontFamily: fuentes.extra, fontWeight: '700', fontSize: 10.5, color: c.azul }}>{t}</Text>
        </View>
      ))}
    </View>
  );
}