import { useMemo } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Tema } from '../constants/theme';
import { useTema } from '../context/TemaContext';

type Props = TextInputProps & { label: string };

export default function AuthInput({ label, style, ...resto }: Props) {
  const { colores } = useTema();
  const styles = useMemo(() => crearEstilos(colores), [colores]);

  return (
    <View style={styles.grupo}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={colores.textoGris}
        {...resto}
      />
    </View>
  );
}

const crearEstilos = (c: Tema) =>
  StyleSheet.create({
    grupo: { marginBottom: 14 },
    label: { fontSize: 12, fontWeight: '700', color: c.textoSuave, marginBottom: 6 },
    input: {
      backgroundColor: c.campo,
      borderWidth: 1,
      borderColor: c.borde,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      color: c.texto,
    },
  });