//layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TemaProvider, useTema } from '../context/TemaContext';

function Navegacion() {
  const { esOscuro } = useTema();
  return (
    <>
      <StatusBar style={esOscuro ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <TemaProvider>
      <Navegacion />
    </TemaProvider>
  );
}