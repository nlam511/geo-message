import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { authFetch } from '@/api/authFetch';

export async function registerPushNotificationsAsync(): Promise<void> {
  try {
    // Ask for permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('🚫 Push notification permission denied.');
      return;
    }

    // Get the token
    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })
    ).data;

    console.log('✅ Got Expo push token:', token);

    // Send to backend
    const backendUrl = Constants.expoConfig?.extra?.backendUrl;
    await authFetch(`${backendUrl}/auth/push-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ push_token: token }),
    });

    console.log('✅ Push token sent to backend');
  } catch (err) {
    console.error('❌ Failed to register for push notifications:', err);
  }
}
