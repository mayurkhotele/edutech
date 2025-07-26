import { AppColors } from '@/constants/Colors';
import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import GlobalHeader from '../../components/GlobalHeader';

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

const ExamCategoryPage = () => {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [exams, setExams] = useState<PracticeExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      fetchExamsByCategory();
    }
  }, [category]);

  const fetchExamsByCategory = async () => {
    if (!user?.token || !category) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiFetchAuth('/student/practice-exams', user.token);
      if (response.ok) {
        // Filter exams by the selected category
        const categoryExams = response.data.filter((exam: PracticeExam) => 
          exam.category.toLowerCase() === category.toLowerCase()
        );
        setExams(categoryExams);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      Alert.alert('Error', 'Failed to load exams. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchExamsByCategory();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'Expired';
    } else if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays <= 7) {
      return `${diffDays} days left`;
    } else {
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
      });
    }
  };

  const getSpotsPercentage = (spots: number, spotsLeft: number) => {
    return ((spots - spotsLeft) / spots) * 100;
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

  const handleStartExam = (exam: PracticeExam) => {
    // Navigate to practice exam details
    router.push({
      pathname: '/(tabs)/practice-exam/[id]',
      params: { id: exam.id }
    });
  };

  const handleReviewExam = (exam: PracticeExam) => {
    // Navigate to practice exam details
    router.push({
      pathname: '/(tabs)/practice-exam/[id]',
      params: { id: exam.id }
    });
  };

  const groupExamsBySubcategory = () => {
    const grouped: { [key: string]: PracticeExam[] } = {};
    exams.forEach(exam => {
      if (!grouped[exam.subcategory]) {
        grouped[exam.subcategory] = [];
      }
      grouped[exam.subcategory].push(exam);
    });
    return grouped;
  };

  const getCompletionEmoji = (progress: number) => {
    if (progress === 100) return '🎉';
    if (progress >= 75) return '🚀';
    if (progress >= 50) return '💪';
    if (progress >= 25) return '📚';
    return '🎯';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.loadingText}>Loading {category} Exams...</Text>
          <Text style={styles.loadingSubtext}>Please wait while we fetch your exams</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (exams.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="library-outline" size={80} color={AppColors.grey} />
          <Text style={styles.emptyTitle}>No {category} Exams Available</Text>
          <Text style={styles.emptySubtext}>
            Check back later for new {category} practice exams.
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color={AppColors.white} />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const groupedExams = groupExamsBySubcategory();
  const subcategories = Object.keys(groupedExams);
  const totalExams = exams.length;
  const attemptedExams = exams.filter(exam => exam.attempted).length;
  const overallProgress = totalExams > 0 ? (attemptedExams / totalExams) * 100 : 0;

  return (
    <SafeAreaView style={styles.container}>
      <GlobalHeader
        title={category || 'Category'}
        subtitle={`${totalExams} exam${totalExams !== 1 ? 's' : ''} available`}
        showBackButton={true}
      />

      {/* Enhanced Exams List */}
      <ScrollView
        style={styles.examsContainer} 
        contentContainerStyle={styles.examsContentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[AppColors.primary]}
            tintColor={AppColors.primary}
          />
        }
      >
        {/* Simple Progress Overview */}
        <View style={styles.enhancedProgressOverview}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progress</Text>
            <Text style={styles.progressPercentage}>
              {Math.round(overallProgress)}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${overallProgress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {attemptedExams} of {totalExams} exams completed
          </Text>
        </View>

        {/* Simple Exam Cards */}
        {Object.entries(groupedExams).map(([subcategory, subcategoryExams]) => {
          return (
            <View key={subcategory} style={styles.subcategorySection}>
              <View style={styles.subcategoryHeader}>
                <View style={styles.subcategoryInfo}>
                  <Text style={styles.subcategoryTitle}>{subcategory}</Text>
                  <Text style={styles.subcategoryCount}>
                    {subcategoryExams.length} exam{subcategoryExams.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.subcategoryProgress}>
                  <Text style={styles.subcategoryProgressText}>
                    {subcategoryExams.filter(exam => exam.attempted).length}/{subcategoryExams.length} completed
                  </Text>
                </View>
              </View>

              {subcategoryExams.map((exam, index) => (
                <TouchableOpacity
                  key={exam.id}
                  style={styles.cleanExamCard}
                  onPress={() => exam.attempted ? handleReviewExam(exam) : handleStartExam(exam)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cleanCardContent}>
                    <View style={styles.cleanLeftSection}>
                      <Text style={styles.cleanExamTitle}>{exam.title}</Text>
                      <Text style={styles.cleanExamSubtitle}>{exam.subcategory}</Text>
                      <Text style={styles.cleanExamDate}>
                        Ends {formatDate(exam.endTime)}
                      </Text>
                    </View>
                    
                    <View style={styles.cleanRightSection}>
                      <View style={[
                        styles.cleanStatusIndicator,
                        exam.attempted ? styles.cleanCompletedStatus : styles.cleanPendingStatus
                      ]}>
                        <Ionicons 
                          name={exam.attempted ? "checkmark-circle" : "ellipse-outline"} 
                          size={16} 
                          color={exam.attempted ? AppColors.success : AppColors.grey} 
                        />
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.cleanActionButton,
                          exam.attempted ? styles.cleanReviewButton : styles.cleanStartButton
                        ]}
                        onPress={() => exam.attempted ? handleReviewExam(exam) : handleStartExam(exam)}
                      >
                        <Text style={styles.cleanButtonText}>
                          {exam.attempted ? 'View' : 'Start'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.darkGrey,
  },
  loadingSubtext: {
    marginTop: 5,
    fontSize: 14,
    color: AppColors.grey,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.darkGrey,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: AppColors.grey,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  refreshButton: {
    backgroundColor: AppColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  refreshButtonText: {
    color: AppColors.white,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  examsContainer: {
    flex: 1,
  },
  examsContentContainer: {
    paddingBottom: 20, // Add padding at the bottom for the last item
  },
  subcategorySection: {
    marginBottom: 25,
  },
  subcategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  subcategoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subcategoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.darkGrey,
    marginLeft: 8,
  },
  subcategoryCount: {
    fontSize: 14,
    color: AppColors.grey,
    fontWeight: '500',
  },
  subcategoryLabel: {
    fontSize: 12,
    color: AppColors.primary,
    fontWeight: '600',
  },
  subcategoryStats: {
    alignItems: 'flex-end',
  },
  examCardContainer: {
    marginBottom: 16,
  },
  examCard: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  examCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  examLeftSection: {
    flex: 1,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  examTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.darkGrey,
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: AppColors.white,
    marginLeft: 6,
  },
  completedBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.4)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.4)',
  },
  completedText: {
    color: '#27ae60',
  },
  pendingText: {
    color: '#f39c12',
  },
  examDetails: {
    marginBottom: 15,
  },
  examDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  examDetailText: {
    fontSize: 14,
    color: AppColors.grey,
    marginLeft: 8,
  },
  examRightSection: {
    alignItems: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 15,
    backgroundColor: AppColors.primary,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    color: AppColors.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  startButton: {
    backgroundColor: AppColors.primary,
  },
  reviewButton: {
    backgroundColor: AppColors.success,
  },
  simpleExamCard: {
    backgroundColor: AppColors.white,
    borderRadius: 15,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  examTitleContainer: {
    flex: 1,
  },

  examMeta: {
    flexDirection: 'row',
    marginTop: 8,
  },
  examDate: {
    fontSize: 13,
    color: AppColors.grey,
    fontWeight: '500',
    marginLeft: 4,
  },
  examSpots: {
    fontSize: 13,
    color: AppColors.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  examBadges: {
    flexDirection: 'row',
    gap: 10,
  },
  attemptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  attemptedText: {
    fontSize: 12,
    color: AppColors.success,
    marginLeft: 6,
    fontWeight: '600',
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  popularText: {
    fontSize: 12,
    color: AppColors.accent,
    marginLeft: 6,
    fontWeight: '600',
  },
  examStatus: {
    padding: 4,
  },


  progressContainer: {
    marginTop: 15,
  },
  examProgressBar: {
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  examProgressFill: {
    height: '100%',
    backgroundColor: AppColors.primary,
    borderRadius: 4,
  },
  examProgressText: {
    fontSize: 13,
    color: AppColors.grey,
    textAlign: 'right',
    fontWeight: '600',
  },
  examActions: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    paddingTop: 15,
  },
  enhancedActionButton: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },



  simpleActionButton: {
    borderRadius: 10,
    backgroundColor: AppColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },

  statusIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingStatus: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  completedStatus: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.4)',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginRight: 16,
  },
  amazingExamCard: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  amazingCardGradient: {
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amazingCardContent: {
    flex: 1,
  },
  amazingLeftSection: {
    marginBottom: 10,
  },
  amazingRightSection: {
    alignItems: 'flex-end',
  },
  amazingTitleContainer: {
    marginBottom: 4,
  },
  amazingExamTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.white,
  },
  amazingBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  amazingBadgeText: {
    fontSize: 12,
    color: AppColors.white,
    fontWeight: '600',
  },
  amazingExamDate: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  amazingExamSpots: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  amazingStatusRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  amazingPendingRing: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  amazingCompletedRing: {
    backgroundColor: AppColors.success,
    borderWidth: 1,
    borderColor: AppColors.success,
  },
  amazingActionButton: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  amazingButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  amazingButtonText: {
    color: AppColors.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  cleanExamCard: {
    backgroundColor: AppColors.white,
    borderRadius: 15,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  cleanCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cleanLeftSection: {
    flex: 1,
    marginRight: 15,
  },
  cleanRightSection: {
    alignItems: 'flex-end',
  },
  cleanExamTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.darkGrey,
    marginBottom: 4,
  },
  cleanExamSubtitle: {
    fontSize: 14,
    color: AppColors.grey,
    marginBottom: 4,
  },
  cleanExamDate: {
    fontSize: 13,
    color: AppColors.grey,
  },
  cleanStatusIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cleanPendingStatus: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  cleanCompletedStatus: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.4)',
  },
  cleanActionButton: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cleanStartButton: {
    backgroundColor: AppColors.primary,
  },
  cleanReviewButton: {
    backgroundColor: AppColors.success,
  },
  cleanButtonText: {
    color: AppColors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  simpleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  simpleBackButton: {
    padding: 8,
  },
  attractiveProgressOverview: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  progressGradient: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  progressLeft: {
    flex: 1,
  },

  progressSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressRight: {
    alignItems: 'flex-end',
  },
 
  progressEmoji: {
    fontSize: 24,
  },
  progressBarContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  attractiveExamCard: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  examCardGradient: {
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  examCardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  examMetaRow: {
    flexDirection: 'row',
    gap: 15,
  },
  examMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  examMetaText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
  },

  attractiveActionButton: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  enhancedProgressOverview: {
    backgroundColor: AppColors.white,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.darkGrey,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#E9ECEF',
    borderRadius: 5,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: AppColors.primary,
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    color: AppColors.grey,
    textAlign: 'center',
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.primary,
  },
  subcategoryProgress: {
    alignItems: 'flex-end',
  },
  subcategoryProgressText: {
    fontSize: 14,
    color: AppColors.grey,
    fontWeight: '600',
  },
});

export default ExamCategoryPage; 