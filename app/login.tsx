import { AppColors } from '@/constants/Colors'
import { useAuth } from '@/context/AuthContext'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

const login = () => {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [secureTextEntry, setSecureTextEntry] = useState(true);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password.');
            return;
        }
        try {
            await login(email, password);
        } catch (error: any) {
            const errorMessage = error?.data?.message || error?.message || 'An unknown error occurred.';
            Alert.alert('Login Failed', errorMessage);
        }
    };

    return (
        <LinearGradient
            colors={[AppColors.secondary, AppColors.primary]}
            style={styles.container}
        >
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={AppColors.white} />
            </TouchableOpacity>
            <View style={styles.content}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Ready to continue your learning journey? Your path is right here.</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Enter email"
                    placeholderTextColor={AppColors.lightGrey}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor={AppColors.lightGrey}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={secureTextEntry}
                    />
                    <TouchableOpacity onPress={() => setSecureTextEntry(!secureTextEntry)} style={styles.eyeIcon}>
                        <Ionicons name={secureTextEntry ? "eye-off" : "eye"} size={24} color={AppColors.grey} />
                    </TouchableOpacity>
                </View>


                <View style={styles.optionsContainer}>
                    <Text style={styles.rememberMe}>Remember me</Text>
                    <TouchableOpacity>
                        <Text style={styles.forgotPassword}>Forgot password?</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={handleLogin}>
                    <LinearGradient
                        colors={[AppColors.pink, AppColors.purple]}
                        style={styles.loginButton}
                    >
                        <Text style={styles.loginButtonText}>Log In</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.signInWith}>Sign in with</Text>
                
                <View style={styles.socialIconsContainer}>
                    {/* Placeholder for social icons */}
                    <View style={styles.socialIcon}><Text>G</Text></View>
                    <View style={styles.socialIcon}><Text>F</Text></View>
                    <View style={styles.socialIcon}><Text>A</Text></View>
                </View>

                <View style={styles.signUpContainer}>
                    <Text style={styles.accountText}>Don't have an account? </Text>
                    <TouchableOpacity onPress={() => router.push('/register')}>
                        <Text style={styles.signUpText}>Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </LinearGradient>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: AppColors.white,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: AppColors.lightGrey,
        marginBottom: 40,
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 10,
        padding: 15,
        color: AppColors.white,
        fontSize: 16,
        marginBottom: 20,
        width: '100%',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 10,
    },
    eyeIcon: {
        position: 'absolute',
        right: 15,
    },
    optionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    rememberMe: {
        color: AppColors.lightGrey,
    },
    forgotPassword: {
        color: AppColors.lightGrey,
        fontWeight: 'bold',
    },
    loginButton: {
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
    },
    loginButtonText: {
        color: AppColors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    signInWith: {
        textAlign: 'center',
        color: AppColors.lightGrey,
        marginVertical: 30,
    },
    socialIconsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 30,
    },
    socialIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: AppColors.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 10,
    },
    signUpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    accountText: {
        color: AppColors.lightGrey,
    },
    signUpText: {
        color: AppColors.white,
        fontWeight: 'bold',
    }
});

export default login; 