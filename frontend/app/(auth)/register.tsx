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
  ScrollView,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import { registerPushNotificationsAsync } from '@/utils/registerPushNotificationsAsync';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { refresh } = useAuth();

  const handleRegister = async () => {
    if (!username || !email || !confirmEmail || !password) {
      Alert.alert('Please fill out all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Please enter a valid email address');
      return;
    }

    if (email !== confirmEmail) {
      Alert.alert("Emails don't match. Please try again.");
      return;
    }

    if (password.length < 6) {
      Alert.alert('Password must be at least 6 characters');
      return;
    }

    try {
      const backendUrl = Constants.expoConfig?.extra?.backendUrl;

      // 1️⃣ Attempt registration
      const registerRes = await fetch(`${backendUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      let registerData;
      try {
        registerData = await registerRes.json();
      } catch {
        throw new Error('Invalid response from server');
      }

      if (!registerRes.ok) {
        Alert.alert('❌ Registration failed', registerData.detail || 'Unknown error');
        return;
      }

      console.log(`✅ Registered user ${email} successfully.`);

      // 2️⃣ Attempt login immediately after registration
      const loginRes = await fetch(`${backendUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      let loginData;
      try {
        loginData = await loginRes.json();
      } catch {
        throw new Error('Invalid response from login');
      }

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

      // Register device for push notifications
      try {
        const pushToken = await registerPushNotificationsAsync();
        console.log('📱 Push token:', pushToken);
      } catch (err) {
        console.warn('⚠️ Failed to register for push notifications', err);
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={router.back} style={{ paddingTop: 50 }}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <View style={styles.logocontainer}>
            <Image
              source={require('@/assets/images/fishy@3x-80.jpg')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Droppings</Text>
          </View>
          <View style={styles.form}>
            <Text style={styles.formLabel}>Register</Text>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm Email"
              placeholderTextColor="#999"
              value={confirmEmail}
              onChangeText={setConfirmEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity style={styles.button} onPress={handleRegister}>
              <Text style={styles.buttonText}>Register</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    padding: 24,
    backgroundColor: 'white',
  },
  logo: {
    width: 150,
    height: 150,
    marginTop: 10,
  },
  logocontainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: -10,
    fontFamily: 'ShortStack_400Regular',
  },
  form: {
    width: '95%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  formLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'ShortStack_400Regular',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 16,
    fontFamily: 'ShortStack_400Regular',
  },
  button: {
    backgroundColor: 'black',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'ShortStack_400Regular',
  },
});
