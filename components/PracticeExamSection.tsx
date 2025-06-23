import { AppColors } from '@/constants/Colors';
import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

const PracticeExamSection = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [exams, setExams] = useState<PracticeExam[]>([]);
  const [categoryStats, setCategoryStats] = useState<{ [key: string]: CategoryStats }>({});
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
    return 'library';
  };

  const getGradientColors = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('railway')) return ['#FF6B6B', '#FF8E53'] as const;
    if (categoryLower.includes('ssc')) return ['#4ECDC4', '#44A08D'] as const;
    if (categoryLower.includes('math')) return ['#A8E6CF', '#7FCDCD'] as const;
    if (categoryLower.includes('science')) return ['#FFD93D', '#FF6B6B'] as const;
    if (categoryLower.includes('english')) return ['#667eea', '#764ba2'] as const;
    if (categoryLower.includes('computer')) return ['#FF9A9E', '#FECFEF'] as const;
    return ['#667eea', '#764ba2'] as const;
  };

  const handleCategoryPress = (category: string) => {
    router.push({
      pathname: '/exam-category',
      params: { category }
    });
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

  if (exams.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="library-outline" size={64} color={AppColors.grey} />
          <Text style={styles.emptyTitle}>No Practice Exams Available</Text>
          <Text style={styles.emptySubtext}>
            Check back later for new practice exams or contact your instructor.
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Ionicons name="refresh" size={16} color={AppColors.white} />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const categories = Object.keys(categoryStats);
  const totalExams = exams.length;
  const totalAttempted = exams.filter(exam => exam.attempted).length;

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
              { width: `${(totalAttempted / totalExams) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round((totalAttempted / totalExams) * 100)}% Complete
        </Text>
      </View>

      {/* Categories Grid */}
      <View style={styles.categoriesContainer}>
        {Array.from({ length: Math.ceil(categories.length / 2) }, (_, rowIndex) => (
          <View key={rowIndex} style={styles.categoryRow}>
            {categories.slice(rowIndex * 2, rowIndex * 2 + 2).map((category, cardIndex) => {
              const stats = categoryStats[category];
              const completionPercentage = (stats.attemptedExams / stats.totalExams) * 100;
              
              return (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryCard,
                    cardIndex === 0 ? styles.leftCard : styles.rightCard
                  ]}
                  onPress={() => handleCategoryPress(category)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={getGradientColors(category)}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.categoryGradient}
                  >
                    <View style={styles.categoryContent}>
                      <View style={styles.categoryIconContainer}>
                        <Ionicons 
                          name={getCategoryIcon(category) as any} 
                          size={28} 
                          color={AppColors.white} 
                        />
                      </View>
                      
                      <View style={styles.categoryInfo}>
                        <Text style={styles.categoryTitle}>{category}</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.darkGrey,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: AppColors.grey,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  categoryInfo: {
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.white,
    textAlign: 'center',
  },
  refreshButtonText: {
    color: AppColors.white,
    fontWeight: '600',
    fontSize: 14,
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
});

export default PracticeExamSection; 