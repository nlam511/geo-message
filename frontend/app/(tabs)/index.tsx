import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';

export default function HomeScreen() {
  const [message, setMessage] = useState('');

  const handleDropMessage = () => {
    Alert.alert('Drop Message Pressed', `Message: ${message}`);
    // We'll hook this up to your backend in Step 2
  };

  return (
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