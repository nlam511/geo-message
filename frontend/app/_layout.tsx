import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

export default function RootLayout() {
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await SecureStore.getItemAsync('token');
      setIsAuthenticated(!!token);
      setIsAuthChecked(true);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isAuthChecked) return;

    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    } else {
      router.replace('/(tabs)');
    }
  }, [isAuthChecked, isAuthenticated]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {!isAuthChecked ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator />
        </View>
      ) : (
        <>
          <View style={{ flex: 1 }}>
            <Slot />
            <Toast />
          </View>
        </>
      )}
    </GestureHandlerRootView>
  );
}