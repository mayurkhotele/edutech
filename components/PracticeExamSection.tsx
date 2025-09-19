import { AppColors } from '@/constants/Colors';
import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Easing,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface PracticeExam {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  spots: number;
  spotsLeft: number;
  startTime: string;
  endTime: string;
  attempted: boolean;
}

interface CategoryStats {
  totalExams: number;
  attemptedExams: number;
  subcategories: string[];
}

interface CategoryDisplay {
  name: string;
  icon: string;
  gradient: readonly [string, string];
  stats: CategoryStats;
}

const PracticeExamSection = forwardRef<any, {}>((props, ref) => {
  const router = useRouter();
  const { user } = useAuth();
  const [exams, setExams] = useState<PracticeExam[]>([]);
  const [categoryStats, setCategoryStats] = useState<{ [key: string]: CategoryStats }>({});
  const [topCategories, setTopCategories] = useState<CategoryDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animated values for button animations
  const buttonScale = useRef(new Animated.Value(1)).current;
  const iconRotation = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchPracticeExams();
  }, []);

  useEffect(() => {
    if (exams.length > 0) {
      calculateCategoryStats();
    }
  }, [exams]);

  useEffect(() => {
    if (Object.keys(categoryStats).length > 0) {
      generateTopCategories();
    }
  }, [categoryStats]);

  // Start button animations
  useEffect(() => {
    const startButtonAnimations = () => {
      // Pulse animation for button
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.02,
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

      // Icon rotation animation
      Animated.loop(
        Animated.timing(iconRotation, {
          toValue: 1,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    };

    startButtonAnimations();
  }, []);

  const fetchPracticeExams = async () => {
    if (!user?.token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiFetchAuth('/student/practice-exams', user.token);
      if (response.ok) {
        setExams(response.data);
      }
    } catch (error) {
      console.error('Error fetching practice exams:', error);
      Alert.alert('Error', 'Failed to load practice exams. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPracticeExams();
    setRefreshing(false);
  };

  // Expose handleRefresh method to parent component
  useImperativeHandle(ref, () => ({
    handleRefresh
  }));

  const calculateCategoryStats = () => {
    const stats: { [key: string]: CategoryStats } = {};
    
    exams.forEach(exam => {
      if (!stats[exam.category]) {
        stats[exam.category] = {
          totalExams: 0,
          attemptedExams: 0,
          subcategories: []
        };
      }
      
      stats[exam.category].totalExams++;
      if (exam.attempted) {
        stats[exam.category].attemptedExams++;
      }
      
      if (!stats[exam.category].subcategories.includes(exam.subcategory)) {
        stats[exam.category].subcategories.push(exam.subcategory);
      }
    });
    
    setCategoryStats(stats);
  };

  const getCategoryIcon = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('railway')) return 'train';
    if (categoryLower.includes('ssc')) return 'school';
    if (categoryLower.includes('math')) return 'calculator';
    if (categoryLower.includes('science')) return 'flask';
    if (categoryLower.includes('english')) return 'book';
    if (categoryLower.includes('computer')) return 'laptop';
    if (categoryLower.includes('general')) return 'bulb';
    if (categoryLower.includes('reasoning')) return 'brain';
    if (categoryLower.includes('banking')) return 'card';
    if (categoryLower.includes('upsc')) return 'library';
    return 'library';
  };

  const getGradientColors = (index: number) => {
    // 8 different attractive gradient combinations
    const colorSchemes = [
      ['#FFB3B3', '#FFC8A2'], // Soft Red to Peach
      ['#B8E6E6', '#A8D8D8'], // Soft Turquoise to Light Teal
      ['#D4F0D4', '#C8E8C8'], // Soft Light Green to Mint
      ['#FFF2CC', '#FFE6B3'], // Soft Yellow to Light Orange
      ['#F0D4F0', '#E8C8E8'], // Soft Plum to Light Lavender
      ['#D4E6F0', '#C8D8E8'], // Soft Sky Blue to Light Steel Blue
      ['#FFE4CC', '#FFD4B3'], // Soft Orange to Light Peach
      ['#E6D4F0', '#D8C8E8'], // Soft Violet to Light Purple
    ];
    
    // Use index directly to assign colors sequentially
    return colorSchemes[index % colorSchemes.length] as [string, string];
  };

  const generateTopCategories = () => {
    const categories = Object.keys(categoryStats);
    
    // Sort categories by total exams (most popular first)
    const sortedCategories = categories.sort((a, b) => {
      const statsA = categoryStats[a];
      const statsB = categoryStats[b];
      return statsB.totalExams - statsA.totalExams;
    });

    // Take top 8 categories with index-based colors
    const top8Categories = sortedCategories.slice(0, 8).map((category, index) => ({
      name: category,
      icon: getCategoryIcon(category),
      gradient: getGradientColors(index),
      stats: categoryStats[category]
    }));

    setTopCategories(top8Categories);
  };

  const handleCategoryClick = (category: string) => {
    router.push({ pathname: '/exam-category', params: { category } });
  };

  const handleViewAll = () => {
    router.push('/practice-exam');
  };

  const handleButtonPress = () => {
    // Scale down animation on press
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate after animation
    setTimeout(() => {
      handleViewAll();
    }, 100);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.loadingText}>Loading Practice Exams...</Text>
          <Text style={styles.loadingSubtext}>Please wait while we fetch your exams</Text>
        </View>
      </View>
    );
  }

  // Calculate total stats for header
  const totalExams = Object.values(categoryStats).reduce((sum, stat) => sum + stat.totalExams, 0);
  const totalAttempted = Object.values(categoryStats).reduce((sum, stat) => sum + stat.attemptedExams, 0);

  return (
    <View style={styles.container}>
      {/* Header with Stats */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="library-outline" size={24} color={AppColors.white} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Practice Exams</Text>
            <Text style={styles.headerSubtitle}>
              {totalAttempted} of {totalExams} completed
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={[styles.refreshButton, refreshing && styles.refreshingButton]} 
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <Ionicons 
            name={refreshing ? "sync" : "refresh"} 
            size={20} 
            color={AppColors.white} 
            style={refreshing && styles.rotatingIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Progress Overview */}
      <View style={styles.progressOverview}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { width: `${totalExams > 0 ? (totalAttempted / totalExams) * 100 : 0}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {totalExams > 0 ? Math.round((totalAttempted / totalExams) * 100) : 0}% Complete
        </Text>
      </View>

      {/* Dynamic Top Categories Grid */}
      {topCategories.length > 0 && (
        <View style={styles.categoriesContainer}>
          {Array.from({ length: Math.ceil(topCategories.length / 2) }, (_, rowIndex) => (
            <View key={rowIndex} style={styles.categoryRow}>
              {topCategories.slice(rowIndex * 2, rowIndex * 2 + 2).map((category, cardIndex) => {
                const progress = category.stats.totalExams > 0 ? (category.stats.attemptedExams / category.stats.totalExams) * 100 : 0;
                
                return (
                  <TouchableOpacity
                    key={category.name}
                    style={[
                      styles.categoryCard,
                      cardIndex === 0 ? styles.leftCard : styles.rightCard
                    ]}
                    onPress={() => handleCategoryClick(category.name)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={category.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.categoryGradient}
                    >
                      <View style={styles.categoryContent}>
                        <View style={styles.categoryIconContainer}>
                          <Ionicons 
                            name={category.icon as any} 
                            size={24} 
                            color="#2C3E50" 
                          />
                        </View>
                        <View style={styles.categoryInfo}>
                          <Text style={styles.categoryTitle}>{category.name}</Text>
                          <Text style={styles.categoryStats}>
                            {category.stats.attemptedExams}/{category.stats.totalExams} completed
                          </Text>
                          <View style={styles.categoryProgressBar}>
                            <View 
                              style={[
                                styles.categoryProgressFill,
                                { width: `${progress}%` }
                              ]} 
                            />
                          </View>
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      )}

      {/* Enhanced View All Button */}
      <TouchableOpacity style={styles.viewAllButton} onPress={handleButtonPress}>
        <Animated.View style={[{ transform: [{ scale: buttonScale }] }]}>
          <LinearGradient
            colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.viewAllGradient}
          >
            <View style={styles.viewAllContent}>
              <Text style={styles.viewAllText}>View All Categories</Text>
              <Animated.View 
                style={[
                  styles.viewAllIconContainer,
                  {
                    transform: [{
                      rotate: iconRotation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      })
                    }]
                  }
                ]}
              >
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </Animated.View>
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    margin: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.darkGrey,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 15,
    color: AppColors.grey,
    fontWeight: '500',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconContainer: {
    backgroundColor: AppColors.primary,
    borderRadius: 12,
    padding: 8,
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: AppColors.darkGrey,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.05)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  headerSubtitle: {
    fontSize: 15,
    color: AppColors.grey,
    marginTop: 4,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  refreshButton: {
    backgroundColor: AppColors.primary,
    borderRadius: 20,
    padding: 10,
  },
  refreshingButton: {
    opacity: 0.7,
  },
  rotatingIcon: {
    transform: [{ rotate: '360deg' }],
  },
  progressOverview: {
    marginBottom: 20,
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    borderRadius: 12,
    padding: 12,
  },
  progressBar: {
    height: 10,
    backgroundColor: 'rgba(79, 70, 229, 0.2)',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: AppColors.primary,
    borderRadius: 8,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 2,
  },
  progressText: {
    fontSize: 13,
    color: AppColors.primary,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  categoriesContainer: {
    gap: 12,
    marginBottom: 20,
  },
  categoryCard: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryGradient: {
    padding: 16,
  },
  categoryContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryInfo: {
    alignItems: 'center',
    width: '100%',
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(44, 62, 80, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  categoryStats: {
    fontSize: 12,
    color: '#34495E',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  categoryProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(44, 62, 80, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  categoryProgressFill: {
    height: '100%',
    backgroundColor: '#3498DB',
    borderRadius: 2,
  },
  leftCard: {
    marginRight: 6,
  },
  rightCard: {
    marginLeft: 6,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  viewAllButton: {
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 6,
    alignSelf: 'center',
    maxWidth: '80%',
  },
  viewAllGradient: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.2,
  },
  viewAllIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
});

export default PracticeExamSection; 