import { apiFetch } from '@/constants/api';
import { clearAuthData, getToken, getUser, storeAuthData } from '@/utils/storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    token: string;
    // Add any other user properties here
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<any>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => {},
    logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            setLoading(true);
            try {
                const token = await getToken();
                const userData = await getUser();
                if (token && userData) {
                    setUser({ ...userData, token });
                }
            } catch (e) {
                console.error("Failed to load user", e);
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await apiFetch('/auth/login', {
                method: 'POST',
                body: { email, password },
            });

            if (response.ok) {
                const { token, user: userData } = response.data;
                const userWithToken = { ...userData, token };
                setUser(userWithToken);
                await storeAuthData(token, userData);
                return userWithToken;
            } else {
                throw response.data;
            }
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const logout = async () => {
        setUser(null);
        await clearAuthData();
    };

    const value = {
        user,
        loading,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 