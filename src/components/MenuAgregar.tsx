import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColores, fuentes } from './form';

type Props = {
  visible: boolean;
  onClose: () => void;
};

// Menú que se abre al tocar el "+" de la barra inferior:
// "Agregar canción" y "Crear nueva lista"
export default function MenuAgregar({ visible, onClose }: Props) {
  const c = useColores();
  const router = useRouter();

  const ir = (ruta: '/agregar-cancion' | '/crear-lista') => {
    onClose();
    router.push(ruta);
  };

  const opciones = [
    { texto: 'Agregar canción', icono: 'musical-notes' as const, ruta: '/agregar-cancion' as const },
    { texto: 'Crear nueva lista', icono: 'list' as const, ruta: '/crear-lista' as const },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Tocar fuera de los botones cierra el menú */}
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(9,14,26,0.56)' }} onPress={onClose}>
        <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 110, gap: 12 }}>
          {opciones.map((op) => (
            <TouchableOpacity
              key={op.texto}
              activeOpacity={0.85}
              onPress={() => ir(op.ruta)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 11,
                backgroundColor: c.fondo,
                borderWidth: 1,
                borderColor: c.linea,
                borderRadius: 17,
                paddingVertical: 12,
                paddingLeft: 12,
                paddingRight: 20,
              }}
            >
              <LinearGradient
                colors={[c.azul, c.naranja]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name={op.icono} size={15} color="#FFFFFF" />
              </LinearGradient>
              <Text style={{ fontFamily: fuentes.extra, fontSize: 13, color: c.texto }}>{op.texto}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}
