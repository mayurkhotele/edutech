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
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import RefreshableScrollView from '../../components/RefreshableScrollView';

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

const PracticeExamScreen = () => {
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
    
    if (categoryLower.includes('math') || categoryLower.includes('mathematics')) {
      return ['#bbdefb', '#90caf9'] as const;
    } else if (categoryLower.includes('science') || categoryLower.includes('physics') || categoryLower.includes('chemistry')) {
      return ['#e1bee7', '#ce93d8'] as const;
    } else if (categoryLower.includes('english') || categoryLower.includes('language')) {
      return ['#c8e6c9', '#a5d6a7'] as const;
    } else if (categoryLower.includes('history') || categoryLower.includes('social')) {
      return ['#ffcc80', '#ffb74d'] as const;
    } else if (categoryLower.includes('computer') || categoryLower.includes('programming') || categoryLower.includes('coding')) {
      return ['#f8bbd9', '#f48fb1'] as const;
    } else if (categoryLower.includes('geography') || categoryLower.includes('environment')) {
      return ['#b2dfdb', '#80cbc4'] as const;
    } else if (categoryLower.includes('economics') || categoryLower.includes('business')) {
      return ['#dcedc8', '#c5e1a5'] as const;
    } else if (categoryLower.includes('literature') || categoryLower.includes('poetry')) {
      return ['#eeeeee', '#e0e0e0'] as const;
    } else {
      // Default gradient for other categories
      return ['#e9ecef', '#dee2e6'] as const;
    }
  };

  const handleCategoryClick = (category: string) => {
    router.push({ pathname: '/exam-category', params: { category } });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.loadingText}>Loading Practice Exams...</Text>
          <Text style={styles.loadingSubtext}>Please wait while we fetch your exams</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (exams.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="library-outline" size={64} color={AppColors.grey} />
          <Text style={styles.emptyTitle}>No Practice Exams Available</Text>
          <Text style={styles.emptySubtext}>
            Check back later for new practice exams or contact your instructor.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Only show categories grid
  const categories = Object.keys(categoryStats);
  const totalExams = exams.length;
  const totalAttempted = exams.filter(exam => exam.attempted).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Simple Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={AppColors.darkGrey} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Practice Exams</Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <Ionicons 
            name={refreshing ? "sync" : "refresh"} 
            size={20} 
            color={AppColors.primary} 
            style={refreshing && styles.rotatingIcon}
          />
        </TouchableOpacity>
      </View>

      <RefreshableScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      >
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="library-outline" size={24} color={AppColors.primary} />
              <Text style={styles.statNumber}>{totalExams}</Text>
              <Text style={styles.statLabel}>Total Exams</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#27ae60" />
              <Text style={styles.statNumber}>{totalAttempted}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time-outline" size={24} color="#f39c12" />
              <Text style={styles.statNumber}>{totalExams - totalAttempted}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trending-up-outline" size={24} color="#e74c3c" />
              <Text style={styles.statNumber}>{categories.length}</Text>
              <Text style={styles.statLabel}>Categories</Text>
            </View>
          </View>
        </View>

        {/* Categories Grid */}
        <View style={styles.categoriesContainer}>
          <Text style={styles.categoriesTitle}>Categories</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category, index) => {
              const stats = categoryStats[category];
              const progress = stats ? (stats.attemptedExams / stats.totalExams) * 100 : 0;
              
              return (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryCard,
                    index % 2 === 0 ? styles.leftCard : styles.rightCard
                  ]}
                  onPress={() => handleCategoryClick(category)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={getGradientColors(category)}
                    style={styles.categoryGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.categoryContent}>
                      <View style={styles.categoryIconContainer}>
                        <Ionicons name={getCategoryIcon(category)} size={28} color={AppColors.primary} />
                      </View>
                      <View style={styles.categoryInfo}>
                        <Text style={styles.categoryTitle}>{category}</Text>
                        <Text style={styles.categoryStats}>
                          {stats?.attemptedExams || 0} of {stats?.totalExams || 0} completed
                        </Text>
                      </View>
                      <View style={styles.categoryProgress}>
                        <View style={styles.categoryProgressBar}>
                          <View 
                            style={[
                              styles.categoryProgressFill,
                              { width: `${progress}%` }
                            ]} 
                          />
                        </View>
                        <Text style={styles.categoryProgressText}>{Math.round(progress)}%</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </RefreshableScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.lightGrey,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.darkGrey,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshingButton: {
    opacity: 0.7,
  },
  rotatingIcon: {
    transform: [{ rotate: '45deg' }],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.darkGrey,
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: AppColors.grey,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.darkGrey,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: AppColors.grey,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  progressOverview: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
    fontSize: 14,
    color: AppColors.grey,
    textAlign: 'center',
    fontWeight: '600',
  },
  categoriesContainer: {
    marginBottom: 24,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryCard: {
    width: '48%',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 8,
  },
  categoryGradient: {
    padding: 8,
  },
  categoryContent: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  categoryIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 6,
    padding: 6,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryInfo: {
    width: '100%',
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 1,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  categoryStats: {
    fontSize: 9,
    color: '#4a4a4a',
    textAlign: 'center',
    marginBottom: 2,
    fontWeight: '500',
  },
  leftCard: {
    marginRight: 6,
  },
  rightCard: {
    marginLeft: 6,
  },
  categoryProgressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  categoryProgressFill: {
    height: '100%',
    backgroundColor: '#27ae60',
    borderRadius: 3,
  },
  statsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.darkGrey,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.darkGrey,
    marginTop: 6,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: AppColors.grey,
    textAlign: 'center',
    fontWeight: '500',
  },
  categoriesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.darkGrey,
    marginBottom: 12,
  },
  categoryProgress: {
    alignItems: 'center',
    marginTop: 4,
  },
  categoryProgressText: {
    fontSize: 9,
    color: '#4a4a4a',
    marginTop: 1,
    fontWeight: '600',
  },
});

export default PracticeExamScreen; 