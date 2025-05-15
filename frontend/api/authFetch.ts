// Import SecureStore to securely store and retrieve tokens
import * as SecureStore from 'expo-secure-store';

// Import backend URL from your app config
import Constants from 'expo-constants';

// Import router to navigate user on logout
import { router } from 'expo-router';

// Get backend URL from config
const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl;

// Define a utility function for authenticated fetch requests
export async function authFetch(
    input: RequestInfo,
    init?: RequestInit,
    retry: boolean = true
): Promise<Response> {
    init = init || {};
    // Get access and refresh tokens from SecureStore
    const accessToken = await SecureStore.getItemAsync("user_token");
    const refreshToken = await SecureStore.getItemAsync("refresh_token");

    // Add Authorization and Content-Type headers
    const authHeaders = {
        ...(init.headers || {}),
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
    };

    // Make the API request with provided options and auth headers
    const response = await fetch(input, { ...init, headers: authHeaders });

    // If response is not 401 (unauthorized) or no retry needed, return original response
    if (response.status !== 401 || !retry || !refreshToken) return response;

    // Try refreshing the access token with the refresh token
    const refreshRes = await fetch(`${BACKEND_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: refreshToken }),
    });

    // If refresh fails, clear tokens and redirect to login
    if (!refreshRes.ok) {
        await SecureStore.deleteItemAsync("user_token");
        await SecureStore.deleteItemAsync("refresh_token");
        router.replace("/login");
        return response; // Return original 401 response
    }

    // Parse new access token and store it
    const { access_token } = await refreshRes.json();
    await SecureStore.setItemAsync("user_token", access_token);

    // Retry the original request with the new token
    const retryHeaders = {
        ...(init.headers || {}),
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
    };

    // Return the retried request
    return fetch(input, { ...init, headers: retryHeaders });
}
