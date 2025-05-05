import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import * as Location from 'expo-location';
import Constants from 'expo-constants';

export default function NearbyScreen() {
    const [messages, setMessages] = useState<any[]>([]);

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval>;

        const fetchNearbyMessages = async () => {
            try {
                console.log("Fetching Messages")
                // Get location permission
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Location permission is required to find nearby messages.');
                    return;
                }

                // Get current location
                const location = await Location.getCurrentPositionAsync({});
                const { latitude, longitude } = location.coords;

                // Fetch messages from backend
                const backendUrl = Constants.expoConfig?.extra?.backendUrl;
                const response = await fetch(
                    `${backendUrl}/message/nearby_messages?latitude=${latitude}&longitude=${longitude}`
                );
                const data = await response.json();
                setMessages(data);
            } catch (error) {
                console.error(error);
                Alert.alert('Could not fetch nearby messages.');
            }
        };

        // First fetch immediately
        fetchNearbyMessages();

        // Then repeat every 5 seconds
        intervalId = setInterval(fetchNearbyMessages, 5000);

        // Cleanup on unmount
        return () => clearInterval(intervalId);
    }, []);

    { console.log("🚨 Messages:", messages) }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>📍 Nearby Messages</Text>
            <FlatList
                data={messages}
                keyExtractor={(item) => item.uuid.toString()}
                renderItem={({ item }) => (
                    <View style={styles.messageBox}>
                        <Text style={styles.messageText}>{item.text}</Text>
                        <Text style={styles.meta}>📍 Lat: {item.latitude}, Lng: {item.longitude}</Text>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.empty}>No messages nearby.</Text>}
            />
        </View>
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
        textAlign: 'center',
        marginBottom: 16,
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
