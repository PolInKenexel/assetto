// src/components/GradientBox.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

type Props = {
    colores: string[];
    style?: StyleProp<ViewStyle>;
    children?: ReactNode;
};

export default function GradientBox({ colores, style, children }: Props) {
    return (
        <LinearGradient
            colors={colores as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={style}
        >
            {children}
        </LinearGradient>
    );
}