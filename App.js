import { StatusBar, StyleSheet, View } from 'react-native';
import HandWizard from './components/HandWizard';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#1a1a1a" />
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