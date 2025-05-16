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
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { dropMessage } from '@/api/messages';
import { useTabHistory } from '@/context/TabHistoryContext';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [message, setMessage] = useState('');
  const router = useRouter();
  const { lastTab } = useTabHistory();

  const insets = useSafeAreaInsets();

  const handleDropMessage = async () => {
    const token = await SecureStore.getItemAsync("user_token");
    if (!token) {
      Alert.alert("❌ You must be logged in to drop a message.");
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'We need location permission to drop a message.');
      return;
    }

    const curr_location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = curr_location.coords;

    const dropResult = await dropMessage(message, { latitude, longitude });
    if (dropResult.status === "success") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setMessage('');
      Keyboard.dismiss();
      Toast.show({
        type: 'success',
        text1: ' Message Dropped!',
        visibilityTime: 1500,
        topOffset: insets.top,
      });
      router.push({ pathname: (lastTab || '/index') as any })
    } else {
      Toast.show({
        type: 'error',
        text1: ' Failed to Drop Message',
        visibilityTime: 1500,
        topOffset: insets.top,
      });
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
          {/* ❌ X Close Button */}
          <TouchableOpacity onPress={() => router.push({ pathname: (lastTab || '/index') as any })} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

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
    backgroundColor: '#007AFF',
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
