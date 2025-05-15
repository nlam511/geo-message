import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from 'react-native';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { dropMessage } from '@/api/messages';

export default function HomeScreen() {
  const [message, setMessage] = useState('');

  const handleDropMessage = async () => {
    // 🔐 Get the token from secure storage
    const token = await SecureStore.getItemAsync("user_token");
    if (!token) {
      Alert.alert("❌ You must be logged in to drop a message.");
      return;
    }

    // Ask for location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    console.log("🔐 Location permission status:", status);
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'We need location permission to drop a message.');
      return;
    }

    // Get current location
    const curr_location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = curr_location.coords;
    console.log("📍 Location:", latitude, longitude);

    // Drop message
    const dropResult = await dropMessage(message, { latitude, longitude });
    if (dropResult.status === "success") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setMessage('');
      Keyboard.dismiss();
    } else {
      Alert.alert("Error", dropResult.message);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Drop a Geo-Message</Text>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={message}
            onChangeText={setMessage}
          />
          <TouchableOpacity style={styles.customButton} onPress={handleDropMessage}>
            <Text style={styles.buttonText}>Drop Message</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  title: {
    fontSize: 30,
    marginBottom: 10,
    textAlign: 'center',
    color: 'black',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 12,
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  customButton: {
    backgroundColor: '#007AFF', // iOS-style blue
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});