import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import QuestionOfTheDay from './QuestionOfTheDay';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const QuestionOfTheDayPreview = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  // Animated values for background elements
  const animatedValue1 = useRef(new Animated.Value(0)).current;
  const animatedValue2 = useRef(new Animated.Value(0)).current;
  const animatedValue3 = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const progressRing = useRef(new Animated.Value(0)).current;
  const dailyIndicator = useRef(new Animated.Value(0)).current;

  const openModal = () => {
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  // Start background animations
  useEffect(() => {
    const startAnimations = () => {
      // Floating animation for pattern circles
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue1, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue1, {
            toValue: 0,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue2, {
            toValue: 1,
            duration: 4000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue2, {
            toValue: 0,
            duration: 4000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue3, {
            toValue: 1,
            duration: 5000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue3, {
            toValue: 0,
            duration: 5000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Pulse animation for main icon
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Progress ring animation (daily progress)
      Animated.loop(
        Animated.sequence([
          Animated.timing(progressRing, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(progressRing, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Daily indicator blinking
      Animated.loop(
        Animated.sequence([
          Animated.timing(dailyIndicator, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(dailyIndicator, {
            toValue: 0.3,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startAnimations();
  }, []);

  return (
    <>
      {/* Compact Enhanced Preview Section */}
      <View style={styles.previewContainer}>
        <LinearGradient
          colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.previewGradient}
        >
          {/* Animated Background Pattern */}
          <View style={styles.backgroundPattern}>
            <Animated.View 
              style={[
                styles.patternCircle1,
                {
                  transform: [{
                    translateY: animatedValue1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -15],
                    })
                  }]
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.patternCircle2,
                {
                  transform: [{
                    translateY: animatedValue2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -20],
                    })
                  }]
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.patternCircle3,
                {
                  transform: [{
                    translateY: animatedValue3.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -25],
                    })
                  }]
                }
              ]} 
            />
            <View style={styles.patternDots} />
          </View>

          <View style={styles.previewContent}>
            <View style={styles.previewLeft}>
              <View style={styles.iconWrapper}>
                {/* Progress Ring */}
                <Animated.View 
                  style={[
                    styles.progressRing,
                    {
                      transform: [{
                        rotate: progressRing.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        })
                      }],
                      opacity: progressRing.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.3, 1, 0.3],
                      })
                    }
                  ]}
                />
                <Animated.View 
                  style={[
                    styles.iconContainer,
                    {
                      transform: [{ scale: pulseValue }]
                    }
                  ]}
                >
                  <LinearGradient
                    colors={['#FFD700', '#FF6B6B']}
                    style={styles.iconGradient}
                  >
                    <Ionicons name="bulb" size={22} color="#FFFFFF" />
                  </LinearGradient>
                  {/* Daily indicator dot */}
                  <Animated.View 
                    style={[
                      styles.dailyDot,
                      {
                        opacity: dailyIndicator,
                      }
                    ]}
                  />
                </Animated.View>
              </View>
              <View style={styles.previewTextContainer}>
                <View style={styles.titleRow}>
                  <Text style={styles.previewTitle}>Question of the Day</Text>
                  <Animated.View style={[styles.dailyBadge, {
                    transform: [{
                      scale: pulseValue.interpolate({
                        inputRange: [1, 1.1],
                        outputRange: [1, 1.05],
                      })
                    }]
                  }]}>
                    <Text style={styles.dailyBadgeText}>TODAY</Text>
                  </Animated.View>
                </View>
                <Text style={styles.previewSubtitle}>Test your knowledge daily!</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.viewButton} onPress={openModal}>
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                style={styles.viewButtonGradient}
              >
                <Text style={styles.viewButtonText}>View</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Enhanced Modal */}
      <Modal
        visible={isModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.centeredOverlay}>
          <View style={styles.centeredCard}>
            <LinearGradient
              colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              {/* Enhanced Header with Close Button */}
              <View style={styles.modalHeader}>
                <View style={styles.headerContent}>
                  <View style={styles.headerIcon}>
                    <Ionicons name="bulb" size={28} color="#FFFFFF" />
                  </View>
                  <View style={styles.headerText}>
                    <Text style={styles.modalTitle}>Question of the Day</Text>
                    <Text style={styles.modalSubtitle}>Test your knowledge!</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Content Container */}
              <View style={styles.contentContainer}>
                <QuestionOfTheDay />
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  previewContainer: {
    margin: 12,
    borderRadius: 18,
    shadowColor: '#4F46E5',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  previewGradient: {
    borderRadius: 18,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.12,
  },
  patternCircle1: {
    position: 'absolute',
    top: 15,
    right: 25,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  patternCircle2: {
    position: 'absolute',
    top: 45,
    left: 15,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  patternCircle3: {
    position: 'absolute',
    bottom: 20,
    right: 45,
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  patternDots: {
    position: 'absolute',
    top: 30,
    right: 65,
    width: 15,
    height: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 7.5,
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  previewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  progressRing: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderTopColor: '#FFFFFF',
    top: -6,
    left: -6,
  },
  iconContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    position: 'relative',
  },
  iconGradient: {
    padding: 10,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dailyDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  previewTextContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  dailyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  dailyBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dateText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
    fontWeight: '500',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.3,
  },
  previewSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  viewButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  viewButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    letterSpacing: 0.3,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.25)',
    backdropFilter: 'blur(10px)',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.3,
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    flexGrow: 1,
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 0,
    minHeight: 450,
    maxHeight: 650,
  },
  centeredOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  centeredCard: {
    width: '90%',
    minHeight: 550,
    maxHeight: 750,
    paddingVertical: 12,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 15,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 0,
    paddingVertical: 0,
    minHeight: 550,
    maxHeight: 750,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerText: {
    marginLeft: 18,
  },
  modalSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
});

export default QuestionOfTheDayPreview; 