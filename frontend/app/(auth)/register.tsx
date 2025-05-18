import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';


export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { refresh } = useAuth();

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Please fill out all fields');
      return;
    }

    try {
      const backendUrl = Constants.expoConfig?.extra?.backendUrl;

      // 1️⃣ Attempt registration
      const registerRes = await fetch(`${backendUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        Alert.alert('❌ Registration failed', registerData.detail || 'Unknown error');
        return;
      }

      console.log(`✅ Registered user ${email} successfully.`);

      // 2️⃣ Attempt login immediately after registration
      const loginRes = await fetch(`${backendUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      

      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        Alert.alert('✅ Registered, but login failed', loginData.detail || 'Unknown error');
        return;
      }

      // 3️⃣ Store tokens securely
      await SecureStore.setItemAsync('user_token', loginData.access_token);

      if (loginData.refresh_token) {
        await SecureStore.setItemAsync('refresh_token', loginData.refresh_token);
      } else {
        console.warn('⚠️ No refresh_token received during login');
      }
      await refresh();
      
      console.log(`Logged in from registration page successfully.`);

      // 4️⃣ Navigate to home screen
      router.replace('/');

    } catch (error) {
      console.error('Registration/Login error:', error);
      Alert.alert('❌ Error', 'Unable to connect to server.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      console.log('Routed to Registration Page');
    }, [])
  );


  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Text style={styles.title}>Register</Text>

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

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>← Go back to Login</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
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
  link: {
    marginTop: 20,
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
  },
});
