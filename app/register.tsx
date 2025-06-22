import { AppColors } from '@/constants/Colors'
import { useAuth } from '@/context/AuthContext'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

const Register = () => {
    const { register } = useAuth();
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [secureTextEntry, setSecureTextEntry] = useState(true);

    const handleRegister = async () => {
        if (!name || !email || !password || !phoneNumber) {
            Alert.alert('Error', 'Please fill all the fields.');
            return;
        }
        try {
            await register({ name, email, password, phoneNumber });
            Alert.alert('Success', 'Registration successful! Please log in.', [
                { text: 'OK', onPress: () => router.replace('/login') },
            ]);
        } catch (error: any) {
            console.error('Registration failed:', error);
            Alert.alert('Registration Failed', error.response?.data?.message || 'An error occurred.');
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
                <Text style={styles.title}>Create Your Account</Text>
                <Text style={styles.subtitle}>We're here to help you reach the peaks of learning. Are you ready?</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Enter full name"
                    placeholderTextColor={AppColors.lightGrey}
                    value={name}
                    onChangeText={setName}
                />
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
                        placeholder="Enter password"
                        placeholderTextColor={AppColors.lightGrey}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={secureTextEntry}
                    />
                    <TouchableOpacity onPress={() => setSecureTextEntry(!secureTextEntry)} style={styles.eyeIcon}>
                        <Ionicons name={secureTextEntry ? "eye-off" : "eye"} size={24} color={AppColors.grey} />
                    </TouchableOpacity>
                </View>

                <TextInput
                    style={styles.input}
                    placeholder="Enter phone number"
                    placeholderTextColor={AppColors.lightGrey}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                />

                <TouchableOpacity onPress={handleRegister}>
                    <LinearGradient
                        colors={[AppColors.pink, AppColors.purple]}
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
    registerButton: {
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        marginTop: 20,
    },
    registerButtonText: {
        color: AppColors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    signInContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
    },
    accountText: {
        color: AppColors.lightGrey,
    },
    signInText: {
        color: AppColors.white,
        fontWeight: 'bold',
    }
});

export default Register; 