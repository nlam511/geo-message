import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import TopNavBar from '@/components/TopNavBar';

export default function ProfileScreen() {
  const { user, logout, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>You are not logged in.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TopNavBar />
      <Text style={styles.header}>Profile</Text>

      <View style={styles.infoBox}>
        <Text style={styles.label}>User ID:</Text>
        <Text style={styles.value}>{user.id}</Text>

        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{user.email}</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 24,
    color: 'black',
    fontFamily: 'ShortStack_400Regular',
  },
  infoBox: {
    marginBottom: 40,
  },
  label: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 4,
    fontFamily: 'ShortStack_400Regular',
  },
  value: {
    fontSize: 16,
    marginBottom: 16,
    color: 'black',
    fontFamily: 'ShortStack_400Regular',
  },
  loading: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 20,
    fontFamily: 'ShortStack_400Regular',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'ShortStack_400Regular',
  },
});
