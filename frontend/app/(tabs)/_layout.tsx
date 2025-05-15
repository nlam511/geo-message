import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, TouchableOpacity, View, Text, StyleSheet } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarBackground: TabBarBackground,
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
          tabBarButton: HapticTab,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="cart.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="index"
        options={{
          title: 'Nearby',
          tabBarButton: HapticTab,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="map.fill" color={color} />
          ),
        }}
      />


      <Tabs.Screen
        name="drop"
        options={{
          title: 'Drop Message',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="plus" color="white" />
          ),
          tabBarButton: (props) => <DropMessageButton {...props} />,
        }}
      />

      <Tabs.Screen
        name="collected"
        options={{
          title: 'Collected',
          tabBarButton: HapticTab,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="tray.full.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarButton: HapticTab,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="tray.full.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

// 🟦 Circular center button component
function DropMessageButton({ onPress, accessibilityState }: any) {
  const isSelected = accessibilityState?.selected;

  return (
    <TouchableOpacity
      onPress={onPress}
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
  dropButtonWrapper: {
    position: 'absolute',
    bottom: -2,
    alignSelf: 'center',
    zIndex: 10,
  },
  circleButton: {
    width: 70,
    height: 50,
    borderRadius: 30,
    backgroundColor: '#007AFF',
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