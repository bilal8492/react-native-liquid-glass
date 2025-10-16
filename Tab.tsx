import React from 'react';
import { Text, Pressable, View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';
import { LiquidGlass } from './LiquidGlass';
import { Canvas } from '@shopify/react-native-skia';
import { Pattern } from './Pattern';

export const Tab = ({ label, isActive, onPress, width, height }) => {
    const animatedOpacity = useSharedValue(isActive ? 1 : 0);

    React.useEffect(() => {
        animatedOpacity.value = withSpring(isActive ? 1 : 0, { damping: 12, stiffness: 120 });
    }, [isActive]);

    return (
        <Pressable onPress={onPress} style={{ width, height, marginHorizontal: 8 }}>
            <View style={{ flex: 1,isolation: "isolate", justifyContent: 'center', alignItems: 'center', }}>
                <Canvas style={{ height: 100, width: 300, justifyContent: 'center', alignItems: 'center', position: 'absolute', top: 0, left: 0 }}>
                    <Pattern />
                    {isActive &&
                    <LiquidGlass width={width} height={height} x={0} y={0} radius={10} />
                    }
                </Canvas>
                <Text style={styles.label}>{label}</Text>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    label: {
        position: 'absolute',
        fontWeight: '600',
        color: '#999999',
        mixBlendMode: "color-dodge",
    },
});
