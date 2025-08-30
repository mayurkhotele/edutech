import { AppColors } from '@/constants/Colors'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

const Register = () => {
    const { register } = useAuth();
    const { showError, showSuccess } = useToast();
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [secureTextEntry, setSecureTextEntry] = useState(true);

    const handleRegister = async () => {
        console.log('handleRegister called with:', { name, email, phoneNumber, referralCode });
        
        if (!name || !email || !password || !phoneNumber) {
            showError('Please fill all the required fields.');
            return;
        }
        
        // Basic validation
        if (password.length < 6) {
            showError('Password must be at least 6 characters long.');
            return;
        }
        
        if (!email.includes('@')) {
            showError('Please enter a valid email address.');
            return;
        }
        
        try {
            console.log('Calling register function...');
            const userData = { name, email, password, phoneNumber, referralCode };
            console.log('User data to register:', userData);
            
            await register(userData);
            console.log('Registration successful!');
            showSuccess('Registration successful! Please log in.');
            setTimeout(() => {
                router.replace('/login');
            }, 2000);
        } catch (error: any) {
            console.error('Registration failed:', error);
            let errorMessage = 'Registration failed. Please try again.';
            
            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error?.message) {
                errorMessage = error.message;
            }
            
            console.log('Error message to show:', errorMessage);
            
            // Show specific error messages
            if (errorMessage.toLowerCase().includes('email already exists')) {
                showError('This email is already registered. Please use a different email or try logging in.');
            } else if (errorMessage.toLowerCase().includes('phone')) {
                showError('Please enter a valid phone number.');
            } else if (errorMessage.toLowerCase().includes('password')) {
                showError('Password is too weak. Please use a stronger password.');
            } else {
                showError(errorMessage);
            }
        }
    };

    return (
        <LinearGradient
            colors={["#6C63FF", "#FF6CAB", "#FFD452"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            {/* Corner Education Effects */}
         
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={AppColors.white} />
            </TouchableOpacity>
            <View style={styles.centeredContent}>
                <View style={styles.glassCard}>
                    <Text style={styles.title}>Create Your Account</Text>
                    <Text style={styles.subtitle}>We're here to help you reach the peaks of learning. Are you ready?</Text>

                    <View style={styles.inputWrapper}>
                        <Ionicons name="person-outline" size={20} color="#B0B3C6" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter full name"
                            placeholderTextColor="#B0B3C6"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>
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
                            placeholder="Enter password"
                            placeholderTextColor="#B0B3C6"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={secureTextEntry}
                        />
                        <TouchableOpacity onPress={() => setSecureTextEntry(!secureTextEntry)} style={styles.eyeIcon}>
                            <Ionicons name={secureTextEntry ? "eye-off" : "eye"} size={22} color="#B0B3C6" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.inputWrapper}>
                        <Ionicons name="call-outline" size={20} color="#B0B3C6" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter phone number"
                            placeholderTextColor="#B0B3C6"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            keyboardType="phone-pad"
                        />
                    </View>
                    <View style={styles.inputWrapper}>
                        <Ionicons name="pricetag-outline" size={20} color="#B0B3C6" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter referral code (optional)"
                            placeholderTextColor="#B0B3C6"
                            value={referralCode}
                            onChangeText={setReferralCode}
                            autoCapitalize="characters"
                        />
                    </View>
                    <TouchableOpacity onPress={handleRegister} activeOpacity={0.85}>
                        <LinearGradient
                            colors={["#FF6CAB", "#7366FF"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.registerButton}
                        >
                            <Text style={styles.registerButtonText}>Get Started</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <View style={styles.signInContainer}>
                        <Text style={styles.accountText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.replace('/login')}>
                            <Text style={styles.signInText}>Log In</Text>
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
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 0,
        marginBottom: 0,
    },
    glassCard: {
        width: '100%',
        backgroundColor: '#fff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
        elevation: 8,
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
    registerButton: {
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 18,
        width: 180,
        alignSelf: 'center',
        shadowColor: '#FF6CAB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 4,
    },
    registerButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    signInContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 18,
    },
    accountText: {
        color: '#333',
        fontSize: 14,
        fontWeight: '500',
    },
    signInText: {
        color: '#6C63FF',
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
});

export default Register; 