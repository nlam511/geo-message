import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Alert,
    TouchableOpacity,
    Modal,
    Animated,
    Image,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { uncollectMessage, hideMessage } from '@/api/messages';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { authFetch } from '@/api/authFetch';
import { avatarMap } from '@/utils/avatarMap';
import TopNavBar from '@/components/TopNavBar';

export default function CollectedScreen() {
    const [messages, setMessages] = useState<any[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const insets = useSafeAreaInsets();

    const fetchCollectedMessages = useCallback(async () => {
        try {
            if (selectedMessage) return;

            const backendUrl = Constants.expoConfig?.extra?.backendUrl;
            const response = await authFetch(`${backendUrl}/message/collected`);
            const data = await response.json();
            setMessages(data);
            console.log('✅ Refreshed collected messages');
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Could not load collected messages.');
        }
    }, [selectedMessage]);

    const handleManualRefresh = async () => {
        setRefreshing(true);
        await fetchCollectedMessages();
        setRefreshing(false);
        Toast.show({
            type: 'success',
            text1: 'Message Refreshed!',
            visibilityTime: 1500,
            topOffset: insets.top,
        });
    };

    useFocusEffect(
        useCallback(() => {
            fetchCollectedMessages();
        }, [fetchCollectedMessages])
    );

    const handleHide = async (id: string) => {
        const result = await hideMessage(id);
        if (result.status === "success") {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setSelectedMessage(null);
            Toast.show({
                type: 'success',
                text1: 'Message Hidden!',
                visibilityTime: 1500,
                topOffset: insets.top,
            });
        } else {
            Toast.show({
                type: 'error',
                text1: 'Failed to Hide Message!',
                visibilityTime: 1500,
                topOffset: insets.top,
            });
        }
    };


    const handleUncollect = async (id: string) => {
        const result = await uncollectMessage(id);
        if (result.status === 'success') {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setMessages((prev) => prev.filter((msg) => msg.id !== id));
            Toast.show({
                type: 'success',
                text1: ' Message Uncollected!',
                visibilityTime: 1500,
                topOffset: insets.top,
            });
        } else {
            Toast.show({
                type: 'error',
                text1: 'Failed to Uncollect Message',
                visibilityTime: 1500,
                topOffset: insets.top,
            });
        }
    };

    const renderLeftActions = (
        _progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
    ) => {
        const opacity = dragX.interpolate({
            inputRange: [0, 64],
            outputRange: [0, 1],
            extrapolate: 'clamp',
        });

        return (
            <Animated.View style={[styles.swipeAction, { backgroundColor: 'black', opacity }]}>
                <Text style={styles.swipeText}>Hide</Text>
            </Animated.View>
        );
    };

    const renderRightActions = (
        _progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
    ) => {
        const opacity = dragX.interpolate({
            inputRange: [-64, 0],
            outputRange: [1, 0],
            extrapolate: 'clamp',
        });

        return (
            <Animated.View style={[styles.swipeAction, { backgroundColor: 'black', opacity }]}>
                <Text style={styles.swipeText}>Uncollect</Text>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <TopNavBar />
            <View style={styles.inner}>
                <Text style={styles.title}>Collected Messages</Text>
                <FlatList
                    data={messages}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <Swipeable
                            renderLeftActions={(progress, dragX) => renderLeftActions(progress, dragX)}
                            renderRightActions={(progress, dragX) => renderRightActions(progress, dragX)}
                            onSwipeableOpen={(direction) => {
                                if (direction === 'left') {
                                    handleHide(item.id);
                                }
                                if (direction === 'right') { handleUncollect(item.id); }
                            }}
                        >
                            <TouchableOpacity onPress={() => setSelectedMessage(item)}>
                                <View style={styles.contactRow}>
                                    <Image
                                        source={avatarMap[item.owner_profile_picture ?? 'avatar1.jpeg']}
                                        style={styles.avatar}
                                    />
                                    <View style={styles.contactInfo}>
                                        <Text style={styles.contactName}>{item.owner_username}</Text>
                                        <Text style={styles.contactEmail}>{item.text} </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </Swipeable>
                    )}
                    ListEmptyComponent={<Text style={styles.empty}>No messages collected yet.</Text>}
                    refreshing={refreshing}
                    onRefresh={handleManualRefresh}
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
                                    await handleUncollect(selectedMessage.id);
                                    setSelectedMessage(null);
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
        backgroundColor: 'white',
    },
    inner: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        marginTop: 20,
        marginBottom: 16,
        textAlign: 'center',
        color: 'black',
        fontFamily: 'ShortStack_400Regular',
    },
    messageBox: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 0,
        padding: 12,
        marginBottom: 1,
        backgroundColor: '#f9f9f9',
        width: '100%',
        height: 64,
    },
    messageText: {
        fontSize: 16,
        marginBottom: 4,
        fontFamily: 'ShortStack_400Regular',
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
        fontFamily: 'ShortStack_400Regular',
    },
    modalText: {
        fontSize: 16,
        marginBottom: 10,
        fontFamily: 'ShortStack_400Regular',
    },
    modalMeta: {
        fontSize: 14,
        color: 'gray',
        marginBottom: 20,
        fontFamily: 'ShortStack_400Regular',
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
        fontFamily: 'ShortStack_400Regular',
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
        fontFamily: 'ShortStack_400Regular',
    },
    swipeAction: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
    },
    swipeText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'ShortStack_400Regular',
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: 'white',
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        fontFamily: 'ShortStack_400Regular',
    },
    contactEmail: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'ShortStack_400Regular',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        backgroundColor: '#ccc',
    },
});
