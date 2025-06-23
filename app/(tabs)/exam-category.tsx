import { AppColors } from '@/constants/Colors';
import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
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

const ExamCategoryPage = () => {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [exams, setExams] = useState<PracticeExam[]>([]);
  const [loading, setLoading] = useState(true);
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

  const handleStartExam = (exam: PracticeExam) => {
    Alert.alert(
      'Start Exam',
      `Are you sure you want to start "${exam.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start', 
          onPress: () => {
            // Navigate to exam or start exam logic
            console.log('Starting exam:', exam.id);
          }
        }
      ]
    );
  };

  const handleReviewExam = (exam: PracticeExam) => {
    Alert.alert(
      'Review Exam',
      `Would you like to review your attempt for "${exam.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Review', 
          onPress: () => {
            // Navigate to review or results
            console.log('Reviewing exam:', exam.id);
          }
        }
      ]
    );
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.loadingText}>Loading {category} Exams...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (exams.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="library-outline" size={64} color={AppColors.grey} />
          <Text style={styles.emptyTitle}>No {category} Exams Available</Text>
          <Text style={styles.emptySubtext}>
            Check back later for new {category} practice exams.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const groupedExams = groupExamsBySubcategory();
  const subcategories = Object.keys(groupedExams);
  const totalExams = exams.length;
  const attemptedExams = exams.filter(exam => exam.attempted).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Simple Header */}
      <LinearGradient
        colors={getGradientColors(category || '')}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.simpleHeader}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={AppColors.white} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{category}</Text>
        
        <View style={styles.placeholder} />
      </LinearGradient>

      {/* Progress Overview */}
      <View style={styles.progressOverview}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { width: `${(attemptedExams / totalExams) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round((attemptedExams / totalExams) * 100)}% Complete
        </Text>
      </View>

      {/* Exams List */}
      <ScrollView style={styles.examsContainer} showsVerticalScrollIndicator={false}>
        {Object.entries(groupedExams).map(([subcategory, subcategoryExams]) => {
          return (
            <View key={subcategory} style={styles.subcategorySection}>
              <View style={styles.subcategoryHeader}>
                <Text style={styles.subcategoryTitle}>{subcategory}</Text>
                <Text style={styles.subcategoryCount}>
                  {subcategoryExams.length} exam{subcategoryExams.length !== 1 ? 's' : ''}
                </Text>
              </View>
              
              {subcategoryExams.map(exam => (
                <TouchableOpacity 
                  key={exam.id} 
                  style={styles.examCard}
                  onPress={() => exam.attempted ? handleReviewExam(exam) : handleStartExam(exam)}
                  activeOpacity={0.7}
                >
                  <View style={styles.examHeader}>
                    <View style={styles.examTitleContainer}>
                      <Text style={styles.examTitle}>{exam.title}</Text>
                      <View style={styles.examBadges}>
                        {exam.attempted && (
                          <View style={styles.attemptedBadge}>
                            <Ionicons name="checkmark-circle" size={12} color={AppColors.success} />
                            <Text style={styles.attemptedText}>Completed</Text>
                          </View>
                        )}
                        {getSpotsPercentage(exam.spots, exam.spotsLeft) > 80 && (
                          <View style={styles.popularBadge}>
                            <Ionicons name="trending-up" size={12} color={AppColors.accent} />
                            <Text style={styles.popularText}>Popular</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.examStatus}>
                      <Ionicons 
                        name={exam.attempted ? "checkmark-circle" : "play-circle"} 
                        size={28} 
                        color={exam.attempted ? AppColors.success : AppColors.primary} 
                      />
                    </View>
                  </View>

                  <View style={styles.examDetails}>
                    <View style={styles.examDetailRow}>
                      <Ionicons name="calendar-outline" size={16} color={AppColors.grey} />
                      <Text style={styles.examDetailText}>
                        Ends: {formatDate(exam.endTime)}
                      </Text>
                    </View>

                    <View style={styles.examDetailRow}>
                      <Ionicons name="people-outline" size={16} color={AppColors.grey} />
                      <Text style={styles.examDetailText}>
                        {exam.spotsLeft} spots remaining
                      </Text>
                    </View>

                    <View style={styles.progressContainer}>
                      <View style={styles.examProgressBar}>
                        <View 
                          style={[
                            styles.examProgressFill,
                            { width: `${getSpotsPercentage(exam.spots, exam.spotsLeft)}%` }
                          ]} 
                        />
                      </View>
                      <Text style={styles.examProgressText}>
                        {Math.round(getSpotsPercentage(exam.spots, exam.spotsLeft))}% filled
                      </Text>
                    </View>
                  </View>

                  <View style={styles.examActions}>
                    <TouchableOpacity 
                      style={[
                        styles.actionButton,
                        exam.attempted ? styles.reviewButton : styles.startButton
                      ]}
                      onPress={() => exam.attempted ? handleReviewExam(exam) : handleStartExam(exam)}
                    >
                      <Text style={styles.actionButtonText}>
                        {exam.attempted ? 'Review Results' : 'Start Exam'}
                      </Text>
                      <Ionicons 
                        name={exam.attempted ? "eye" : "arrow-forward"} 
                        size={16} 
                        color={AppColors.white} 
                      />
                    </TouchableOpacity>
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
    backgroundColor: AppColors.lightGrey,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.darkGrey,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  },
  simpleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  backButton: {
    marginRight: 10,
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: AppColors.white,
  },
  placeholder: {
    flex: 1,
  },
  progressOverview: {
    backgroundColor: AppColors.white,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    fontSize: 12,
    color: AppColors.grey,
    textAlign: 'center',
    fontWeight: '500',
  },
  examsContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  subcategorySection: {
    marginBottom: 20,
  },
  subcategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  subcategoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.darkGrey,
  },
  subcategoryCount: {
    fontSize: 14,
    color: AppColors.grey,
    fontWeight: '500',
  },
  examCard: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  examTitleContainer: {
    flex: 1,
  },
  examTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.darkGrey,
    marginBottom: 8,
  },
  examBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  attemptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  attemptedText: {
    fontSize: 12,
    color: AppColors.success,
    marginLeft: 4,
    fontWeight: '600',
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 12,
    color: AppColors.accent,
    marginLeft: 4,
    fontWeight: '600',
  },
  examStatus: {
    padding: 4,
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
    fontSize: 15,
    color: AppColors.grey,
    marginLeft: 10,
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 10,
  },
  examProgressBar: {
    height: 6,
    backgroundColor: AppColors.lightGrey,
    borderRadius: 3,
    marginBottom: 6,
    overflow: 'hidden',
  },
  examProgressFill: {
    height: '100%',
    backgroundColor: AppColors.primary,
    borderRadius: 3,
  },
  examProgressText: {
    fontSize: 12,
    color: AppColors.grey,
    textAlign: 'right',
    fontWeight: '500',
  },
  examActions: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    paddingTop: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
  },
  startButton: {
    backgroundColor: AppColors.primary,
  },
  reviewButton: {
    backgroundColor: AppColors.success,
  },
  actionButtonText: {
    color: AppColors.white,
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default ExamCategoryPage; 