import { useEffect, useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Alert,
    TouchableOpacity,
    Modal,
    Animated,
    Image,
} from 'react-native';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { collectMessage, hideMessage } from '@/api/messages';
import * as Haptics from 'expo-haptics';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { authFetch } from '@/api/authFetch';
import Toast from 'react-native-toast-message';
import { avatarMap } from '@/utils/avatarMap';
import TopNavBar from '@/components/TopNavBar';
import MessageItem from '@/components/MessageItem';
import { InteractionManager } from 'react-native';

// import type { Animated as AnimatedType } from 'react-native';
// import type { Animated as RNAnimated } from 'react-native';


const REFRESH_INTERVAL_MS = 30000;

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}

export default function NearbyScreen() {
    const [messages, setMessages] = useState<any[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
    const [isSwiping, setIsSwiping] = useState(false);
    const [region, setRegion] = useState<Region | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const insets = useSafeAreaInsets();

    const refreshMessages = useCallback(async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Location Required', 'Please enable location to see nearby messages.');
                return;
            }
            const location = await Location.getCurrentPositionAsync({});
            const backendUrl = Constants.expoConfig?.extra?.backendUrl;
            const response = await authFetch(
                `${backendUrl}/message/nearby?latitude=${location.coords.latitude}&longitude=${location.coords.longitude}`
            );
            if (!response.ok) throw new Error('Failed to fetch nearby messages');
            const data = await response.json();
            setMessages(data);
            setRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.002,
                longitudeDelta: 0.002,
            });
        } catch (error) {
            console.error('Error refreshing messages:', error);
            Alert.alert('❌ Failed to refresh messages.');
        }
    }, []);

    const handleManualRefresh = async () => {
        setRefreshing(true);
        await refreshMessages();
        setRefreshing(false);
        Toast.show({
            type: 'success',
            text1: 'Message Refreshed!',
            visibilityTime: 1500,
            topOffset: insets.top,
        });
    };

    const handleCollect = async (id: string) => {
        try {
            setIsSwiping(true);
            const result = await collectMessage(id);
            if (result.status === 'success') {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

                // ✅ Wait until all animations/gestures are done
                InteractionManager.runAfterInteractions(() => {
                    setMessages((prev) => prev.filter((msg) => msg.id !== id));
                    setSelectedMessage(null);
                });

                Toast.show({
                    type: 'success',
                    text1: 'Message Collected!',
                    visibilityTime: 1500,
                    topOffset: insets.top,
                });
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Failed to Collect Message',
                    visibilityTime: 1500,
                    topOffset: insets.top,
                });
            }
        } catch (error) {
            console.error('Collect crash:', error);
            Toast.show({
                type: 'error',
                text1: 'Error during collect',
                visibilityTime: 1500,
                topOffset: insets.top,
            });
        } finally {
            setIsSwiping(false);
        }
    };

    const handleHide = async (id: string) => {
        try {
            setIsSwiping(true);
            const result = await hideMessage(id);
            if (result.status === 'success') {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

                InteractionManager.runAfterInteractions(() => {
                    setMessages((prev) => prev.filter((msg) => msg.id !== id));
                    setSelectedMessage(null);
                });

                Toast.show({
                    type: 'success',
                    text1: 'Message Hidden!',
                    visibilityTime: 1500,
                    topOffset: insets.top,
                });
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Failed to Hide Message',
                    visibilityTime: 1500,
                    topOffset: insets.top,
                });
            }
        } catch (error) {
            console.error('Hide crash:', error);
            Toast.show({
                type: 'error',
                text1: 'Error during hide',
                visibilityTime: 1500,
                topOffset: insets.top,
            });
        } finally {
            setIsSwiping(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            let isActive = true;
            const poll = async () => {
                if (!selectedMessage && !isSwiping && isActive) {
                    await refreshMessages();
                }
            };
            const intervalId = setInterval(poll, REFRESH_INTERVAL_MS);
            poll();
            return () => {
                isActive = false;
                clearInterval(intervalId);
            };
        }, [refreshMessages, selectedMessage, isSwiping])
    );

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
            <Animated.View style={[styles.fullSwipeAction, { backgroundColor: 'black', opacity }]}>
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
            <Animated.View style={[styles.fullSwipeAction, { backgroundColor: 'black', opacity }]}>
                <Text style={styles.swipeText}>Collect</Text>
            </Animated.View>
        );
    };



    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top', 'bottom']}>
            <TopNavBar />
            <View style={styles.topHalf}>
                {region ? (
                    <MapView
                        key={messages.map((m) => m.id).join(',')}
                        provider={PROVIDER_GOOGLE}
                        style={styles.mapView}
                        region={region}
                        showsUserLocation
                        scrollEnabled={false}
                        zoomEnabled={false}
                        rotateEnabled={false}
                        pitchEnabled={false}
                    >
                        {messages.map((msg) => (
                            <Marker
                                key={msg.id}
                                coordinate={{ latitude: msg.latitude, longitude: msg.longitude }}
                                onPress={() => setSelectedMessage(msg)}
                                pinColor={selectedMessage?.id === msg.id ? 'blue' : 'red'}
                            />
                        ))}
                    </MapView>
                ) : (
                    <View style={[styles.mapView, styles.mapLoading]}>
                        <Text>Loading map...</Text>
                    </View>
                )}
            </View>

            <SafeAreaView style={styles.bottomHalf} edges={['bottom']}>

                <FlatList
                    data={messages}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <MessageItem
                            item={item}
                            isSelected={selectedMessage?.id === item.id}
                            onPress={() => setSelectedMessage(item)}
                            onSwipeableOpen={setIsSwiping}
                            onCollectOrUncollect={handleCollect}
                            onHide={handleHide}
                            rightLabel="Collect"
                        />
                    )}
                    ListEmptyComponent={<Text style={styles.empty}>No messages nearby.</Text>}
                    refreshing={refreshing}
                    onRefresh={handleManualRefresh}
                />
            </SafeAreaView>

            {selectedMessage && messages.some((m) => m.id === selectedMessage.id) && (
                <Modal visible={true} animationType="fade" transparent onRequestClose={() => setSelectedMessage(null)}>
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPressOut={() => setSelectedMessage(null)}
                    >
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Message Details</Text>
                            <Image
                                source={avatarMap[selectedMessage.owner_profile_picture ?? 'avatar1.jpeg']}
                                style={styles.modalAvatar}
                            />
                            <Text style={styles.modalUsername}>{selectedMessage.owner_username}</Text>
                            <Text style={styles.modalDate}>Date Dropped: {formatDate(selectedMessage.created_at)}</Text>
                            <Text style={styles.modalMessageText}>{selectedMessage.text}</Text>
                            <TouchableOpacity
                                style={styles.modalCollectButton}
                                onPress={() => handleCollect(selectedMessage.id)}
                            >
                                <Text style={styles.modalCollectButtonText}>Collect</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalHideButton}
                                onPress={() => handleHide(selectedMessage.id)}
                            >
                                <Text style={styles.modalHideButtonText}>Hide</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    messageBox: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        backgroundColor: '#f9f9f9',
        height: 64,
        width: '100%',
    },
    messageText: { fontSize: 16, marginBottom: 4, fontFamily: 'ShortStack_400Regular' },
    empty: { textAlign: 'center', marginTop: 40, fontSize: 16, color: 'gray' },
    topHalf: { flex: 1, backgroundColor: 'white' },
    bottomHalf: { flex: 1, backgroundColor: 'white', paddingBottom: 20 },
    mapView: { flex: 1, width: '100%', height: '100%', borderRadius: 16, overflow: 'hidden' },
    mapLoading: { justifyContent: 'center', alignItems: 'center' },
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
    modalTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 14, fontFamily: 'ShortStack_400Regular' },
    modalAvatar: {
        width: 120,
        height: 120,
        borderRadius: 120,
        marginBottom: 10,
        backgroundColor: '#ccc',
    },
    modalUsername: { fontSize: 24, marginBottom: 10, fontFamily: 'ShortStack_400Regular' },
    modalDate: { fontSize: 13, color: '#555', fontFamily: 'ShortStack_400Regular' },
    modalMessageText: {
        textAlign: 'left',
        alignSelf: 'stretch',
        fontSize: 16,
        color: 'black',
        fontFamily: 'ShortStack_400Regular',
        marginHorizontal: 10,
        marginVertical: 20,
    },
    modalCollectButton: {
        backgroundColor: 'black',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        width: 200,
    },
    modalCollectButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
        fontFamily: 'ShortStack_400Regular',
        textAlign: 'center',
    },
    modalHideButton: {
        backgroundColor: 'black',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginTop: 10,
        width: 200,
    },
    modalHideButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
        fontFamily: 'ShortStack_400Regular',
    },
    fullSwipeAction: {
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
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        backgroundColor: '#ccc',
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
});
