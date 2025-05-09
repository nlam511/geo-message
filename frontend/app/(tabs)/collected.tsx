import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CollectedScreen() {
    const [messages, setMessages] = useState<any[]>([]);

    useFocusEffect(
        useCallback(() => {
            let intervalId: ReturnType<typeof setInterval>;

            const fetchCollectedMessages = async () => {
                try {
                    const token = await SecureStore.getItemAsync("user_token");
                    if (!token) {
                        Alert.alert("Not logged in", "Please log in to see your collected messages.");
                        return;
                    }

                    const backendUrl = Constants.expoConfig?.extra?.backendUrl;
                    const response = await fetch(`${backendUrl}/message/collected`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    });

                    const data = await response.json();
                    setMessages(data);
                    console.log("🚨 Polled Collected Messages");
                } catch (err) {
                    console.error(err);
                    Alert.alert("Error", "Could not load collected messages.");
                }
            };

            fetchCollectedMessages();


            // Then repeat every 5 seconds
            intervalId = setInterval(fetchCollectedMessages, 5000);

            // Cleanup on unmount
            return () => clearInterval(intervalId);
        }, [])
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
            <View style={styles.container}>
                <Text style={styles.title}>📥 Collected Messages</Text>
                <FlatList
                    data={messages}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.messageBox}>
                            <Text style={styles.messageText}>{item.text}</Text>
                            <Text style={styles.meta}>🕓 Collected: {new Date(item.collected_at).toLocaleString()}</Text>
                        </View>
                    )}
                    ListEmptyComponent={<Text style={styles.empty}>No messages collected yet.</Text>}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: 'white',
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'center',
        color: 'black',
    },
    messageBox: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        backgroundColor: '#f9f9f9',
    },
    messageText: {
        fontSize: 16,
        marginBottom: 4,
    },
    meta: {
        fontSize: 12,
        color: 'gray',
    },
    empty: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16,
        color: 'gray',
    },
});
