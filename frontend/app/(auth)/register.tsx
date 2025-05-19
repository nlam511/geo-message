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
  ScrollView,
  Image,
} from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import { registerPushNotificationsAsync } from '@/utils/registerPushNotificationsAsync';


export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { refresh } = useAuth();

  const handleRegister = async () => {
    if (!email || !confirmEmail || !password) {
      Alert.alert('Please fill out all fields');
      return;
    }

    if (email !== confirmEmail) {
      Alert.alert('Emails don\'t match.  Please try again.');
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

      // Register device for push notifications
      await registerPushNotificationsAsync();

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
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">

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
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#999" value={email}
            onChangeText={setEmail} />
          <TextInput style={styles.input} placeholder="Confirm Email" placeholderTextColor="#999" value={confirmEmail}
            onChangeText={setConfirmEmail} />
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#999" secureTextEntry value={password}
            onChangeText={setPassword} />
          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/forgot-password')}>
            <Text style={styles.linkText} >Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.linkText} >Don't have an account? Register here</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
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
    marginTop: 60
  },
  logocontainer: {
    alignItems: 'center',
    backgroundColor: '',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: -10
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
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 16,
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
  },
  linkText: {
    color: 'black',
    // textDecorationLine: 'underline',
    fontSize: 15,
    marginTop: 6,
  },
});
