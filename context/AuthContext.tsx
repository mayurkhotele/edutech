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
    register: (userData: { name: string; email: string; password: string; phoneNumber: string; referralCode?: string }) => Promise<any>;
    logout: () => void;
    updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => {},
    register: async () => {},
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
        console.log('AuthContext login called with email:', email);
        console.log('API URL:', '/auth/login');
        
        try {
            console.log('Making API call to login...');
            const response = await apiFetch('/auth/login', {
                method: 'POST',
                body: { email, password },
            });

            console.log('API response received:', response);

            if (response.ok) {
                const { token, user: userData } = response.data;
                const userWithToken = { ...userData, token };
                console.log('Login successful - New user data:', userWithToken);
                setUser(userWithToken);
                await storeAuthData(token, userData);
                return userWithToken;
            } else {
                console.log('Login failed - response not ok:', response);
                // Throw the entire response data so it can be properly handled
                throw response.data;
            }
        } catch (error) {
            console.error('Login failed with error:', error);
            // Re-throw the error so it can be caught by the login screen
            throw error;
        }
    };

    const register = async (userData: { name: string; email: string; password: string; phoneNumber: string; referralCode?: string }) => {
        console.log('AuthContext register called with user data:', userData);
        console.log('API URL:', '/auth/register');

        try {
            console.log('Making API call to register...');
            const response = await apiFetch('/auth/register', {
                method: 'POST',
                body: userData,
            });

            console.log('API response received:', response);

            if (response.ok) {
                const { token, user: registeredUser } = response.data;
                const userWithToken = { ...registeredUser, token };
                console.log('Registration successful - New user data:', userWithToken);
                setUser(userWithToken);
                await storeAuthData(token, registeredUser);
                return userWithToken;
            } else {
                console.log('Registration failed - response not ok:', response);
                // Handle different types of errors
                if (response.data && response.data.message) {
                    throw new Error(response.data.message);
                } else if (response.data && response.data.error) {
                    throw new Error(response.data.error);
                } else {
                    throw new Error('Registration failed. Please try again.');
                }
            }
        } catch (error) {
            console.error('Registration failed with error:', error);
            // Re-throw the error so it can be caught by the registration screen
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
        register,
        logout,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 