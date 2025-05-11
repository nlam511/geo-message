import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Please enter email and password');
      return;
    }

    try {
      const backendUrl = Constants.expoConfig?.extra?.backendUrl;
      const response = await fetch(`${backendUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("🔐 Login response:", data);

      if (response.ok) {
        await SecureStore.setItemAsync('user_token', data.access_token);
        Alert.alert('✅ Login successful');
        router.replace('/'); // ✅ Navigate to main app
      } else {
        Alert.alert('❌ Login failed', data.detail || 'Unknown error');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('❌ Error', 'Unable to connect to server.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Text style={styles.title}>Login to Geo-Message</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
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
