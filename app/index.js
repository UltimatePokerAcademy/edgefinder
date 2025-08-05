import React from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import HandWizard from '../components/HandWizard';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <HandWizard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
});
