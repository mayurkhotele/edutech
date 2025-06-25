import { AppColors } from '@/constants/Colors'
import { useAuth } from '@/context/AuthContext'
import { AntDesign, FontAwesome, Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

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
            colors={["#6C63FF", "#FF6CAB", "#FFD452"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
          
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={AppColors.white} />
            </TouchableOpacity>
            <View style={styles.centeredContent}>
                <View style={styles.glassCard}>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Ready to continue your learning journey? Your path is right here.</Text>

                    <View style={styles.inputWrapper}>
                        <Ionicons name="mail-outline" size={20} color="#B0B3C6" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter email"
                            placeholderTextColor="#B0B3C6"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>
                    <View style={styles.inputWrapper}>
                        <Ionicons name="lock-closed-outline" size={20} color="#B0B3C6" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#B0B3C6"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={secureTextEntry}
                        />
                        <TouchableOpacity onPress={() => setSecureTextEntry(!secureTextEntry)} style={styles.eyeIcon}>
                            <Ionicons name={secureTextEntry ? "eye-off" : "eye"} size={22} color="#B0B3C6" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.optionsContainer}>
                        <Text style={styles.rememberMe}>Remember me</Text>
                        <TouchableOpacity>
                            <Text style={styles.forgotPassword}>Forgot password?</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={handleLogin} activeOpacity={0.85}>
                        <LinearGradient
                            colors={["#FF6CAB", "#7366FF"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.loginButton}
                        >
                            <Text style={styles.loginButtonText}>Log In</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <Text style={styles.signInWith}>Sign in with</Text>
                    <View style={styles.socialIconsContainer}>
                        <TouchableOpacity style={[styles.socialIcon, { backgroundColor: '#fff' }]}> 
                            <AntDesign name="google" size={24} color="#EA4335" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.socialIcon, { backgroundColor: '#fff' }]}> 
                            <FontAwesome name="facebook" size={24} color="#1877F3" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.socialIcon, { backgroundColor: '#fff' }]}> 
                            <AntDesign name="apple1" size={24} color="#222" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.signUpContainer}>
                        <Text style={styles.accountText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/register')}>
                            <Text style={styles.signUpText}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
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
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 20,
        zIndex: 1,
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    glassCard: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: 28,
        padding: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
        elevation: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        marginHorizontal: 16,
        marginTop: Platform.OS === 'ios' ? 60 : 0,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#f3eaff',
        marginBottom: 32,
        textAlign: 'center',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: 12,
        marginBottom: 18,
        paddingHorizontal: 12,
        width: '100%',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
        elevation: 1,
    },
    inputIcon: {
        marginRight: 6,
    },
    input: {
        flex: 1,
        color: '#222',
        fontSize: 16,
        paddingVertical: 14,
        backgroundColor: 'transparent',
    },
    eyeIcon: {
        padding: 4,
    },
    optionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 24,
    },
    rememberMe: {
        color: '#f3eaff',
        fontSize: 13,
    },
    forgotPassword: {
        color: '#FFD452',
        fontWeight: 'bold',
        fontSize: 13,
    },
    loginButton: {
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 18,
        width: 180,
        alignSelf: 'center',
        shadowColor: '#FF6CAB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 4,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    signInWith: {
        textAlign: 'center',
        color: '#f3eaff',
        marginVertical: 18,
        fontSize: 14,
    },
    socialIconsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 18,
    },
    socialIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 6,
        elevation: 2,
    },
    signUpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 8,
    },
    accountText: {
        color: '#f3eaff',
        fontSize: 14,
    },
    signUpText: {
        color: '#FFD452',
        fontWeight: 'bold',
        fontSize: 15,
    },
    cornerBook: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 90,
        height: 90,
        opacity: 0.18,
        zIndex: 0,
    },
    cornerCap: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 110,
        height: 110,
        opacity: 0.15,
        zIndex: 0,
    },
})

export default login; 