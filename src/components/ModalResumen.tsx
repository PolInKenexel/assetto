// src/components/ModalResumen.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Text, TouchableOpacity, View } from 'react-native';
import { fuentes, useColores } from './form';

export default function ModalResumen({
  visible,
  cancion,
  onClose,
  onEliminada,
}: {
  visible: boolean;
  cancion: any;
  onClose: () => void;
  onEliminada?: (idCancion: number) => void;
}) {
  const c = useColores();
  const router = useRouter();
  const [eliminando, setEliminando] = useState(false);

  if (!cancion) return null;

  let tonos: string[] = [];
  try {
    tonos =
      typeof cancion.tonalidades === 'string'
        ? JSON.parse(cancion.tonalidades)
        : cancion.tonalidades || [];
  } catch {
    tonos = [];
  }

  const categorias: string[] =
    Array.isArray(cancion.categorias) && cancion.categorias.length > 0
      ? cancion.categorias
      : cancion.categorias_texto
      ? cancion.categorias_texto.split('||').filter(Boolean)
      : [];

  const instrumentos: string[] =
    Array.isArray(cancion.instrumentos) && cancion.instrumentos.length > 0
      ? cancion.instrumentos
      : cancion.instrumentos_texto
      ? cancion.instrumentos_texto.split('||').filter(Boolean)
      : [];

  const editarCancion = () => {
    onClose();
    router.push({ pathname: '/editar-cancion', params: { id: cancion.id_cancion } });
  };

  const confirmarMoverAPapelera = () => {
    Alert.alert(
      'Enviar a la papelera',
      `¿Quieres mover "${cancion.nombre}" a la papelera?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Mover a papelera',
          style: 'destructive',
          onPress: async () => {
            setEliminando(true);
            try {
              const token = await AsyncStorage.getItem('userToken');
              if (!token) {
                onClose();
                router.replace('/');
                return;
              }

              const res = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/canciones/${cancion.id_cancion}`,
                {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              if (res.ok) {
                onClose();
                onEliminada?.(cancion.id_cancion);
              } else {
                const err = await res.json().catch(() => ({}));
                Alert.alert('Error', err.error || 'No se pudo mover la canción a la papelera.');
              }
            } catch {
              Alert.alert('Error de red', 'No se pudo conectar con el servidor.');
            } finally {
              setEliminando(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {}}
          style={{
            width: '100%',
            backgroundColor: c.superficie2,
            borderRadius: 20,
            padding: 24,
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 10,
            elevation: 10,
            borderWidth: 1,
            borderColor: c.linea,
          }}
        >
          <TouchableOpacity onPress={onClose} style={{ alignSelf: 'flex-end', padding: 4 }}>
            <Ionicons name="close" size={24} color={c.textoTenue} />
          </TouchableOpacity>

          <Text
            style={{
              fontFamily: fuentes.extra,
              fontWeight: '800',
              fontSize: 18,
              color: c.texto,
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            {cancion.nombre}
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <View
              style={{
                flex: 1,
                minWidth: '45%',
                backgroundColor: c.fondo,
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: c.linea,
              }}
            >
              <Text
                style={{
                  fontFamily: fuentes.negrita,
                  fontWeight: '700',
                  fontSize: 11,
                  color: c.textoSuave,
                  marginBottom: 8,
                }}
              >
                Tempo (BPM)
              </Text>
              <Text
                style={{
                  fontFamily: fuentes.extra,
                  fontWeight: '800',
                  fontSize: 14,
                  color: c.azul,
                }}
              >
                {cancion.tempo ? `${cancion.tempo} BPM` : 'N/D'}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                minWidth: '45%',
                backgroundColor: c.fondo,
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: c.linea,
              }}
            >
              <Text
                style={{
                  fontFamily: fuentes.negrita,
                  fontWeight: '700',
                  fontSize: 11,
                  color: c.textoSuave,
                  marginBottom: 8,
                }}
              >
                Tonalidades
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {tonos.length > 0 ? (
                  tonos.map((tono: string, idx: number) => (
                    <View
                      key={idx}
                      style={{
                        backgroundColor: c.azulTenue,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: fuentes.negrita,
                          fontWeight: '700',
                          fontSize: 11,
                          color: c.azul,
                        }}
                      >
                        {tono}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ fontFamily: fuentes.normal, fontSize: 11, color: c.textoTenue }}>
                    N/D
                  </Text>
                )}
              </View>
            </View>
          </View>

          {(categorias.length > 0 || instrumentos.length > 0) && (
            <View
              style={{
                backgroundColor: c.fondo,
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: c.linea,
                marginBottom: 18,
                gap: 8,
              }}
            >
              {categorias.length > 0 && (
                <View>
                  <Text
                    style={{
                      fontFamily: fuentes.negrita,
                      fontWeight: '700',
                      fontSize: 11,
                      color: c.textoSuave,
                      marginBottom: 4,
                    }}
                  >
                    Categorías
                  </Text>
                  <Text style={{ fontSize: 12.5, color: c.texto, fontWeight: '600' }}>
                    {categorias.join(' · ')}
                  </Text>
                </View>
              )}

              {instrumentos.length > 0 && (
                <View>
                  <Text
                    style={{
                      fontFamily: fuentes.negrita,
                      fontWeight: '700',
                      fontSize: 11,
                      color: c.textoSuave,
                      marginBottom: 4,
                    }}
                  >
                    Instrumentos
                  </Text>
                  <Text style={{ fontSize: 12.5, color: c.texto, fontWeight: '600' }}>
                    {instrumentos.join(' · ')}
                  </Text>
                </View>
              )}
            </View>
          )}

          {eliminando ? (
            <ActivityIndicator size="small" color={c.naranja} style={{ marginVertical: 10 }} />
          ) : (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={editarCancion}
                style={{
                  flex: 1,
                  backgroundColor: c.naranja,
                  paddingVertical: 13,
                  borderRadius: 12,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Ionicons name="pencil" size={16} color="#FFFFFF" />
                <Text
                  style={{
                    fontFamily: fuentes.extra,
                    fontWeight: '700',
                    fontSize: 13.5,
                    color: '#FFFFFF',
                  }}
                >
                  Editar canción
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmarMoverAPapelera}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 13,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: c.naranja,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="trash-outline" size={18} color={c.naranja} />
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
