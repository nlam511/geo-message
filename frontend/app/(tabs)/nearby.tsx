import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, Image, TouchableOpacity, Modal } from 'react-native';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NearbyScreen() {
    const [messages, setMessages] = useState<any[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<any | null>(null);

    // TODO: This runs repeatedly despite not being on this page?
    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval>;

        const fetchNearbyMessages = async () => {
            try {
                // Get location permission
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Location permission is required to find nearby messages.');
                    return;
                }

                // 🔐 Get the token from secure storage
                const token = await SecureStore.getItemAsync("user_token");
                if (!token) {
                    Alert.alert("❌ You must be logged in to get nearby messages.");
                    return;
                }

                // Get current location
                const location = await Location.getCurrentPositionAsync({});
                const { latitude, longitude } = location.coords;

                // Fetch messages from backend
                const backendUrl = Constants.expoConfig?.extra?.backendUrl;
                const response = await fetch(
                    `${backendUrl}/message/nearby?latitude=${latitude}&longitude=${longitude}`,
                    {
                        method: "GET",
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
                const data = await response.json();
                setMessages(data);
                console.log("🚨 Polled Nearby Messages");
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

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
            <View style={styles.topHalf}>
                <Image
                    source={require('../../assets/images/map-placeholder.png')}
                    style={styles.mapImage}
                />
            </View>
            <View style={styles.bottomHalf}>
                <FlatList
                    data={messages}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => setSelectedMessage(item)}>
                            <View style={styles.messageBox}>
                                <Text style={styles.messageText}>{item.text}</Text>
                                <Text style={styles.meta}>📍 Lat: {item.latitude}, Lng: {item.longitude}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={styles.empty}>No messages nearby.</Text>}
                />
            </View>


            {selectedMessage && (
                <Modal
                    visible={true}
                    animationType="fade"
                    transparent
                    onRequestClose={() => setSelectedMessage(null)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPressOut={() => setSelectedMessage(null)}
                    >
                        <View style={styles.modalContent}>
                            <TouchableOpacity
                                style={styles.modalCloseIcon}
                                onPress={() => setSelectedMessage(null)}
                            >
                                <Text style={styles.modalCloseText}>✕</Text>
                            </TouchableOpacity>

                            <Text style={styles.modalTitle}>Message Details</Text>
                            <Text style={styles.modalText}>{selectedMessage.text}</Text>
                            <Text style={styles.modalMeta}>
                                📍 Lat: {selectedMessage.latitude}, Lng: {selectedMessage.longitude}
                            </Text>

                            <TouchableOpacity
                                style={styles.collectButton}
                                onPress={async () => {
                                    try {
                                        const token = await SecureStore.getItemAsync("user_token");
                                        if (!token) {
                                            Alert.alert("Not logged in", "Please log in to collect messages.");
                                            return;
                                        }

                                        const backendUrl = Constants.expoConfig?.extra?.backendUrl;
                                        const response = await fetch(
                                            `${backendUrl}/message/${selectedMessage.id}/collect`,
                                            {
                                                method: "POST",
                                                headers: {
                                                    Authorization: `Bearer ${token}`,
                                                    "Content-Type": "application/json",
                                                },
                                            }
                                        );

                                        if (response.ok) {
                                            Alert.alert("✅ Collected!", "Message successfully collected.");
                                            setSelectedMessage(null); // ✅ Close modal after success
                                        } else {
                                            const error = await response.json();
                                            Alert.alert("❌ Failed", error.detail || "Could not collect message.");
                                        }
                                    } catch (error) {
                                        console.error(error);
                                        Alert.alert("❌ Error", "Something went wrong.");
                                    }
                                }}
                            >
                                <Text style={styles.collectButtonText}>Collect</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            )}
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
    topHalf: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    mapImage: {
        width: '95%',
        height: '95%',
        borderRadius: 30,
    },
    bottomHalf: {
        flex: 1,
        backgroundColor: 'white',
        paddingHorizontal: 10,
        paddingBottom: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalText: {
        fontSize: 16,
        marginBottom: 10,
    },
    modalMeta: {
        fontSize: 14,
        color: 'gray',
        marginBottom: 20,
    },
    modalCloseIcon: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 10,
        backgroundColor: '#ff3b30',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    modalCloseText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    collectButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    collectButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },

});
