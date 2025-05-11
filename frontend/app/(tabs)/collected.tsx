import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity, Modal } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { uncollectMessage } from '@/api/messages';



export default function CollectedScreen() {
    const [messages, setMessages] = useState<any[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<any | null>(null);


    // ✅ Add the swipe render functions here
    const renderRightActions = (item: any) => (
        <TouchableOpacity
            style={[styles.swipeAction, styles.uncollectSwipe]}
            onPress={async () => {
                const uncollectResult = await uncollectMessage(item.id);
                if (uncollectResult.status === "success") {
                    setMessages(prev => prev.filter(msg => msg.id !== item.id));
                } else {
                    Alert.alert("Error", uncollectResult.message);
                }
            }}
        >
            <Text style={styles.swipeText}>Uncollect</Text>
        </TouchableOpacity>
    );


    useFocusEffect(
        useCallback(() => {
            let intervalId: ReturnType<typeof setInterval>;

            const fetchCollectedMessages = async () => {
                try {
                    // Skip polling if modal is open
                    if (selectedMessage) return;

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


            // Start interval if modal is not open
            intervalId = setInterval(() => {
                if (!selectedMessage) {
                    fetchCollectedMessages();
                }
            }, 5000);

            // Cleanup on unmount
            return () => clearInterval(intervalId);
        }, [selectedMessage])
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
            <View style={styles.container}>
                <Text style={styles.title}>📥 Collected Messages</Text>
                <FlatList
                    data={messages}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <Swipeable
                            renderRightActions={() => renderRightActions(item)}>
                            <TouchableOpacity onPress={() => setSelectedMessage(item)}>
                                <View style={styles.messageBox}>
                                    <Text style={styles.messageText}>{item.text}</Text>
                                    <Text style={styles.meta}>🕓 Collected: {new Date(item.collected_at).toLocaleString()}</Text>
                                </View>
                            </TouchableOpacity>
                        </Swipeable>
                    )}
                    ListEmptyComponent={<Text style={styles.empty}>No messages collected yet.</Text>}
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
                                style={styles.uncollectButton}
                                onPress={async () => {
                                    const uncollectResult = await uncollectMessage(selectedMessage.id);
                                    if (uncollectResult.status === "success") {
                                        Alert.alert("Uncollected", "Message removed from your collection.");
                                        setMessages(prev => prev.filter(msg => msg.id !== selectedMessage.id));
                                        setSelectedMessage(null);
                                    } else {
                                        Alert.alert("Error", uncollectResult.message);
                                    }
                                }}
                            >
                                <Text style={styles.uncollectButtonText}>Uncollect</Text>
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
    uncollectButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    uncollectButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    swipeAction: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 100,
        height: '100%',
    },
    swipeText: {
        color: 'white',
        fontWeight: '600',
    },
    uncollectSwipe: {
        backgroundColor: '#007AFF',
    },
});
