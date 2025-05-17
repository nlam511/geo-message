import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { router } from 'expo-router';
import { authFetch } from '@/api/authFetch';

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
            const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

            await authFetch(`${backendUrl}/auth/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: refreshToken }),
            });
        } catch (err) {
            console.warn('Logout failed silently:', err);
        }

        await SecureStore.deleteItemAsync('user_token');
        await SecureStore.deleteItemAsync('refresh_token');
        setUser(null);
        router.replace('/login');
    };

    const refresh = async () => {
        const token = await SecureStore.getItemAsync('user_token');
        if (!token) return logout();

        try {
            const decoded = jwtDecode<{ exp: number }>(token);
            const isExpired = decoded.exp * 1000 < Date.now();

            if (isExpired) {
                const refreshToken = await SecureStore.getItemAsync('refresh_token');
                const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

                const response = await fetch(`${backendUrl}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: refreshToken }),
                });

                if (!response.ok) return logout();

                const data = await response.json();
                await SecureStore.setItemAsync('user_token', data.access_token);
            }

            const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
            const res = await authFetch(`${backendUrl}/auth/me`);
            const data = await res.json();
            setUser({ id: data.id, email: data.email });
        } catch (err) {
            console.warn('Auth refresh failed:', err);
            logout();
        }
    };

    useEffect(() => {
        const init = async () => {
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
        <AuthContext.Provider value= { contextValue } >
        { children }
        </AuthContext.Provider>
  );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}