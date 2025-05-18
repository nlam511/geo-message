import { useCallback } from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

export default function ForgotPasswordScreen() {
    const router = useRouter();

      useFocusEffect(
        useCallback(() => {
          console.log('🔐 Routed to Forgot Password Page');
        }, [])
      );

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>🔐 Forgot Password</Text>
            <Text style={styles.subtitle}>Password reset functionality will go here.</Text>

            <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.link}>← Go back to Login</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: 'white' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
    subtitle: { fontSize: 16, color: 'gray' },
    link: {
        marginTop: 20,
        fontSize: 16,
        color: '#007AFF',
        textAlign: 'center',
    },
});


