import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface FeatureItem {
  id: string;
  title: string;
  icon: string;
  route: string;
  gradientColors: [string, string];
  shadowColor: string;
}

const features: FeatureItem[] = [
  {
    id: '1',
    title: 'Live Exam',
    icon: 'play-circle',
    route: '/(tabs)/exam',
    gradientColors: ['#FF6B6B', '#FF8E8E'],
    shadowColor: '#FF6B6B'
  },
  {
    id: '2',
    title: 'Practice Exam',
    icon: 'library',
    route: '/(tabs)/practice-exam',
    gradientColors: ['#4ECDC4', '#6ED5D0'],
    shadowColor: '#4ECDC4'
  },
  {
    id: '3',
    title: "Who's the Spy",
    icon: 'eye',
    route: '/(tabs)/spy-game',
    gradientColors: ['#45B7D1', '#67C4D7'],
    shadowColor: '#45B7D1'
  },
  {
    id: '4',
    title: 'Battle Quiz',
    icon: 'trophy',
    route: '/(tabs)/quiz',
    gradientColors: ['#96CEB4', '#A8D4C0'],
    shadowColor: '#96CEB4'
  },
  {
    id: '5',
    title: 'Social Media',
    icon: 'people',
    route: '/(tabs)/social',
    gradientColors: ['#FECA57', '#FED373'],
    shadowColor: '#FECA57'
  },
  {
    id: '6',
    title: 'Notifications',
    icon: 'notifications',
    route: '/exam-notifications',
    gradientColors: ['#FF9FF3', '#FFB3F6'],
    shadowColor: '#FF9FF3'
  },
  {
    id: '7',
    title: 'Timetable',
    icon: 'calendar',
    route: '/(tabs)/timetable',
    gradientColors: ['#54A0FF', '#74B3FF'],
    shadowColor: '#54A0FF'
  },
  {
    id: '8',
    title: '24/7 Support',
    icon: 'headset',
    route: '/(tabs)/support-tickets',
    gradientColors: ['#81C784', '#95D199'],
    shadowColor: '#81C784'
  }
];

const OurFeaturesSection: React.FC = () => {
  const router = useRouter();
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Shimmer animation
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    // Floating animation
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );

    shimmerAnimation.start();
    floatAnimation.start();

    return () => {
      shimmerAnimation.stop();
      floatAnimation.stop();
    };
  }, []);

  const handleFeaturePress = (feature: FeatureItem) => {
    console.log(`Navigate to ${feature.title}`);
    router.push(feature.route as any);
  };

  const renderFeatureItem = (feature: FeatureItem, isSecondRow: boolean = false, index: number) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    
    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };

    const floatTranslateY = floatAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -3],
    });

    const shimmerTranslateX = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-100, 100],
    });

    return (
      <Animated.View
        key={feature.id}
        style={[
          styles.featureItem,
          isSecondRow && styles.secondRowItem,
          {
            transform: [
              { scale: scaleAnim },
              { translateY: floatTranslateY }
            ],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => handleFeaturePress(feature)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          style={styles.touchableContent}
        >
          {/* Shimmer Effect */}
          <Animated.View
            style={[
              styles.shimmerOverlay,
              {
                transform: [{ translateX: shimmerTranslateX }],
                opacity: shimmerAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.3, 0],
                }),
              },
            ]}
          />
          
          {/* Gradient Icon Container */}
          <LinearGradient
            colors={feature.gradientColors}
            style={styles.iconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name={feature.icon as any} size={22} color="#fff" />
          </LinearGradient>
          
          {/* Title */}
          <Text style={[styles.featureTitle, isSecondRow && styles.secondRowTitle]}>
            {feature.title}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Split features into two rows: first 4, then remaining 4
  const firstRowFeatures = features.slice(0, 4);
  const secondRowFeatures = features.slice(4, 8);

  return (
    <LinearGradient
      colors={['#FFFFFF', '#F8FAFC', '#FFFFFF']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Enhanced Header */}
      <LinearGradient
        colors={['#4F46E5', '#7C3AED', '#EC4899']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={['#FFD700', '#FF6B6B']}
              style={styles.headerIcon}
            >
              <Ionicons name="apps" size={18} color="#FFFFFF" />
            </LinearGradient>
            <View>
              <Text style={styles.sectionTitle}>Our Features</Text>
              <Text style={styles.sectionSubtitle}>Explore all capabilities</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.seeAllButton}>
            <LinearGradient
              colors={['#FFFFFF', '#F3F4F6']}
              style={styles.seeAllGradient}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <Ionicons name="chevron-forward" size={14} color="#4F46E5" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {/* First Row - 4 items */}
      <View style={styles.featuresRow}>
        {firstRowFeatures.map((feature, index) => renderFeatureItem(feature, false, index))}
      </View>
      
      {/* Second Row - 4 items */}
      <View style={styles.featuresRow}>
        {secondRowFeatures.map((feature, index) => renderFeatureItem(feature, true, index))}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 20,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(79, 70, 229, 0.1)',
    overflow: 'hidden',
  },
  header: {
    marginHorizontal: -2,
    marginTop: -2,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    marginBottom: 20,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  seeAllButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  seeAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  seeAllText: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '700',
    letterSpacing: 0.3,
    marginRight: 4,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  featureItem: {
    width: (screenWidth - 120) / 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(79, 70, 229, 0.08)',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    minHeight: 95,
    overflow: 'hidden',
    position: 'relative',
  },
  touchableContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    flex: 1,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    width: 50,
  },
  secondRowItem: {
    width: (screenWidth - 120) / 4,
  },
  secondRowTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 13,
    letterSpacing: 0.3,
    marginTop: 1,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  featureTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 14,
    letterSpacing: 0.3,
  },
});

export default OurFeaturesSection;
