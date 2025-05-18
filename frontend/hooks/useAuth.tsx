import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { router } from 'expo-router';
import { authFetch } from '@/api/authFetch';
import Constants from 'expo-constants';

interface UserInfo {
    id: string;
    email: string;
}

interface AuthContextType {
    user: UserInfo | null;
    isAuthenticated: boolean;
    isAuthLoading: boolean;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    const logout = async () => {
        try {
            const refreshToken = await SecureStore.getItemAsync('refresh_token');
            const backendUrl = Constants.expoConfig?.extra?.backendUrl;

            if (refreshToken) {
                await authFetch(`${backendUrl}/auth/logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: refreshToken }),
                });
            }
        } catch (err) {
            console.warn('Logout request error (ignored):', err);
        }

        await SecureStore.deleteItemAsync('user_token');
        await SecureStore.deleteItemAsync('refresh_token');
        setUser(null);
        router.replace('/(auth)/login'); // Make sure this matches your routing
    };

    const refresh = async () => {
        const token = await SecureStore.getItemAsync('user_token');
        if (!token) {
            console.warn('🔐 No user_token found. Logging out.');
            return logout();
        }

        try {
            const decoded = jwtDecode<{ exp: number }>(token);
            const isExpired = decoded.exp * 1000 < Date.now();
            const backendUrl = Constants.expoConfig?.extra?.backendUrl;

            if (isExpired) {
                const refreshToken = await SecureStore.getItemAsync('refresh_token');
                if (!refreshToken) {
                    console.warn('🔁 Token expired, but no refresh token found. Logging out.');
                    return logout();
                }

                const response = await fetch(`${backendUrl}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: refreshToken }),
                });

                if (!response.ok) {
                    console.warn('🔁 Refresh token invalid. Logging out.');
                    return logout();
                }

                const data = await response.json();
                await SecureStore.setItemAsync('user_token', data.access_token);
            }

            const res = await authFetch(`${backendUrl}/auth/me`);
            if (!res.ok) throw new Error('Failed to fetch /auth/me');

            const data = await res.json();
            setUser({ id: data.id, email: data.email });
        } catch (err) {
            console.warn('❌ Auth refresh failed:', err);
            await logout(); // Ensure cleanup, but avoid throwing
        }
    };

    useEffect(() => {
        const init = async () => {
            const token = await SecureStore.getItemAsync('user_token');
            if (!token) {
                console.log('🛑 No token at startup. Skipping refresh.');
                setIsAuthLoading(false);
                return;
            }

            await refresh();
            setIsAuthLoading(false);
        };
        init();
    }, []);


    const contextValue: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isAuthLoading,
        logout,
        refresh,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}
