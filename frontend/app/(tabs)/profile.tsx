import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { useRouter, useFocusEffect } from 'expo-router';

export default function ProfileScreen() {
  const [userInfo, setUserInfo] = useState<{
    id: string;
    email: string;
    message_count: number;
    collected_count: number;
  } | null>(null);

  const router = useRouter();

  const fetchUserInfo = useCallback(async () => {
    const token = await SecureStore.getItemAsync('access_token');
    if (!token) return;

    try {
      const backendUrl = Constants.expoConfig?.extra?.backendUrl;
      const response = await fetch(`${backendUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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
    const accessToken = await SecureStore.getItemAsync('access_token');
    const refreshToken = await SecureStore.getItemAsync('refresh_token');

    if (!accessToken || !refreshToken) {
      Alert.alert('Missing tokens');
      return;
    }

    try {
      const backendUrl = Constants.expoConfig?.extra?.backendUrl;
      const response = await fetch(`${backendUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: refreshToken }),
      });

      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');

      if (!response.ok) {
        const err = await response.json();
        Alert.alert('Logout failed', err.detail || 'Unknown error');
        return;
      }

      Alert.alert('Logged out');
      router.replace('/login');
    } catch (err) {
      console.error('Logout error:', err);
      Alert.alert('Logout error');
    }
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
          <Text style={styles.value}>{userInfo.message_count}</Text>

          <Text style={styles.label}>Messages Collected:</Text>
          <Text style={styles.value}>{userInfo.collected_count}</Text>
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