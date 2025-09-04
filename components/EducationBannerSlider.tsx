import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  gradient: readonly [string, string];
  ctaText: string;
}

interface EducationBannerSliderProps {
  onBannerPress?: (banner: Banner) => void;
}

const EducationBannerSlider: React.FC<EducationBannerSliderProps> = ({ onBannerPress }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<Banner>>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const sparkleAnim1 = useRef(new Animated.Value(0)).current;
  const sparkleAnim2 = useRef(new Animated.Value(0)).current;
  const sparkleAnim3 = useRef(new Animated.Value(0)).current;
  const floatingAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Enhanced Banner data with more attractive content
  const banners: Banner[] = [
    {
      id: '1',
      title: '✨ Master Your Skills',
      subtitle: 'Excellence in Education',
      description: 'Join 50,000+ students achieving academic success with AI-powered learning paths & expert guidance.',
      icon: 'school',
      gradient: ['#667eea', '#764ba2'] as const,
      ctaText: 'Start Journey'
    },
    {
      id: '2', 
      title: '🚀 Practice Perfectly',
      subtitle: 'Smart Test Engine',
      description: 'AI-powered practice tests with real-time analytics.',
      icon: 'library',
      gradient: ['#f093fb', '#f5576c'] as const,
      ctaText: 'Take Test'
    },
    {
      id: '3',
      title: '🎯 Achieve Excellence',
      subtitle: 'Career Success Guaranteed',
      description: 'Personalized learning with industry experts. 95% job placement rate in top companies.',
      icon: 'trophy',
      gradient: ['#4facfe', '#00f2fe'] as const,
      ctaText: 'Join Elite'
    }
  ];

  // Initialize background animations
  useEffect(() => {
    // Sparkle animations with staggered timing
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim1, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim1, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(sparkleAnim2, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim2, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(sparkleAnim3, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim3, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Enhanced auto-scroll functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % banners.length;
        
        // Enhanced transition animations
        Animated.parallel([
          Animated.sequence([
            Animated.timing(fadeAnim, {
              toValue: 0.6,
              duration: 300,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 400,
              easing: Easing.out(Easing.back(1.2)),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 0.95,
              duration: 300,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 400,
              easing: Easing.out(Easing.back(1.2)),
              useNativeDriver: true,
            }),
          ]),
        ]).start();

        // Scroll to next item
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        
        return nextIndex;
      });
    }, 5000); // Change banner every 5 seconds

    return () => clearInterval(interval);
  }, [fadeAnim, scaleAnim]);

  const renderBanner = ({ item }: { item: Banner }) => (
    <TouchableOpacity
      style={styles.bannerContainer}
      onPress={() => onBannerPress?.(item)}
      activeOpacity={0.95}
    >
      <Animated.View 
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }}
      >
        <LinearGradient
          colors={item.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bannerGradient}
        >
          {/* Enhanced Background Pattern with Animations */}
          <View style={styles.backgroundPattern}>
            <Animated.View 
              style={[
                styles.patternCircle1,
                {
                  opacity: sparkleAnim1,
                  transform: [{
                    scale: sparkleAnim1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1.2],
                    })
                  }]
                }
              ]}
            />
            <Animated.View 
              style={[
                styles.patternCircle2,
                {
                  opacity: sparkleAnim2,
                  transform: [{
                    scale: sparkleAnim2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.7, 1.1],
                    })
                  }]
                }
              ]}
            />
            <Animated.View 
              style={[
                styles.patternCircle3,
                {
                  opacity: sparkleAnim3,
                  transform: [{
                    scale: sparkleAnim3.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 1.3],
                    })
                  }]
                }
              ]}
            />
            <Animated.View 
              style={[
                styles.patternDots,
                {
                  opacity: floatingAnim,
                  transform: [
                    {
                      translateY: floatingAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -10],
                      })
                    },
                    {
                      rotate: floatingAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      })
                    }
                  ]
                }
              ]}
            />

            {/* Additional Sparkle Elements */}
            <Animated.View 
              style={[
                styles.sparkle1,
                {
                  opacity: sparkleAnim1,
                  transform: [{
                    scale: sparkleAnim1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    })
                  }]
                }
              ]}
            />
            <Animated.View 
              style={[
                styles.sparkle2,
                {
                  opacity: sparkleAnim2,
                  transform: [{
                    scale: sparkleAnim2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.4, 1.1],
                    })
                  }]
                }
              ]}
            />
            <Animated.View 
              style={[
                styles.sparkle3,
                {
                  opacity: sparkleAnim3,
                  transform: [{
                    scale: sparkleAnim3.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.2, 0.8],
                    })
                  }]
                }
              ]}
            />
          </View>

          <View style={styles.bannerContent}>
            <View style={styles.bannerTop}>
              <View style={styles.bannerLeft}>
                <Animated.View 
                  style={[
                    styles.iconContainer,
                    {
                      transform: [{ scale: pulseAnim }]
                    }
                  ]}
                >
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.1)']}
                    style={styles.iconGradient}
                  >
                    <Ionicons name={item.icon as any} size={26} color="#FFFFFF" />
                  </LinearGradient>
                </Animated.View>
                <View style={styles.textContainer}>
                  <Text style={styles.bannerTitle}>{item.title}</Text>
                  <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
                  <Text style={styles.bannerDescription}>{item.description}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.bannerBottom}>
              <TouchableOpacity 
                style={styles.ctaButton}
                onPress={() => onBannerPress?.(item)}
              >
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.1)']}
                  style={styles.ctaGradient}
                >
                  <Text style={styles.ctaText}>{item.ctaText}</Text>
                  <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );

  const renderPagination = () => (
    <View style={styles.paginationContainer}>
      {banners.map((_, index) => (
        <TouchableOpacity
          key={index}
          style={styles.paginationWrapper}
          onPress={() => {
            setCurrentIndex(index);
            flatListRef.current?.scrollToIndex({ index, animated: true });
          }}
        >
          <View
            style={[
              styles.paginationDot,
              {
                backgroundColor: index === currentIndex ? '#4F46E5' : 'rgba(79, 70, 229, 0.3)',
                transform: [{ scale: index === currentIndex ? 1.2 : 1 }],
                shadowOpacity: index === currentIndex ? 0.4 : 0,
              }
            ]}
          >
            {index === currentIndex && (
              <View style={styles.activeDotInner} />
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={banners}
        renderItem={renderBanner}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
          setCurrentIndex(index);
        }}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
      />
      {renderPagination()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 15,
    marginBottom: 15,
  },
  bannerContainer: {
    width: screenWidth,
    paddingHorizontal: 16,
  },
  bannerGradient: {
    borderRadius: 20,
    padding: 20,
    minHeight: 160,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.4,
  },
  patternCircle1: {
    position: 'absolute',
    top: 20,
    right: 30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  patternCircle2: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 6,
  },
  patternCircle3: {
    position: 'absolute',
    top: 80,
    left: 80,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  patternDots: {
    position: 'absolute',
    top: 50,
    right: 100,
    width: 20,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },
  sparkle1: {
    position: 'absolute',
    top: 30,
    left: 50,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 5,
  },
  sparkle2: {
    position: 'absolute',
    bottom: 50,
    right: 60,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  sparkle3: {
    position: 'absolute',
    top: 100,
    right: 140,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 4,
  },
  bannerContent: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    zIndex: 1,
    flex: 1,
    height: '100%',
  },
  bannerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginBottom: 14,
    flex: 1,
  },
  bannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    borderRadius: 20,
    padding: 0,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    alignSelf: 'flex-start',
  },
  iconGradient: {
    borderRadius: 20,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    width: 56,
    height: 56,
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
    justifyContent: 'flex-start',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.3,
    lineHeight: 22,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.2,
    lineHeight: 16,
  },
  bannerDescription: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontWeight: '500',
  },
  bannerBottom: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  ctaButton: {
    borderRadius: 20,
    paddingHorizontal: 0,
    paddingVertical: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    alignSelf: 'flex-end',
  },
  ctaGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    minWidth: 120,
    justifyContent: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.3,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  paginationWrapper: {
    padding: 8,
  },
  paginationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 3,
  },
});

export default EducationBannerSlider;
