import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTabHistory } from '@/context/TabHistoryContext';
import Toast from 'react-native-toast-message';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import TopNavBar from '@/components/TopNavBar';
import { authFetch } from '@/api/authFetch';

export default function HomeScreen() {
  const [message, setMessage] = useState('');
  const router = useRouter();
  const { lastTab } = useTabHistory();
  const insets = useSafeAreaInsets();

  const handleDropMessage = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'We need location permission to drop a message.');
      return;
    }

    if (message.trim().length === 0) {
      Alert.alert('Message too short', 'Please enter a message before submitting.');
      return;
    }

    const curr_location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = curr_location.coords;

    try {
      const backendUrl = Constants.expoConfig?.extra?.backendUrl;
      const res = await authFetch(`${backendUrl}/message/drop`, {
        method: 'POST',
        body: JSON.stringify({
          text: message,
          latitude,
          longitude,
        }),
      });

      if (res.ok) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setMessage('');
        Keyboard.dismiss();
        Toast.show({
          type: 'success',
          text1: ' Message Dropped!',
          visibilityTime: 1500,
          topOffset: insets.top,
        });
        router.push({ pathname: (lastTab || '/index') as any });
      } else {
        const error = await res.json();
        Toast.show({
          type: 'error',
          text1: ' Failed to Drop Message',
          text2: error?.detail || '',
          visibilityTime: 1500,
          topOffset: insets.top,
        });
      }
    } catch (err) {
      console.error('[Drop] Network error:', err);
      Toast.show({
        type: 'error',
        text1: ' Network Error',
        text2: 'Could not connect to server.',
        visibilityTime: 1500,
        topOffset: insets.top,
      });
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        >
          <TopNavBar />
          <View style={styles.inner}>
            <Text style={styles.title}>Drop a Message</Text>
            <TextInput
              style={styles.input}
              placeholder="Type your message..."
              placeholderTextColor="#999"
              value={message}
              onChangeText={(text) => {
                if (text.length <= 100) setMessage(text);
              }}
              multiline
              maxLength={100}
            />
            <Text style={styles.charCount}>{`${message.length}/100`}</Text>
            <TouchableOpacity
              style={[styles.customButton, { opacity: message.trim() ? 1 : 0.5 }]}
              onPress={handleDropMessage}
              disabled={!message.trim()}
            >
              <Text style={styles.buttonText}>Drop Message</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: '#000',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  closeText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 30,
    marginBottom: 10,
    textAlign: 'center',
    color: 'black',
    fontFamily: 'ShortStack_400Regular',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 12,
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    fontFamily: 'ShortStack_400Regular',
  },
  customButton: {
    backgroundColor: 'black',
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
    fontFamily: 'ShortStack_400Regular',
  },
  charCount: {
    textAlign: 'right',
    marginBottom: 10,
    color: '#666',
    fontSize: 12,
    fontFamily: 'ShortStack_400Regular',
  },
});
