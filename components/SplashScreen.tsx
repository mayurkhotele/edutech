import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    const startAnimations = () => {
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

      // Text fade in
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 800,
        delay: 1200,
        useNativeDriver: true,
      }).start();

      // Button animation
      Animated.sequence([
        Animated.delay(1800),
        Animated.spring(buttonScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    };

    startAnimations();

    // Auto navigate after 4 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      {/* Background with Abstract Shapes */}
      <View style={styles.backgroundContainer}>
        {/* Purple Blob Shapes - Exact DT QUIZ positioning */}
        <View style={[styles.purpleBlob, styles.blob1]} />
        <View style={[styles.purpleBlob, styles.blob2]} />
        <View style={[styles.purpleBlob, styles.blob3]} />
        
        {/* Yellow Accent Circles - Exact DT QUIZ positioning */}
        <View style={[styles.yellowCircle, styles.circle1]} />
        <View style={[styles.yellowCircle, styles.circle2]} />
        <View style={[styles.yellowCircle, styles.circle3]} />
        <View style={[styles.yellowCircle, styles.circle4]} />
        <View style={[styles.yellowCircle, styles.circle5]} />
        
        {/* Line Art Icons - Exact DT QUIZ positioning */}
        <View style={[styles.lineIcon, styles.lightbulb]}>
          <Ionicons name="bulb-outline" size={24} color="#e0e0e0" />
          <View style={styles.yellowDots}>
            <View style={styles.yellowDot} />
            <View style={styles.yellowDot} />
            <View style={styles.yellowDot} />
          </View>
        </View>
        
        <View style={[styles.lineIcon, styles.globe1]}>
          <Ionicons name="globe-outline" size={20} color="#e0e0e0" />
        </View>
        
        <View style={[styles.lineIcon, styles.playButton]}>
          <Ionicons name="play" size={16} color="#e0e0e0" />
        </View>
        
        <View style={[styles.lineIcon, styles.eyeglasses]}>
          <Ionicons name="glasses-outline" size={18} color="#e0e0e0" />
        </View>
        
        <View style={[styles.lineIcon, styles.smiley]}>
          <Ionicons name="happy-outline" size={16} color="#e0e0e0" />
        </View>
        
        <View style={[styles.lineIcon, styles.star]}>
          <Ionicons name="star-outline" size={14} color="#e0e0e0" />
        </View>
        
        <View style={[styles.lineIcon, styles.question1]}>
          <Ionicons name="help-circle-outline" size={16} color="#e0e0e0" />
        </View>
        
        <View style={[styles.lineIcon, styles.question2]}>
          <Ionicons name="help-circle-outline" size={12} color="#e0e0e0" />
        </View>
        
        <View style={[styles.lineIcon, styles.exclamation]}>
          <Ionicons name="alert-circle-outline" size={14} color="#e0e0e0" />
        </View>
        
        <View style={[styles.lineIcon, styles.music]}>
          <Ionicons name="musical-notes-outline" size={16} color="#e0e0e0" />
        </View>
        
        <View style={[styles.lineIcon, styles.plus]}>
          <Ionicons name="add" size={12} color="#e0e0e0" />
        </View>
        
        {/* Small Abstract Elements - Exact DT QUIZ positioning */}
        <View style={[styles.smallDot, styles.dot1]} />
        <View style={[styles.smallDot, styles.dot2]} />
        <View style={[styles.smallDot, styles.dot3]} />
        <View style={[styles.smallDot, styles.dot4]} />
        <View style={[styles.smallDot, styles.dot5]} />
      </View>

      {/* Main Content */}
      <View style={styles.contentContainer}>
        {/* Central Yottascore Text - Exact DT QUIZ style */}
        <Animated.View 
          style={[
            styles.titleContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Text style={styles.titleText}>YOTTA</Text>
          <Text style={styles.titleText}>SCORE</Text>
        </Animated.View>
        
        {/* Subtitle */}
        <Animated.View style={[styles.subtitleContainer, { opacity: textOpacity }]}>
          <Text style={styles.subtitleText}>Smart Learning Platform</Text>
        </Animated.View>
      </View>

      {/* Action Buttons */}
      <Animated.View 
        style={[
          styles.buttonContainer,
          {
            opacity: textOpacity,
            transform: [{ scale: buttonScale }],
          },
        ]}
      >
        <TouchableOpacity onPress={onFinish} activeOpacity={0.85}>
          <LinearGradient
            colors={["#667eea", "#764ba2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Exact DT QUIZ white background
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  purpleBlob: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.15, // Increased opacity to match DT QUIZ
  },
  blob1: {
    width: width * 0.7, // Larger size to match DT QUIZ
    height: width * 0.7,
    backgroundColor: '#6C63FF', // Exact DT QUIZ purple
    top: -height * 0.15, // Adjusted positioning
    left: -width * 0.25,
  },
  blob2: {
    width: width * 0.5, // Larger size to match DT QUIZ
    height: width * 0.5,
    backgroundColor: '#FF6CAB', // Exact DT QUIZ pink
    bottom: height * 0.25, // Adjusted positioning
    right: -width * 0.15,
  },
  blob3: {
    width: width * 0.6, // Larger size to match DT QUIZ
    height: width * 0.6,
    backgroundColor: '#FFD452', // Exact DT QUIZ yellow
    bottom: height * 0.05, // Adjusted positioning
    left: width * 0.25,
  },
  yellowCircle: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.12, // Increased opacity to match DT QUIZ
  },
  circle1: {
    width: width * 0.35, // Larger size to match DT QUIZ
    height: width * 0.35,
    backgroundColor: '#FFD452', // Exact DT QUIZ yellow
    top: height * 0.15, // Adjusted positioning
    left: width * 0.05,
  },
  circle2: {
    width: width * 0.25, // Larger size to match DT QUIZ
    height: width * 0.25,
    backgroundColor: '#FF6CAB', // Exact DT QUIZ pink
    bottom: height * 0.35, // Adjusted positioning
    right: width * 0.15,
  },
  circle3: {
    width: width * 0.45, // Larger size to match DT QUIZ
    height: width * 0.45,
    backgroundColor: '#6C63FF', // Exact DT QUIZ purple
    bottom: height * 0.55, // Adjusted positioning
    left: width * 0.35,
  },
  circle4: {
    width: width * 0.35, // Larger size to match DT QUIZ
    height: width * 0.35,
    backgroundColor: '#FFD452', // Exact DT QUIZ yellow
    top: height * 0.65, // Adjusted positioning
    right: width * 0.25,
  },
  circle5: {
    width: width * 0.25, // Larger size to match DT QUIZ
    height: width * 0.25,
    backgroundColor: '#FF6CAB', // Exact DT QUIZ pink
    bottom: height * 0.75, // Adjusted positioning
    left: width * 0.45,
  },
  lineIcon: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.15, // Increased opacity to match DT QUIZ
  },
  lightbulb: {
    top: height * 0.08, // Adjusted positioning
    left: width * 0.35,
  },
  yellowDots: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  yellowDot: {
    width: 8, // Larger size to match DT QUIZ
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD452', // Exact DT QUIZ yellow
    marginRight: 3, // Increased spacing
  },
  globe1: {
    top: height * 0.25, // Adjusted positioning
    left: width * 0.55,
  },
  playButton: {
    top: height * 0.45, // Adjusted positioning
    left: width * 0.15,
  },
  eyeglasses: {
    top: height * 0.65, // Adjusted positioning
    left: width * 0.25,
  },
  smiley: {
    top: height * 0.85, // Adjusted positioning
    left: width * 0.35,
  },
  star: {
    top: height * 0.08, // Adjusted positioning
    right: width * 0.35,
  },
  question1: {
    top: height * 0.25, // Adjusted positioning
    right: width * 0.55,
  },
  question2: {
    bottom: height * 0.08, // Adjusted positioning
    left: width * 0.55,
  },
  exclamation: {
    bottom: height * 0.25, // Adjusted positioning
    right: width * 0.55,
  },
  music: {
    bottom: height * 0.45, // Adjusted positioning
    left: width * 0.55,
  },
  plus: {
    bottom: height * 0.65, // Adjusted positioning
    right: width * 0.55,
  },
  smallDot: {
    position: 'absolute',
    width: 10, // Larger size to match DT QUIZ
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e0e0e0', // Exact DT QUIZ light grey
  },
  dot1: {
    top: height * 0.18, // Adjusted positioning
    left: width * 0.08,
  },
  dot2: {
    top: height * 0.38, // Adjusted positioning
    right: width * 0.08,
  },
  dot3: {
    bottom: height * 0.18, // Adjusted positioning
    left: width * 0.18,
  },
  dot4: {
    bottom: height * 0.38, // Adjusted positioning
    right: width * 0.18,
  },
  dot5: {
    top: height * 0.58, // Adjusted positioning
    left: width * 0.28,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 100,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  titleText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff', // Exact DT QUIZ white text
    textAlign: 'center',
    textShadowColor: '#667eea', // Exact DT QUIZ purple shadow
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    // Exact DT QUIZ stitched effect
    borderWidth: 3,
    borderColor: '#667eea', // Exact DT QUIZ purple border
    borderStyle: 'dashed',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginVertical: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  subtitleContainer: {
    alignItems: 'center',
  },
  subtitleText: {
    fontSize: 18,
    color: '#667eea', // Exact DT QUIZ purple
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
    fontWeight: '600',
    textShadowColor: 'rgba(102, 126, 234, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  buttonContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 50,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default SplashScreen; 