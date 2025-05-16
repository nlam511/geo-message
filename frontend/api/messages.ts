import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

type APIResponse =
    | { status: 'success' }
    | { status: 'unauthorized'; message: string }
    | { status: 'server_error'; message: string }
    | { status: 'network_error'; message: string };



export async function collectMessage(message_id: string): Promise<APIResponse> {
    try {
        console.log(`[Collect] Attempting to collect message ${message_id}`);
        const token = await SecureStore.getItemAsync("user_token");
        if (!token) {
            console.warn("[Collect] No token found – user not logged in.");
            return {
                status: "unauthorized",
                message: "You must be logged in to perform this action.",
            };
        }

        const backendUrl = Constants.expoConfig?.extra?.backendUrl;
        const response = await fetch(`${backendUrl}/message/${message_id}/collect`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (response.ok) {
            console.log("[Collect] Message collected successfully.");
            return { status: "success" };
        } else {
            const error = await response.json();
            console.error("[Collect] Server error:", error);
            return {
                status: "server_error",
                message: error.detail || "Failed to collect message.",
            };
        }
    } catch (err) {
        console.error("[Collect] Network error:", err);
        return {
            status: "network_error",
            message: "Something went wrong while connecting to the server.",
        };
    }
}



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


export async function hideMessage(message_id: string): Promise<APIResponse> {
    try {
        console.log(`[Hide] Attempting to uncollect message ${message_id}`);
        const token = await SecureStore.getItemAsync("user_token");
        if (!token) {
            console.warn("[Hide] No token found – user not logged in.");
            return {
                status: "unauthorized",
                message: "You must be logged in to perform this action.",
            };
        }

        const backendUrl = Constants.expoConfig?.extra?.backendUrl;
        const response = await fetch(`${backendUrl}/message/${message_id}/hide`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (response.ok) {
            console.log("[Hide] Message hidden successfully.");
            return { status: "success" };
        } else {
            const error = await response.json();
            console.error("[Hide] Server error:", error);
            return {
                status: "server_error",
                message: error.detail || "[Uncollect] Failed to uncollect message.",
            };
        }
    } catch (err) {
        console.error("[Hide] Network error:", err);
        return {
            status: "network_error",
            message: "Something went wrong while connecting to the server.",
        };
    }
}

export async function dropMessage(
    message_text: string,
    coords: { latitude: number; longitude: number }
  ): Promise<APIResponse> {
    const token = await SecureStore.getItemAsync("user_token");
    if (!token) {
      return {
        status: "unauthorized",
        message: "[Drop] You must be logged in to perform this action.",
      };
    }
  
    if (!message_text.trim()) {
      return {
        status: "unauthorized",
        message: "[Drop] You cannot drop an empty message.",
      };
    }
  
    try {
      const backendUrl = Constants.expoConfig?.extra?.backendUrl;
      const response = await fetch(`${backendUrl}/message/drop`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: message_text,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      });
  
      if (response.ok) {
        return { status: "success" };
      } else {
        const error = await response.json();
        return {
          status: "server_error",
          message: error.detail || "[Drop] Failed to drop message.",
        };
      }
    } catch (err) {
      console.error("[Drop] Network error:", err);
      return {
        status: "network_error",
        message: "Could not connect to the server.",
      };
    }
  }