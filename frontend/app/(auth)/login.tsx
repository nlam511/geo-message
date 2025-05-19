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
  Image,
  ScrollView
} from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { registerPushNotificationsAsync } from '@/utils/registerPushNotificationsAsync';
import { useAuth } from '@/hooks/useAuth';
import { useFocusEffect } from '@react-navigation/native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { refresh } = useAuth(); // ✅ this gives you the method to trigger context update  
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
      console.log('🔐 Login response:', data);

      if (response.ok) {
        // ✅ Store both tokens under expected keys
        await SecureStore.setItemAsync('user_token', data.access_token);
        await SecureStore.setItemAsync('refresh_token', data.refresh_token);

        // Register device for push notifications
        await registerPushNotificationsAsync();

        // ✅ Tell the auth context to refresh its state
        await refresh();
      } else {
        Alert.alert('❌ Login failed', data.detail || 'Unknown error');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('❌ Error', 'Unable to connect to server.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      console.log('🔐 Routed to Login Page');
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
          <Text style={styles.formLabel}>Login</Text>
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#999" value={email}
            onChangeText={setEmail} />
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#999" secureTextEntry value={password}
            onChangeText={setPassword} />
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
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
