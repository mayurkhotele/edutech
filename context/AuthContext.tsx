import { apiFetch } from '@/constants/api';
import { clearAuthData, getToken, getUser, storeAuthData } from '@/utils/storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    token: string;
    profilePicture?: string;
    profilePhoto?: string;
    handle?: string;
    followers?: number;
    following?: number;
    // Add any other user properties here
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<any>;
    logout: () => void;
    updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => {},
    logout: () => {},
    updateUser: () => {},
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
                console.log('Login successful - New user data:', userWithToken);
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
        console.log('Logging out - Clearing user data');
        setUser(null);
        await clearAuthData();
        console.log('Logout completed - User state cleared');
    };

    const updateUser = (userData: Partial<User>) => {
        setUser(prevUser => prevUser ? { ...prevUser, ...userData } as User : null);
    };

    const value = {
        user,
        loading,
        login,
        logout,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 