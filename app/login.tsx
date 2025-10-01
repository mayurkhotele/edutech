import OTPVerification from '@/components/OTPVerification';
import { firebaseConfig } from '@/config/firebase';
import { AppColors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Ionicons } from '@expo/vector-icons';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { signInWithPhoneNumber } from 'firebase/auth';
import { useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const Login = () => {
  const auth = useAuth();
  const { showError, showSuccess } = useToast();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP login
  const [showOTP, setShowOTP] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loginMethod, setLoginMethod] = useState<'email' | 'otp'>('email');
  const [otpLoading, setOtpLoading] = useState(false);
  const recaptchaVerifier = useRef<any>(null);

  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  // Email/password login
  const handleLogin = async () => {
    if (isSubmitting) return;
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    
    if (!email || !password) {
      showError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await auth.login(email, password);
      showSuccess('Login successful! Welcome back.');
    } catch (error: any) {
      showError(error?.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // OTP send
  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      showError('Please enter a valid 10-digit phone number');
      return;
    }

    setOtpLoading(true);
    try {
      const result = await signInWithPhoneNumber(auth, `+91${phoneNumber}`, recaptchaVerifier.current);
      setConfirmationResult(result);
      setShowOTP(true);
      showSuccess('OTP sent successfully!');
    } catch (error: any) {
      showError('Failed to send OTP. Make sure you are running on a real device or simulator.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOTPVerification = async (otp: string) => {
    if (!confirmationResult) return;
    try {
      const result = await confirmationResult.confirm(otp);
      showSuccess('OTP verified successfully!');
      router.replace('/(tabs)/home');
    } catch (error) {
      showError('OTP verification failed. Please try again.');
    }
  };

  const handleResendOTP = async () => handleSendOTP();
  const handleBackFromOTP = () => {
    setShowOTP(false);
    setPhoneNumber('');
    setConfirmationResult(null);
  };

  if (showOTP) {
    return (
      <OTPVerification
        phoneNumber={phoneNumber}
        onVerificationSuccess={handleOTPVerification}
        onBack={handleBackFromOTP}
        onResendOTP={handleResendOTP}
      />
    );
  }

  return (
    <LinearGradient
      colors={["#4c1d95", "#7c3aed", "#a855f7"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
      />

      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={AppColors.white} />
      </TouchableOpacity>

      <View style={styles.centeredContent}>
        <View style={styles.glassCard}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Continue your learning journey.</Text>

          <View style={styles.methodToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, loginMethod === 'email' && styles.toggleButtonActive]}
              onPress={() => setLoginMethod('email')}
            >
              <Text style={[styles.toggleText, loginMethod === 'email' && styles.toggleTextActive]}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, loginMethod === 'otp' && styles.toggleButtonActive]}
              onPress={() => setLoginMethod('otp')}
            >
              <Text style={[styles.toggleText, loginMethod === 'otp' && styles.toggleTextActive]}>Phone</Text>
            </TouchableOpacity>
          </View>

          {loginMethod === 'email' ? (
            <>
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
              <TouchableOpacity onPress={handleLogin} activeOpacity={0.9} disabled={isSubmitting}>
                <LinearGradient
                  colors={["#f59e0b", "#f97316"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.loginButton, isSubmitting && { opacity: 0.7 }]}
                >
                  {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Log In</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color="#B0B3C6" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter phone number"
                  placeholderTextColor="#B0B3C6"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              <TouchableOpacity onPress={handleSendOTP} activeOpacity={0.9} disabled={otpLoading}>
                <LinearGradient
                  colors={["#4F46E5", "#7C3AED"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.loginButton, otpLoading && { opacity: 0.7 }]}
                >
                  {otpLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Send OTP</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, left: 20, zIndex: 1 },
  centeredContent: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 0, marginBottom: 0 },
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
  title: { fontSize: 32, fontWeight: 'bold', color: '#333', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#555', marginBottom: 32, textAlign: 'center' },
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
  },
  inputIcon: { marginRight: 6 },
  input: { flex: 1, color: '#222', fontSize: 16, paddingVertical: 14, backgroundColor: 'transparent' },
  eyeIcon: { padding: 4 },
  loginButton: { borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16, width: 200, alignSelf: 'center' },
  loginButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  methodToggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12, padding: 4, marginBottom: 20, width: '100%', borderWidth: 1, borderColor: '#e5e7eb' },
  toggleButton: { flex: 1, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center' },
  toggleButtonActive: { backgroundColor: '#4F46E5', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  toggleText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  toggleTextActive: { color: '#FFFFFF', fontWeight: '700' },
});

export default Login;
