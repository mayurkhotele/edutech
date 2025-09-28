import { auth } from '@/config/firebase';
import { apiFetch } from '@/constants/api';
import { clearAuthData, getToken, getUser, storeAuthData } from '@/utils/storage';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
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
    // Firebase OTP methods
    loginWithOTP: (phoneNumber: string) => Promise<any>;
    verifyOTP: (otp: string) => Promise<any>;
    firebaseUser: FirebaseUser | null;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => {},
    register: async () => {},
    logout: () => {},
    updateUser: () => {},
    loginWithOTP: async () => {},
    verifyOTP: async () => {},
    firebaseUser: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

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

    // Firebase Auth State Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setFirebaseUser(firebaseUser);
            console.log('Firebase auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        console.log('AuthContext login called with email:', email);
        console.log('API URL:', '/auth/login');

        const trimmedEmail = (email || '').trim();
        const trimmedPassword = (password || '').trim();
        const looksLikePhone = /^\+?\d{10,15}$/.test(trimmedEmail);

        const candidateBodies: Array<{ label: string; body: any }> = [];
        // Primary guess based on input format
        if (looksLikePhone) {
            candidateBodies.push({ label: 'phoneNumber', body: { phoneNumber: trimmedEmail, password: trimmedPassword } });
            candidateBodies.push({ label: 'emailOrPhone', body: { emailOrPhone: trimmedEmail, password: trimmedPassword } });
        } else {
            candidateBodies.push({ label: 'email', body: { email: trimmedEmail, password: trimmedPassword } });
            candidateBodies.push({ label: 'identifier', body: { identifier: trimmedEmail, password: trimmedPassword } });
            candidateBodies.push({ label: 'username', body: { username: trimmedEmail, password: trimmedPassword } });
            candidateBodies.push({ label: 'emailOrPhone', body: { emailOrPhone: trimmedEmail, password: trimmedPassword } });
        }

        let lastError: any = null;
        for (const attempt of candidateBodies) {
            try {
                console.log('Making API call to login with payload shape:', attempt.label);
                const response = await apiFetch('/auth/login', {
                    method: 'POST',
                    body: attempt.body,
                });

                console.log('API response received:', response?.status);

                if (response.ok) {
                    const { token, user: userData } = response.data;
                    const userWithToken = { ...userData, token } as any;
                    console.log('Login successful - New user data:', userWithToken);
                    setUser(userWithToken);
                    await storeAuthData(token, userData);
                    return userWithToken;
                } else {
                    console.log('Login failed - response not ok for payload shape:', attempt.label, response);
                    lastError = response.data || response;
                }
            } catch (error: any) {
                console.error('Login attempt failed for payload shape:', attempt.label, error);
                lastError = error;
            }
        }

        console.error('All login attempts failed. Last error:', lastError);
        throw lastError || { message: 'Login failed. Please try again.' };
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
        setFirebaseUser(null);
        await clearAuthData();
        // Also sign out from Firebase
        try {
            await auth.signOut();
        } catch (error) {
            console.error('Firebase sign out error:', error);
        }
        console.log('Logout completed - User state cleared');
    };

    const updateUser = (userData: Partial<User>) => {
        setUser(prevUser => prevUser ? { ...prevUser, ...userData } as User : null);
    };

    // Firebase OTP Methods
    const loginWithOTP = async (phoneNumber: string) => {
        try {
            // This will be handled by the authService
            // We just need to return a promise for consistency
            return { success: true, phoneNumber };
        } catch (error) {
            console.error('OTP login error:', error);
            throw error;
        }
    };

    const verifyOTP = async (otp: string) => {
        try {
            // This will be handled by the authService
            // We just need to return a promise for consistency
            return { success: true, otp };
        } catch (error) {
            console.error('OTP verification error:', error);
            throw error;
        }
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        loginWithOTP,
        verifyOTP,
        firebaseUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 