import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { collectMessage, hideMessage } from '@/api/messages';
import * as Haptics from 'expo-haptics';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';

export default function NearbyScreen() {
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [region, setRegion] = useState<Region | null>(null);

  const insets = useSafeAreaInsets();

  const refreshMessages = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync("user_token");
      if (!token) {
        Alert.alert("❌ You must be logged in to get nearby messages.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const backendUrl = Constants.expoConfig?.extra?.backendUrl;
      const response = await fetch(
        `${backendUrl}/message/nearby?latitude=${location.coords.latitude}&longitude=${location.coords.longitude}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      setMessages(data);

      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
      });

    } catch (error) {
      console.error("Error refreshing messages:", error);
      Alert.alert("❌ Failed to refresh messages.");
    }
  }, []);

  const handleCollect = async (id: string) => {
    const result = await collectMessage(id);
    if (result.status === "success") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await refreshMessages();
      setSelectedMessage(null);
    } else {
      Alert.alert("❌ Collect Failed", result.message);
    }
  };

  const handleHide = async (id: string) => {
    const result = await hideMessage(id);
    if (result.status === "success") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await refreshMessages();
      setSelectedMessage(null);
    } else {
      Alert.alert("❌ Hide Failed", result.message);
    }
  };

  const renderRightActions = (item: any) => (
    <TouchableOpacity
      style={[styles.swipeAction, styles.collectSwipe]}
      onPress={() => handleCollect(item.id)}
    >
      <Text style={styles.swipeText}>Collect</Text>
    </TouchableOpacity>
  );

  const renderLeftActions = (item: any) => (
    <TouchableOpacity
      style={[styles.swipeAction, styles.hideSwipe]}
      onPress={() => handleHide(item.id)}
    >
      <Text style={styles.swipeText}>Hide</Text>
    </TouchableOpacity>
  );

  useFocusEffect(
    useCallback(() => {
      let timeoutId: ReturnType<typeof setTimeout>;

      const poll = async () => {
        if (!selectedMessage && !isSwiping) {
          await refreshMessages();
        }
        timeoutId = setTimeout(poll, 5000);
      };

      poll();

      return () => clearTimeout(timeoutId);
    }, [refreshMessages, selectedMessage, isSwiping])
  );

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      {/* Map in top half with margin to extend into notch */}
      <View style={[styles.topHalf, { marginTop: -insets.top }]}>
        {region ? (
          <MapView
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

      {/* Bottom half: list, wrapped in SafeArea for bottom padding */}
      <SafeAreaView style={styles.bottomHalf} edges={['bottom']}>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Swipeable
              renderLeftActions={() => renderLeftActions(item)}
              renderRightActions={() => renderRightActions(item)}
              onSwipeableWillOpen={() => setIsSwiping(true)}
              onSwipeableClose={() => setIsSwiping(false)}
            >
              <TouchableOpacity onPress={() => setSelectedMessage(item)}>
                <View style={styles.messageBox}>
                  <Text style={styles.messageText}>{item.text}</Text>
                  <Text style={styles.meta}>📍 Lat: {item.latitude}, Lng: {item.longitude}</Text>
                </View>
              </TouchableOpacity>
            </Swipeable>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No messages nearby.</Text>}
        />
      </SafeAreaView>

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
                onPress={() => handleCollect(selectedMessage.id)}
              >
                <Text style={styles.collectButtonText}>Collect</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.hideButton}
                onPress={() => handleHide(selectedMessage.id)}
              >
                <Text style={styles.hideButtonText}>Hide</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  messageBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  messageText: { fontSize: 16, marginBottom: 4 },
  meta: { fontSize: 12, color: 'gray' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 16, color: 'gray' },
  topHalf: {
    flex: 1,
    backgroundColor: 'white',
  },
  bottomHalf: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  mapView: { flex: 1, width: '100%', height: '100%' },
  mapLoading: { justifyContent: 'center', alignItems: 'center' },
  swipeAction: { justifyContent: 'center', alignItems: 'center', width: 100, height: '100%' },
  hideSwipe: { backgroundColor: '#FF3B30' },
  collectSwipe: { backgroundColor: '#007AFF' },
  swipeText: { color: 'white', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: 'white', borderRadius: 12, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  modalText: { fontSize: 16, marginBottom: 10 },
  modalMeta: { fontSize: 14, color: 'gray', marginBottom: 20 },
  modalCloseIcon: { position: 'absolute', top: 10, right: 10, zIndex: 10, backgroundColor: '#ff3b30', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  modalCloseText: { color: 'white', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  collectButton: { backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  collectButtonText: { color: 'white', fontWeight: '600', fontSize: 16 },
  hideButton: { backgroundColor: '#FF3B30', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginTop: 10 },
  hideButtonText: { color: 'white', fontSize: 16, fontWeight: '500', textAlign: 'center' },
});
