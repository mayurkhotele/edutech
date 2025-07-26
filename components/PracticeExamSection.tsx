import { AppColors } from '@/constants/Colors';
import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
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

  const getGradientColors = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('railway')) return ['#FFB3BA', '#FF8A95'] as const;
    if (categoryLower.includes('ssc')) return ['#A8E6CF', '#88D8C0'] as const;
    if (categoryLower.includes('math')) return ['#B8E6B8', '#9DD6A8'] as const;
    if (categoryLower.includes('science')) return ['#FFE5B4', '#FFD280'] as const;
    if (categoryLower.includes('english')) return ['#B8D4E3', '#A5C7D7'] as const;
    if (categoryLower.includes('computer')) return ['#E6B3D9', '#D19BC8'] as const;
    if (categoryLower.includes('general')) return ['#FFD4B3', '#FFC085'] as const;
    if (categoryLower.includes('reasoning')) return ['#D4B3FF', '#C19BED'] as const;
    if (categoryLower.includes('banking')) return ['#B3E6CC', '#9DD6B8'] as const;
    if (categoryLower.includes('upsc')) return ['#E6B3D9', '#D19BC8'] as const;
    return ['#B8D4E3', '#A5C7D7'] as const;
  };

  const generateTopCategories = () => {
    const categories = Object.keys(categoryStats);
    
    // Sort categories by total exams (most popular first)
    const sortedCategories = categories.sort((a, b) => {
      const statsA = categoryStats[a];
      const statsB = categoryStats[b];
      return statsB.totalExams - statsA.totalExams;
    });

    // Take top 8 categories
    const top8Categories = sortedCategories.slice(0, 8).map(category => ({
      name: category,
      icon: getCategoryIcon(category),
      gradient: getGradientColors(category),
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

      {/* View All Button */}
      <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.viewAllGradient}
        >
          <Text style={styles.viewAllText}>View All Categories</Text>
          <Ionicons name="arrow-forward" size={20} color={AppColors.white} />
        </LinearGradient>
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
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.darkGrey,
  },
  loadingSubtext: {
    marginTop: 5,
    fontSize: 14,
    color: AppColors.grey,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.darkGrey,
  },
  headerSubtitle: {
    fontSize: 14,
    color: AppColors.grey,
    marginTop: 2,
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
  },
  progressBar: {
    height: 8,
    backgroundColor: AppColors.lightGrey,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: AppColors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: AppColors.grey,
    textAlign: 'center',
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryStats: {
    fontSize: 11,
    color: '#34495E',
    textAlign: 'center',
    marginBottom: 8,
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
  viewAllGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default PracticeExamSection; 