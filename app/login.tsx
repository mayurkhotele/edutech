import { AppColors } from '@/constants/Colors'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { AntDesign, FontAwesome, Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

const Login = () => {
    const auth = useAuth();
    const { showError, showSuccess } = useToast();
    console.log('Auth context received:', auth);
    console.log('Login function from auth:', auth.login);
    
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [secureTextEntry, setSecureTextEntry] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLogin = async () => {
        if (isSubmitting) return;
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium) } catch {}
        console.log('Login attempt started');
        console.log('Email:', email);
        console.log('Password length:', password.length);
        
        if (!email || !password) {
            showError('Please enter both email and password.');
            return;
        }
        
        console.log('Calling login function...');
        setIsSubmitting(true);
        try {
            const result = await auth.login(email, password);
            console.log('Login successful:', result);
            showSuccess('Login successful! Welcome back.');
        } catch (error: any) {
            console.error('Login error details:', error);
            let errorMessage = 'An unknown error occurred.';
            
            // Handle different types of errors
            if (error?.error) {
                // Direct error object from API
                errorMessage = error.error;
            } else if (error?.data?.error) {
                // Nested error in data
                errorMessage = error.data.error;
            } else if (error?.data?.message) {
                errorMessage = error.data.message;
            } else if (error?.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }
            
            console.log('Processed error message:', errorMessage);
            
            // Show specific error messages for common cases
            if (errorMessage.toLowerCase().includes('invalid credentials')) {
                showError('Incorrect email or password. Please check your credentials and try again.');
            } else {
                showError(errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <LinearGradient
            colors={["#4c1d95", "#7c3aed", "#a855f7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            {/* Soft decorative blobs */}
            <View style={styles.bgDecor} pointerEvents="none">
                <LinearGradient colors={[ 'rgba(124,58,237,0.35)', 'rgba(168,85,247,0.15)' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.bgBlob, { top: -40, left: -80, width: 220, height: 220 }]} />
                <LinearGradient colors={[ 'rgba(168,85,247,0.30)', 'rgba(124,58,237,0.12)' ]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={[styles.bgBlob, { top: 140, right: -90, width: 240, height: 240 }]} />
                <LinearGradient colors={[ 'rgba(0,0,0,0.08)', 'transparent' ]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={[styles.bgBlob, { bottom: 80, left: 20, width: 160, height: 160 }]} />
            </View>
          
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

                    <TouchableOpacity onPress={handleLogin} activeOpacity={0.9} disabled={isSubmitting}>
                        <LinearGradient
                            colors={["#f59e0b", "#f97316"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.loginButton, isSubmitting && { opacity: 0.7 }]}
                        >
                            {isSubmitting ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <ActivityIndicator color="#fff" size="small" />
                                    <Text style={[styles.loginButtonText, { marginLeft: 8 }]}>Logging in…</Text>
                                </View>
                            ) : (
                                <Text style={styles.loginButtonText}>Log In</Text>
                            )}
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
    bgDecor: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
    },
    bgBlob: {
        position: 'absolute',
        borderRadius: 999,
        opacity: 1,
    },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 20,
        zIndex: 1,
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 0,
        marginBottom: 0,
    },
    glassCard: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.14,
        shadowRadius: 18,
        elevation: 6,
        alignItems: 'center',
        minHeight: '70%',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#555',
        marginBottom: 32,
        textAlign: 'center',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 12,
        marginBottom: 14,
        paddingHorizontal: 12,
        width: '100%',
        borderWidth: 1,
        borderColor: '#e5e7eb',
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
        marginBottom: 16,
    },
    rememberMe: {
        color: '#333',
        fontSize: 13,
        fontWeight: '500',
    },
    forgotPassword: {
        color: '#6C63FF',
        fontWeight: 'bold',
        fontSize: 13,
    },
    loginButton: {
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        marginBottom: 16,
        width: 200,
        alignSelf: 'center',
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
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
        color: '#333',
        marginVertical: 18,
        fontSize: 14,
        fontWeight: '500',
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
        color: '#333',
        fontSize: 14,
        fontWeight: '500',
    },
    signUpText: {
        color: '#6C63FF',
        fontWeight: 'bold',
        fontSize: 15,
    },
})

export default Login; 