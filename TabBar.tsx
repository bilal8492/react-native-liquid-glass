import React, { useState } from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { Tab } from './Tab';

export const TabBar = ({ tabs = ['Home', 'Profile', 'Settings'], tabWidth = 100, tabHeight = 50 }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <View style={styles.container}>
        <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1752430038064-250d400e220f?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1262' }} // Replace with your image URL or local image
        style={styles.background}
      >
      {tabs.map((tab, index) => (
        <Tab
          key={tab}
          label={tab}
          isActive={index === activeIndex}
          onPress={() => setActiveIndex(index)}
          width={tabWidth}
          height={tabHeight}
        />
      ))}
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    backgroundColor: '#5d8797ff',
    height: 100,
  },
  background: {
    height: 100,
    flexDirection: 'row',
    justifyContent: 'center', // Center vertically
    alignItems: 'center',     // Center horizontally
  },
});
