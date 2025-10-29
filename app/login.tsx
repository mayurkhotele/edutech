import OTPVerification from '@/components/OTPVerification';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Keyboard,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

const Login = () => {
  const auth = useAuth();
  const { showError, showSuccess } = useToast();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // OTP login
  const [showOTP, setShowOTP] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loginMethod, setLoginMethod] = useState<'email' | 'otp'>('email');
  const [otpLoading, setOtpLoading] = useState(false);
  const recaptchaVerifier = useRef<any>(null);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoSlideAnim = useRef(new Animated.Value(-100)).current;

  // Animate on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(logoSlideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

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
      const result = await auth.loginWithOTP(`+91${phoneNumber}`);
      if (result.success) {
        setShowOTP(true);
        showSuccess('OTP sent successfully!');
      } else {
        showError(result.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      showError('Failed to send OTP. Make sure you are running on a real device or simulator.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOTPVerification = async (user: any) => {
    try {
      showSuccess('OTP verified successfully!');
      setTimeout(() => {
        router.replace('/(tabs)/home');
      }, 500);
    } catch (error: any) {
      showError('Navigation failed. Please try again.');
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#9C27B0" />
      <LinearGradient
        colors={['#9C27B0', '#673AB7', '#3F51B5']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Background Pattern */}
        <View style={styles.backgroundPattern}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <View style={styles.circle3} />
        </View>

        <TouchableOpacity 
          style={styles.touchableContainer}
          activeOpacity={1}
          onPress={() => {
            setPhoneFocused(false);
            setEmailFocused(false);
            setPasswordFocused(false);
            Keyboard.dismiss();
          }}
        >
            {/* Header Section with Logo */}
            <Animated.View 
              style={[
                styles.headerSection,
                {
                  transform: [
                    { translateY: keyboardHeight > 0 ? -keyboardHeight * 0.4 : 0 }
                  ]
                }
              ]}
            >
              <Animated.View 
                style={[
                  styles.logoContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: logoSlideAnim }]
                  }
                ]}
              >
                <LinearGradient
                  colors={['#FFFFFF', '#F8FAFC']}
                  style={styles.logoGradient}
                >
                  <Ionicons name="school" size={40} color="#9C27B0" />
                </LinearGradient>
              </Animated.View>

              <Animated.View 
                style={[
                  styles.titleContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              >
                <Text style={styles.appName}>
                  {loginMethod === 'email' ? 'Welcome Back' : 'Get Started'}
                </Text>
                <Text style={styles.appTagline}>
                  {loginMethod === 'email' 
                    ? 'Sign in to continue your exam preparation'
                    : 'Enter your phone number to get started'
                  }
                </Text>
              </Animated.View>

              {/* Exam Logos */}
              <Animated.View 
                style={[
                  styles.examLogosContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              >
                <View style={styles.examLogosGrid}>
                  <View style={[styles.examLogo, styles.upsc]}>
                    <Text style={styles.examLogoText}>UPSC</Text>
                  </View>
                  <View style={[styles.examLogo, styles.ssc]}>
                    <Text style={styles.examLogoText}>SSC</Text>
                  </View>
                  <View style={[styles.examLogo, styles.ibps]}>
                    <Text style={styles.examLogoText}>IBPS</Text>
                  </View>
                  <View style={[styles.examLogo, styles.railway]}>
                    <Text style={styles.examLogoText}>RRB</Text>
                  </View>
                  <View style={[styles.examLogo, styles.defense]}>
                    <Text style={styles.examLogoText}>NDA</Text>
                  </View>
                  <View style={[styles.examLogo, styles.banking]}>
                    <Text style={styles.examLogoText}>BANK</Text>
                  </View>
                </View>
              </Animated.View>
            </Animated.View>

            {/* Back Button */}
            <TouchableOpacity
              onPress={() => router.back()} 
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <View style={styles.backButtonGradient}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            {/* Main Content Card */}
            <Animated.View 
              style={[
                styles.mainCard,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideAnim },
                    { translateY: keyboardHeight > 0 ? -keyboardHeight * 0.6 : 0 }
                  ]
                }
              ]}
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Sign In</Text>
                <Text style={styles.cardSubtitle}>
                  {loginMethod === 'email' 
                    ? 'Enter your credentials to continue'
                    : 'We\'ll send you a verification code'
                  }
                </Text>
              </View>
              {/* Login Method Toggle */}
              <View style={styles.loginMethodToggle}>
                <TouchableOpacity 
                  style={[
                    styles.toggleButton, 
                    loginMethod === 'email' && styles.toggleButtonActive
                  ]}
                  onPress={() => {
                    setLoginMethod('email');
                    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                  }}
                >
                  <Ionicons 
                    name="mail" 
                    size={16} 
                    color={loginMethod === 'email' ? '#9C27B0' : '#9CA3AF'} 
                    style={styles.toggleIcon}
                  />
                  <Text style={[
                    styles.toggleButtonText,
                    loginMethod === 'email' && styles.toggleButtonTextActive
                  ]}>
                    Email
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.toggleButton, 
                    loginMethod === 'otp' && styles.toggleButtonActive
                  ]}
                  onPress={() => {
                    setLoginMethod('otp');
                    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                  }}
                >
                  <Ionicons 
                    name="phone-portrait" 
                    size={16} 
                    color={loginMethod === 'otp' ? '#9C27B0' : '#9CA3AF'} 
                    style={styles.toggleIcon}
                  />
                  <Text style={[
                    styles.toggleButtonText,
                    loginMethod === 'otp' && styles.toggleButtonTextActive
                  ]}>
                    Phone
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Email/Password Login Form */}
              {loginMethod === 'email' && (
                <>
                  {/* Email Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Email Address</Text>
                    <View style={[
                      styles.inputWrapper,
                      emailFocused && styles.inputWrapperFocused
                    ]}>
                      <Ionicons 
                        name="mail-outline" 
                        size={20} 
                        color={emailFocused ? '#9C27B0' : '#9CA3AF'} 
                        style={styles.inputIcon} 
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your email"
                        placeholderTextColor="#9CA3AF"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                      />
                    </View>
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <View style={[
                      styles.inputWrapper,
                      passwordFocused && styles.inputWrapperFocused
                    ]}>
                      <Ionicons 
                        name="lock-closed-outline" 
                        size={20} 
                        color={passwordFocused ? '#9C27B0' : '#9CA3AF'} 
                        style={styles.inputIcon} 
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor="#9CA3AF"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={secureTextEntry}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                      />
                      <TouchableOpacity
                        onPress={() => setSecureTextEntry(!secureTextEntry)}
                        style={styles.eyeIcon}
                      >
                        <Ionicons 
                          name={secureTextEntry ? "eye-outline" : "eye-off-outline"} 
                          size={20} 
                          color={passwordFocused ? '#9C27B0' : '#9CA3AF'} 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Login Button */}
                  <TouchableOpacity 
                    onPress={handleLogin} 
                    activeOpacity={0.9} 
                    disabled={isSubmitting || !email || !password}
                    style={styles.loginButtonContainer}
                  >
                    <LinearGradient
                      colors={
                        email && password && !isSubmitting
                          ? ['#9C27B0', '#673AB7']
                          : ['#E5E7EB', '#D1D5DB']
                      }
                      style={styles.loginButton}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {isSubmitting ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="small" color="#fff" />
                          <Text style={styles.loadingText}>Signing in...</Text>
                        </View>
                      ) : (
                        <>
                          <Text style={styles.loginButtonText}>Sign In</Text>
                          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}

              {/* Phone/OTP Login Form */}
              {loginMethod === 'otp' && (
                <>
                  {/* Phone Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <View style={[
                      styles.inputWrapper,
                      phoneFocused && styles.inputWrapperFocused
                    ]}>
                      <View style={styles.countryCode}>
                        <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                      </View>
                      <TextInput
                        style={[styles.input, { paddingLeft: 8 }]}
                        placeholder="9876543210"
                        placeholderTextColor="#9CA3AF"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                        maxLength={10}
                        onFocus={() => setPhoneFocused(true)}
                        onBlur={() => setPhoneFocused(false)}
                      />
                    </View>
                  </View>

                  {/* Continue Button */}
                  <TouchableOpacity 
                    onPress={handleSendOTP} 
                    activeOpacity={0.9} 
                    disabled={otpLoading || phoneNumber.length < 10}
                    style={styles.loginButtonContainer}
                  >
                    <LinearGradient
                      colors={
                        phoneNumber.length >= 10 && !otpLoading
                          ? ['#9C27B0', '#673AB7']
                          : ['#E5E7EB', '#D1D5DB']
                      }
                      style={styles.continueButton}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {otpLoading ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="small" color="#fff" />
                          <Text style={styles.continueButtonText}>Sending...</Text>
                        </View>
                      ) : (
                        <>
                          <Text style={styles.continueButtonText}>Send OTP</Text>
                          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </Animated.View>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  circle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle2: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  circle3: {
    position: 'absolute',
    top: height * 0.3,
    right: -80,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  touchableContainer: {
    flex: 1,
  },
  
  // Header Section
  headerSection: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  examLogosContainer: {
    width: '100%',
    alignItems: 'center',
  },
  examLogosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  examLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  examLogoText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  upsc: {
    backgroundColor: '#FF6B35',
  },
  ssc: {
    backgroundColor: '#00D4AA',
  },
  ibps: {
    backgroundColor: '#FF3B82',
  },
  railway: {
    backgroundColor: '#FFD700',
  },
  defense: {
    backgroundColor: '#8B5CF6',
  },
  banking: {
    backgroundColor: '#00C9FF',
  },

  // Back Button
  backButton: { 
    position: 'absolute', 
    top: Platform.OS === 'ios' ? 60 : 40, 
    left: 20, 
    zIndex: 10,
  },
  backButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9C27B0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(156, 39, 176, 0.2)',
  },
  appName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appTagline: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 0,
    fontWeight: '500',
    letterSpacing: 0.2,
    textAlign: 'center',
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  welcomeSubtitle: { 
    fontSize: 16, 
    color: '#999', 
    letterSpacing: 0.2,
  },

  // Main Card
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
    marginTop: 'auto',
    minHeight: height * 0.45,
    maxHeight: height * 0.6,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },

  // Login Method Toggle
  loginMethodToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  toggleIcon: {
    marginRight: 6,
  },
  toggleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  toggleButtonTextActive: {
    color: '#667eea',
    fontWeight: '700',
  },

  // Input Styles
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    height: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  inputWrapperFocused: {
    borderColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    backgroundColor: '#FAFBFF',
  },
  input: { 
    flex: 1, 
    color: '#1E293B', 
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  inputIcon: {
    marginRight: 14,
  },
  eyeIcon: {
    padding: 6,
    borderRadius: 6,
  },
  countryCode: {
    paddingRight: 14,
    marginRight: 14,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.2,
  },

  // Login/Continue Button
  loginButtonContainer: {
    marginTop: 12,
    marginBottom: 16,
  },
  loginButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    flexDirection: 'row',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    flexDirection: 'row',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonActive: {
    backgroundColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonInactive: {
    backgroundColor: '#D1D5DB',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginRight: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginRight: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },


});

export default Login;
