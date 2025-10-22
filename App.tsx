/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LiquidGlass, BlendMode } from './LiquidGlass';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View
        style={{
          height: 400,
          width: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'pink',
          marginTop: 200,
        }}
      >
        <LiquidGlass
          glassColor="rgba(0, 133, 235, 1)"
          width={361}
          height={174}
          blendMode={BlendMode.Darken}
          x={20}
          y={50}
          radius={40}
          glassLayers={[
            {
              color: 'rgba(255, 255, 255, 0.05)',
              blendMode: BlendMode.HardLight,
            }, // Purple highlight
            {
              color: 'rgba(255, 255, 255, 0.5)',
              blendMode: BlendMode.HardLight,
            }, // Purple highlight
            { color: 'rgba(255, 255, 255, 1)', blendMode: BlendMode.Saturation }, // White sheen
            { color: 'rgba(153, 153, 153, 1)', blendMode: BlendMode.Overlay }, // Subtle shadow
            { color: 'rgba(0, 133, 235, 1)', blendMode: BlendMode.Darken }, // Gold tint
          ]}
        />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8d9ea4ff',
    isolation: 'isolate',
  },
});

export default App;
