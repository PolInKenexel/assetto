import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColores, fuentes } from './form';

export default function ModalResumen({ visible, cancion, onClose }: { visible: boolean, cancion: any, onClose: () => void }) {
    const c = useColores();
    const router = useRouter();

    if (!cancion) return null;

    let tonos: string[] = [];
    try {
        tonos = typeof cancion.tonalidades === 'string' ? JSON.parse(cancion.tonalidades) : (cancion.tonalidades || []);
    } catch (e) {
        tonos = [];
    }

    const editarCancion = () => {
        onClose();
        // El 'as any' apaga la alerta de TypeScript mientras creamos el archivo
        router.push(`/editar-cancion?id=${cancion.id_cancion}` as any);
    };

    return (
        <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>

            <TouchableOpacity
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
                activeOpacity={1}
                onPress={onClose}
            >

                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => { }}
                    style={{ width: '100%', backgroundColor: c.superficie2, borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 10 }}
                >

                    <TouchableOpacity onPress={onClose} style={{ alignSelf: 'flex-end', padding: 4 }}>
                        <Ionicons name="close" size={24} color={c.textoTenue} />
                    </TouchableOpacity>

                    <Text style={{ fontFamily: fuentes.extra, fontSize: 18, color: c.texto, marginBottom: 16, textAlign: 'center' }}>
                        {cancion.nombre}
                    </Text>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>

                        <View style={{ flex: 1, minWidth: '45%', backgroundColor: c.superficie2, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: c.linea }}>
                            <Text style={{ fontFamily: fuentes.negrita, fontSize: 11, color: c.textoSuave, marginBottom: 8 }}>Tempo (BPM)</Text>
                            <Text style={{ fontFamily: fuentes.extra, fontSize: 14, color: c.azul }}>{cancion.tempo ? cancion.tempo : 'N/D'}</Text>
                        </View>

                        <View style={{ flex: 1, minWidth: '45%', backgroundColor: c.superficie2, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: c.linea }}>
                            <Text style={{ fontFamily: fuentes.negrita, fontSize: 11, color: c.textoSuave, marginBottom: 8 }}>Tonalidades</Text>

                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                {tonos.length > 0 ? (
                                    tonos.map((tono: string, idx: number) => (
                                        <View key={idx} style={{ backgroundColor: c.azulTenue, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                            <Text style={{ fontFamily: fuentes.negrita, fontSize: 11, color: c.azul }}>{tono}</Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={{ fontFamily: fuentes.normal, fontSize: 11, color: c.textoTenue }}>N/D</Text>
                                )}
                            </View>

                        </View>

                    </View>

                    <TouchableOpacity
                        onPress={editarCancion}
                        style={{ backgroundColor: c.naranja, paddingVertical: 14, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}
                    >
                        <Ionicons name="pencil" size={16} color="#FFFFFF" />
                        <Text style={{ fontFamily: fuentes.extra, fontSize: 13.5, color: '#FFFFFF' }}>Editar canción</Text>
                    </TouchableOpacity>

                </TouchableOpacity>

            </TouchableOpacity>
        </Modal>
    );
}