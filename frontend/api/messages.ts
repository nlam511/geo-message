import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

type APIResponse =
    | { status: 'success' }
    | { status: 'unauthorized'; message: string }
    | { status: 'server_error'; message: string }
    | { status: 'network_error'; message: string };


export async function uncollectMessage(message_id: string): Promise<APIResponse> {
    try {
        console.log(`[Uncollect] Attempting to uncollect message ${message_id}`);
        const token = await SecureStore.getItemAsync("user_token");
        if (!token) {
            console.warn("[Uncollect] No token found – user not logged in.");
            return {
                status: "unauthorized",
                message: "You must be logged in to perform this action.",
            };
        }

        const backendUrl = Constants.expoConfig?.extra?.backendUrl;
        const response = await fetch(`${backendUrl}/message/${message_id}/uncollect`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (response.ok) {
            console.log("[Uncollect] Message uncollected successfully.");
            return { status: "success" };
        } else {
            const error = await response.json();
            console.error("[Uncollect] Server error:", error);
            return {
                status: "server_error",
                message: error.detail || "Failed to uncollect message.",
            };
        }
    } catch (err) {
        console.error("[Uncollect] Network error:", err);
        return {
            status: "network_error",
            message: "Something went wrong while connecting to the server.",
        };
    }
}
