import { useEffect, useState } from 'react';
import { Tabs, Redirect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {
  Platform,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { TabHistoryProvider, useTabHistory } from '@/context/TabHistoryContext';
import { useRouter, useSegments } from 'expo-router';
import { useFonts, ShortStack_400Regular } from '@expo-google-fonts/short-stack';

export default function ProtectedTabsLayout() {
  const [authStatus, setAuthStatus] = useState<'checking' | 'unauthenticated' | 'authenticated'>(
    'checking'
  );
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    ShortStack_400Regular,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const token = await SecureStore.getItemAsync('user_token');
      setAuthStatus(token ? 'authenticated' : 'unauthenticated');
    };
    checkAuth();
  }, []);

  if (!fontsLoaded || authStatus === 'checking') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (authStatus === 'unauthenticated') {
    return <Redirect href="/login" />;
  }

  return (
    <TabHistoryProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarLabelStyle: {
            fontFamily: 'ShortStack_400Regular',
            fontSize: 12,
          },
          tabBarStyle: Platform.select({
            ios: {
              position: 'absolute',
            },
            default: {},
          }),
        }}
      >
        <Tabs.Screen
          name="store"
          options={{
            title: 'Store',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="cart.fill" color={color} />,
          }}
        />

        <Tabs.Screen
          name="index"
          options={{
            title: 'Nearby',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="map.fill" color={color} />,
          }}
        />

        <Tabs.Screen
          name="drop"
          options={{
            title: 'Drop Message',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus" color="white"  />,
            tabBarButton: (props) => <DropMessageButton {...props} />,
          }}
        />

        <Tabs.Screen
          name="collected"
          options={{
            title: 'Collected',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="tray.and.arrow.down.fill" color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="person.crop.circle.fill" color={color} />
            ),
          }}
        />
      </Tabs>
    </TabHistoryProvider>
  );
}

// 🔵 Drop Message circular tab button
function DropMessageButton({ onPress, accessibilityState }: any) {
  const isSelected = accessibilityState?.selected;
  const router = useRouter();
  const segments = useSegments();
  const { setLastTab } = useTabHistory();

  return (
    <TouchableOpacity
      onPress={() => {
        const currentPath = '/' + segments.join('/');
        setLastTab(currentPath);
        router.push('/drop');
      }}
      style={styles.dropButtonWrapper}
      activeOpacity={0.9}
    >
      <View style={[styles.circleButton, isSelected && styles.circleButtonActive]}>
        <Text style={styles.dropText}>＋</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  dropButtonWrapper: {
    position: 'absolute',
    bottom: -5,
    alignSelf: 'center',
    zIndex: 10,
  },
  circleButton: {
    width: 50,
    height: 50,
    borderRadius: 30,
    backgroundColor: '#3A9CA5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  circleButtonActive: {
    backgroundColor: '#005BB5',
  },
  dropText: {
    fontSize: 30,
    color: 'white',
    fontWeight: 'bold',
    lineHeight: 32,
  },
});
