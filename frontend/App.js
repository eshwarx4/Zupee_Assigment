import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text } from 'react-native';

// Stage 1: Basic render test
function TestScreen() {
  const [stage, setStage] = useState('Basic render works');
  const [error, setError] = useState(null);

  useEffect(() => {
    // Stage 2: Test gesture handler
    try {
      require('react-native-gesture-handler');
      setStage('Gesture handler loaded');
    } catch (e) {
      setError('Gesture handler failed: ' + e.message);
      return;
    }

    // Stage 3: Test navigation
    try {
      require('@react-navigation/native');
      require('@react-navigation/native-stack');
      require('@react-navigation/bottom-tabs');
      setStage('Navigation loaded');
    } catch (e) {
      setError('Navigation failed: ' + e.message);
      return;
    }

    // Stage 4: Test firebase
    try {
      require('firebase/app');
      setStage('Firebase loaded');
    } catch (e) {
      setError('Firebase failed: ' + e.message);
      return;
    }

    // Stage 5: Test AsyncStorage
    try {
      require('@react-native-async-storage/async-storage');
      setStage('AsyncStorage loaded');
    } catch (e) {
      setError('AsyncStorage failed: ' + e.message);
      return;
    }

    // Stage 6: Load full app
    try {
      setStage('All modules loaded! Loading app...');
    } catch (e) {
      setError('App load failed: ' + e.message);
    }
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>Bharat Nivesh Saathi</Text>
      <Text style={styles.status}>{stage}</Text>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

export default function App() {
  return <TestScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 20,
  },
  title: {
    color: '#FF6B00',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  status: {
    color: '#00C853',
    fontSize: 16,
    marginBottom: 10,
  },
  error: {
    color: '#FF1744',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
});
