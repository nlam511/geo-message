import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import Constants from 'expo-constants';

/**
 * Makes authenticated API requests and handles token refresh on 401 errors.
 * Includes detailed logs for success, failure, and retry behavior.
 */
export async function authFetch(url: string, options: RequestInit = {}) {
  const backendUrl = Constants.expoConfig?.extra?.backendUrl;
  let accessToken = await SecureStore.getItemAsync('user_token');
  let refreshToken = await SecureStore.getItemAsync('refresh_token');

  console.log(`[authFetch] 🔄 Initial request to ${url}`);

  // Initial request with access token
  let res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (res.status !== 401) {
    if (res.ok) {
      console.log(`[authFetch] ✅ Request succeeded with status ${res.status}`);
    } else {
      console.warn(`[authFetch] ⚠️ Request failed with status ${res.status}`);
    }
    return res;
  }

  // Access token expired or invalid
  console.warn(`[authFetch] ⚠️ Access token expired (401). Attempting to refresh token.`);

  if (!refreshToken) {
    console.error(`[authFetch] ❌ No refresh token found. Logging out.`);
    await SecureStore.deleteItemAsync('user_token');
    await SecureStore.deleteItemAsync('refresh_token');
    router.replace('/(auth)/login');
    throw new Error('Session expired. Please log in again.');
  }

  const refreshRes = await fetch(`${backendUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: refreshToken }),
  });

  if (!refreshRes.ok) {
    console.error(`[authFetch] ❌ Refresh token request failed. Status: ${refreshRes.status}`);
    await SecureStore.deleteItemAsync('user_token');
    await SecureStore.deleteItemAsync('refresh_token');
    router.replace('/(auth)/login');
    throw new Error('Session expired. Please log in again.');
  }

  const data = await refreshRes.json();
  const newAccessToken = data.access_token;

  console.log(`[authFetch] 🔁 Token refreshed. Retrying original request.`);

  await SecureStore.setItemAsync('user_token', newAccessToken);

  // Retry original request with new access token
  res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${newAccessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (res.status === 401) {
    console.error(`[authFetch] ❌ Retried request still returned 401. Logging out.`);
    await SecureStore.deleteItemAsync('user_token');
    await SecureStore.deleteItemAsync('refresh_token');
    router.replace('/(auth)/login');
    throw new Error('Session expired after retry. Please log in again.');
  }

  if (res.ok) {
    console.log(`[authFetch] ✅ Retried request succeeded with status ${res.status}`);
  } else {
    console.warn(`[authFetch] ⚠️ Retried request failed with status ${res.status}`);
  }

  return res;
}
