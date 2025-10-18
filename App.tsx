/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { NewAppScreen } from '@react-native/new-app-screen';
import { Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { TabBar } from './TabBar';
import { Pattern } from './Pattern';
import { BackdropFilter, BlendMode, Canvas, ImageFilter, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { LiquidGlass } from './LiquidGlass';
import { BlurView } from '@react-native-community/blur';
import GlassCircle from './ios/GlassCircle';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  return (
    <SafeAreaProvider style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {/* <View style={styles.card}>
        <View style={[styles.overlay]} />

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Book A Test Drive</Text>
            <View style={{ isolation: 'isolate' }}>
              <View style={{ mixBlendMode: 'color-dodge' }}>
                <Text style={styles.subtitle}>
                  Cancellation Up to 1 day before start time
                </Text>
              </View>
            </View>
          </View>
          <Text>Calender Icon</Text>
        </View>

        <View style={styles.bottom}>
          <View>
            <Text style={styles.location}>Mumbai</Text>
            <Text style={styles.price}>From 7.4 Lakhs</Text>
          </View>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Book now</Text>
          </TouchableOpacity>
        </View>
      </View> */}
      {/* <TabBar /> */}
      <View style={{ height: 400, width: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'pink', marginTop: 200 }}>
        <LiquidGlass width={361} height={74} x={20} y={50} radius={40} />
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
  card: {
    // backgroundColor: "#A6A6A6B2",
    // backgroundColor: "#e32323b2",
    borderRadius: 24,
    // padding: 16,
    width: "90%",
    height: 174,
    alignSelf: "center",
    marginTop: 20,
    // isolation: 'isolate',
    // mixBlendMode: 'color-dodge',
    overflow: 'hidden',
    position: 'absolute',
    top: 150,
    zIndex: 10,
  },
  absolute: {
    ...StyleSheet.absoluteFill,
    borderRadius: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  subtitle: {
    fontSize: 13,
    color: "#999999",
    marginTop: 2,
    // mixBlendMode: 'color-dodge',
  },
  bottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: '#ffffff',
    // mixBlendMode: 'normal',
    borderRadius: 36,
    paddingLeft: 20,
    paddingRight: 16,
    paddingVertical: 12,
    margin: 6,
  },
  location: {
    fontSize: 13,
    color: "#777",
  },
  price: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  overlay: {
    // backgroundColor: 'rgba(166, 166, 166, 0.7)',
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(166, 166, 166, 0.2)',
    // mixBlendMode: 'multiply',

    // isolation:'isolate'
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  colorLayer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(166, 166, 166, 0.7)',
    mixBlendMode: 'color-dodge',
  },
});

export default App;
