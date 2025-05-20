import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopNavBar from '@/components/TopNavBar';

export default function StoreScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <TopNavBar />
      <View style={styles.inner}>
        <Text style={styles.title}>🛒 Store</Text>
        <Text style={styles.subtitle}>
          In-app purchases will be available here soon.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
    fontFamily: 'ShortStack_400Regular',
  },
  subtitle: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    fontFamily: 'ShortStack_400Regular',
  },
});
