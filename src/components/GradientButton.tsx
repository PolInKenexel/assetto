import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text } from 'react-native';

type Props = { title: string; onPress: () => void };

export default function GradientButton({ title, onPress }: Props) {
  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={['#24509E', '#142C57']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.boton}
      >
        <Text style={styles.texto}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  texto: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});