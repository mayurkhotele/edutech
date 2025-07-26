import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const leaf1Anim = useRef(new Animated.Value(0)).current;
  const leaf2Anim = useRef(new Animated.Value(0)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const circleAnim1 = useRef(new Animated.Value(0)).current;
  const circleAnim2 = useRef(new Animated.Value(0)).current;
  const circleAnim3 = useRef(new Animated.Value(0)).current;
  const starAnim1 = useRef(new Animated.Value(0)).current;
  const starAnim2 = useRef(new Animated.Value(0)).current;
  const triangleAnim = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const particleAnim1 = useRef(new Animated.Value(0)).current;
  const particleAnim2 = useRef(new Animated.Value(0)).current;
  const particleAnim3 = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    const startAnimations = () => {
      // Glow effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Particle animations
      Animated.loop(
        Animated.sequence([
          Animated.timing(particleAnim1, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(particleAnim1, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(1000),
          Animated.timing(particleAnim2, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(particleAnim2, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(2000),
          Animated.timing(particleAnim3, {
            toValue: 1,
            duration: 5000,
            useNativeDriver: true,
          }),
          Animated.timing(particleAnim3, {
            toValue: 0,
            duration: 5000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Concentric circles animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(circleAnim1, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(circleAnim1, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(1000),
          Animated.timing(circleAnim2, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(circleAnim2, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(2000),
          Animated.timing(circleAnim3, {
            toValue: 1,
            duration: 5000,
            useNativeDriver: true,
          }),
          Animated.timing(circleAnim3, {
            toValue: 0,
            duration: 5000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Geometric shapes animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(starAnim1, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(starAnim1, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(500),
          Animated.timing(starAnim2, {
            toValue: 1,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(starAnim2, {
            toValue: 0,
            duration: 2500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(1000),
          Animated.timing(triangleAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(triangleAnim, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Logo container animation
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();

      // Logo parts animation sequence
      Animated.sequence([
        Animated.delay(500),
        // First leaf
        Animated.timing(leaf1Anim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        // Second leaf
        Animated.timing(leaf2Anim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        // Red dot
        Animated.timing(dotAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Text fade in
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 800,
        delay: 1800,
        useNativeDriver: true,
      }).start();

      // Button animation
      Animated.sequence([
        Animated.delay(2200),
        Animated.spring(buttonScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startAnimations();

    // Auto navigate after 5 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#FF6B9D', '#C44569', '#8B5CF6', '#6B46C1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Enhanced background pattern */}
      <View style={styles.backgroundPattern}>
        <View style={styles.patternDot1} />
        <View style={styles.patternDot2} />
        <View style={styles.patternDot3} />
        <View style={styles.patternDot4} />
      </View>

      {/* Floating particles */}
      <Animated.View 
        style={[
          styles.particle,
          styles.particle1,
          {
            opacity: particleAnim1,
            transform: [{ translateY: particleAnim1.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -100],
            })}],
          },
        ]}
      />
      <Animated.View 
        style={[
          styles.particle,
          styles.particle2,
          {
            opacity: particleAnim2,
            transform: [{ translateY: particleAnim2.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 80],
            })}],
          },
        ]}
      />
      <Animated.View 
        style={[
          styles.particle,
          styles.particle3,
          {
            opacity: particleAnim3,
            transform: [{ translateY: particleAnim3.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -60],
            })}],
          },
        ]}
      />

      {/* Concentric circles */}
      <View style={styles.circlesContainer}>
        <Animated.View 
          style={[
            styles.concentricCircle,
            styles.circle1,
            {
              opacity: circleAnim1,
              transform: [{ scale: circleAnim1 }],
            },
          ]}
        />
        <Animated.View 
          style={[
            styles.concentricCircle,
            styles.circle2,
            {
              opacity: circleAnim2,
              transform: [{ scale: circleAnim2 }],
            },
          ]}
        />
        <Animated.View 
          style={[
            styles.concentricCircle,
            styles.circle3,
            {
              opacity: circleAnim3,
              transform: [{ scale: circleAnim3 }],
            },
          ]}
        />
      </View>

      {/* Animated geometric shapes */}
      <Animated.View 
        style={[
          styles.geometricShape,
          styles.star1,
          {
            opacity: starAnim1,
            transform: [{ scale: starAnim1 }],
          },
        ]}
      >
        <Ionicons name="star" size={24} color="#FFD700" />
      </Animated.View>

      <Animated.View 
        style={[
          styles.geometricShape,
          styles.star2,
          {
            opacity: starAnim2,
            transform: [{ scale: starAnim2 }],
          },
        ]}
      >
        <Ionicons name="star" size={18} color="#FFD700" />
      </Animated.View>

      <Animated.View 
        style={[
          styles.geometricShape,
          styles.triangle,
          {
            opacity: triangleAnim,
            transform: [{ scale: triangleAnim }],
          },
        ]}
      >
        <Ionicons name="triangle" size={20} color="#4FC3F7" />
      </Animated.View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Logo section with glow effect */}
        <Animated.View
          style={[
            styles.logoSection,
            {
              opacity: logoOpacity,
              transform: [
                { scale: logoScale },
                { scale: pulseAnim },
              ],
            },
          ]}
        >
          {/* Glow background */}
          <Animated.View 
            style={[
              styles.glowBackground,
              {
                opacity: glowOpacity,
                transform: [{ scale: glowOpacity }],
              },
            ]}
          />

          {/* Logo container */}
          <View style={styles.logoContainer}>
            {/* Animated Logo */}
            <View style={styles.logoWrapper}>
              <Svg width="120" height="120" viewBox="0 0 120 120">
                {/* First leaf */}
                <Animated.View style={{ opacity: leaf1Anim }}>
                  <Path
                    d="M30 80 Q40 60 50 80 Q60 100 70 80 Q80 60 90 80 L85 100 Q75 110 65 100 Q55 110 45 100 Z"
                    fill="#4CAF50"
                    stroke="#2E7D32"
                    strokeWidth="2"
                  />
                </Animated.View>
                
                {/* Second leaf */}
                <Animated.View style={{ opacity: leaf2Anim }}>
                  <Path
                    d="M70 80 Q80 60 90 80 Q100 100 110 80 Q120 60 130 80 L125 100 Q115 110 105 100 Q95 110 85 100 Z"
                    fill="#66BB6A"
                    stroke="#388E3C"
                    strokeWidth="2"
                  />
                </Animated.View>
                
                {/* Red dot */}
                <Animated.View style={{ opacity: dotAnim }}>
                  <Circle
                    cx="60"
                    cy="45"
                    r="8"
                    fill="#F44336"
                    stroke="#D32F2F"
                    strokeWidth="2"
                  />
                </Animated.View>
              </Svg>
            </View>
            
            {/* Yottascore text */}
            <Text style={styles.logoText}>Yottascore</Text>
          </View>
        </Animated.View>

        {/* Tagline section */}
        <Animated.View style={[styles.taglineSection, { opacity: textOpacity }]}>
          <Text style={styles.tagline}>🚀 Smart Learning Platform</Text>
          <Text style={styles.subTagline}>✨ Study • Practice • Excel ✨</Text>
        </Animated.View>

        {/* Enhanced Get Started button */}
        <Animated.View style={[styles.buttonSection, { opacity: textOpacity }]}>
          <Animated.View 
            style={[
              styles.getStartedButton,
              {
                transform: [{ scale: buttonScale }],
              },
            ]}
          >
            <LinearGradient
              colors={['#FF6B9D', '#FF8E53']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
            </LinearGradient>
          </Animated.View>
          <Text style={styles.legalText}>
            By continuing you agree to our Terms & Privacy Policy
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  patternDot1: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: '20%',
    left: '15%',
  },
  patternDot2: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: '35%',
    right: '20%',
  },
  patternDot3: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    bottom: '25%',
    left: '25%',
  },
  patternDot4: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    bottom: '40%',
    right: '10%',
  },
  particle: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFD700',
  },
  particle1: {
    top: '30%',
    left: '20%',
  },
  particle2: {
    top: '50%',
    right: '25%',
  },
  particle3: {
    bottom: '35%',
    left: '30%',
  },
  circlesContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  concentricCircle: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  circle1: {
    width: 200,
    height: 200,
  },
  circle2: {
    width: 300,
    height: 300,
  },
  circle3: {
    width: 400,
    height: 400,
  },
  geometricShape: {
    position: 'absolute',
  },
  star1: {
    top: '15%',
    left: '10%',
  },
  star2: {
    top: '25%',
    right: '15%',
  },
  triangle: {
    bottom: '30%',
    left: '20%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  glowBackground: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  logoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    padding: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    textAlign: 'center',
  },
  taglineSection: {
    alignItems: 'center',
    marginBottom: 50,
  },
  tagline: {
    fontSize: 26,
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subTagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '400',
  },
  buttonSection: {
    alignItems: 'center',
    width: '100%',
  },
  getStartedButton: {
    borderRadius: 28,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  legalText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default SplashScreen; 