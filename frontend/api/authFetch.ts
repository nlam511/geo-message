import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';


/**
 * A wrapper around the native fetch API that handles authenticated requests.
 * 
 * Features:
 * - Automatically adds the access token (from SecureStore) to the Authorization header.
 * - If the access token is expired (i.e., a 401 Unauthorized response is received),
 *   it attempts to refresh the access token using the stored refresh token.
 * - If the refresh succeeds, it retries the original request with the new access token.
 * - If the refresh fails (e.g., refresh token is expired or invalid), it clears both tokens
 *   from SecureStore and redirects the user to the login screen.
 * 
 * Usage:
 * Replace standard `fetch` calls with `authFetch` for any authenticated API endpoints.
 * 
 * @param url - The full URL of the API endpoint.
 * @param options - Optional fetch options (method, headers, body, etc.).
 * @returns A fetch Response object.
 * @throws An error if the session has expired and refresh fails.
 */
export async function authFetch(url: string, options: RequestInit = {}) {
    let accessToken = await SecureStore.getItemAsync('user_token');

    let res = await fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (res.status === 401) {
        // Access token expired – try refresh
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        const refreshRes = await fetch('https://your-api.com/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: refreshToken }),
        });

        if (refreshRes.ok) {
            const data = await refreshRes.json();
            await SecureStore.setItemAsync('token', data.access_token);

            // Retry original request
            res = await fetch(url, {
                ...options,
                headers: {
                    ...(options.headers || {}),
                    Authorization: `Bearer ${data.access_token}`,
                    'Content-Type': 'application/json',
                },
            });
        } else {
            // Refresh failed → force logout
            await SecureStore.deleteItemAsync('user_token');
            await SecureStore.deleteItemAsync('refresh_token');
            router.replace('/(auth)/login');
            throw new Error('Session expired. Please log in again.');
        }
    }

    return res;
}