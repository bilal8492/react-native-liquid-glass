/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { NewAppScreen } from '@react-native/new-app-screen';
import { StatusBar, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { TabBar } from './TabBar';
import { Pattern } from './Pattern';
import { Canvas } from '@shopify/react-native-skia';
import { LiquidGlass } from './LiquidGlass';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {/* <AppContent /> */}
      <TabBar />
      <View style={{ height: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: '#752828ff', }}>
        <Text>Hello world</Text>
      </View>
      <Canvas style={{ height: 100, width: 300, justifyContent: 'center', alignItems: 'center', position: 'absolute', top: 0, left: 0 }}>
        {/* <Pattern /> */}
        {/* <View >
            <LiquidGlass width={300} height={100} x={0} y={0} radius={10} />
          </View> */}
      </Canvas>

      <View style={styles.card}>

        <LinearGradient
          colors={['#333', '#333']}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={[styles.absolute, {}]}
        >
          {/* <View style={[ styles.overlay]} /> */}

        </LinearGradient>

        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Book A Test Drive</Text>
            <Text style={styles.subtitle}>Cancellation Up to 1 day before start time</Text>
          </View>
          {/* <Ionicons name="calendar-outline" size={22} color="#000" /> */}
          <Text>Calender Icon</Text>
        </View>

        {/* Bottom Section */}
        <View style={styles.bottom}>
          <View>
            <Text style={styles.location}>Mumbai</Text>
            <Text style={styles.price}>From 7.4 Lakhs</Text>
          </View>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Book now</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ height: 300, width: '100%',padding:20, backgroundColor: '#752828ff', }}>

      
      <BlurView blurAmount={80} blurType="light" style={{ height: 200, width: '100%' }}>
        <LinearGradient
          colors={['#333', '#333']}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={{...StyleSheet.absoluteFill}}
        >
          <View style={styles.colorLayer} />
          {/* Your content here */}
        </LinearGradient>
      </BlurView>

      </View>


    </SafeAreaProvider>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffffff',
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
    isolation: 'isolate',
    // mixBlendMode: 'color-dodge',
    // overflow: 'hidden',
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
    color: "#666",
    marginTop: 2,
  },
  bottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: '#ffffff',
    mixBlendMode: 'normal',
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
    backgroundColor: 'rgba(166, 166, 166, 0.7)',
    mixBlendMode: 'multiply',
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
