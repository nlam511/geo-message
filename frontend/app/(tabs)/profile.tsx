import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { useRouter, useFocusEffect } from 'expo-router';
import { authFetch } from '@/api/authFetch';

export default function ProfileScreen() {
  const [userInfo, setUserInfo] = useState<{
    id: string;
    email: string;
    messages_dropped: number;
    messages_collected: number;
    daily_drops_remaining: number;
  } | null>(null);

  const router = useRouter();

  const fetchUserInfo = useCallback(async () => {
    try {
      const backendUrl = Constants.expoConfig?.extra?.backendUrl;
      const response = await authFetch(`${backendUrl}/auth/me`);
      const data = await response.json();
      setUserInfo(data);
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUserInfo();
    }, [fetchUserInfo])
  );

  const handleLogout = async () => {
    const refreshToken = await SecureStore.getItemAsync('refresh_token');
    const backendUrl = Constants.expoConfig?.extra?.backendUrl;

    try {
      await authFetch(`${backendUrl}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: refreshToken }),
      });
    } catch (err) {
      console.error('Logout request error (still clearing tokens):', err);
    }

    await SecureStore.deleteItemAsync('user_token');
    await SecureStore.deleteItemAsync('refresh_token');

    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>👤 Profile</Text>

      {userInfo ? (
        <View style={styles.infoBox}>
          <Text style={styles.label}>User ID:</Text>
          <Text style={styles.value}>{userInfo.id}</Text>

          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{userInfo.email}</Text>

          <Text style={styles.label}>Messages Dropped:</Text>
          <Text style={styles.value}>{userInfo.messages_dropped}</Text>

          <Text style={styles.label}>Messages Collected:</Text>
          <Text style={styles.value}>{userInfo.messages_collected}</Text>

          <Text style={styles.label}>Daily Drops Remaining:</Text>
          <Text style={styles.value}>{userInfo.daily_drops_remaining}</Text>
        </View>
      ) : (
        <Text style={styles.loading}>Loading user info...</Text>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 24,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: 'black',
  },
  infoBox: {
    marginBottom: 40,
  },
  label: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    marginBottom: 16,
    color: 'black',
  },
  loading: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 20,
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
  },
});
