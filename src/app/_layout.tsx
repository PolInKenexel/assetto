// src/app/layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TemaProvider, useTema } from '../context/TemaContext';

function Navegacion() {
  // Obtener tema actual
  const { esOscuro } = useTema();
  return (
    <>
      {/*Ajustar iconos y cabecera segun el tema*/}
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