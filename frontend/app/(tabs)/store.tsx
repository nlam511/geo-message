import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopNavBar from '@/components/TopNavBar';

export default function StoreScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <TopNavBar />
      <View style={styles.inner}>
        <Text style={styles.header}>Store</Text>

        <TouchableOpacity style={styles.moneyButton} onPress={() => Alert.alert("Coming Soon", "In-app purchases coming soon!")}>
          <Text style={styles.buttonText}>Secret Button</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 20,
    flex: 1,
  },
  header: {
    fontSize: 28,
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 24,
    color: 'black',
    fontFamily: 'ShortStack_400Regular',
  },
  value: {
    fontSize: 16,
    marginBottom: 16,
    color: 'black',
    fontFamily: 'ShortStack_400Regular',
  },
  moneyButton: {
    backgroundColor: 'black',
    marginHorizontal: 40,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'ShortStack_400Regular',
  },
});
