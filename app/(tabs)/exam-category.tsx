import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  RefreshControl,
  SafeAreaView,
  ScrollView,
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

const ExamCategoryPage = () => {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [exams, setExams] = useState<PracticeExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed' | 'pending'>('all');

  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  const scaleAnim = new Animated.Value(0.9);

  useEffect(() => {
    if (category) {
      fetchExamsByCategory();
    }
    // Start animations
    startAnimations();
  }, [category]);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const fetchExamsByCategory = async () => {
    if (!user?.token || !category) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Fetching exams for category:', category);
      const response = await apiFetchAuth('/student/practice-exams', user.token);
      if (response.ok) {
        // Filter exams by the selected category
        const categoryExams = response.data.filter((exam: PracticeExam) => 
          exam.category.toLowerCase() === category.toLowerCase()
        );
        console.log('📊 Total exams received:', response.data.length);
        console.log('📊 Filtered exams for category:', categoryExams.length);
        console.log('📊 Category exams:', categoryExams);
        setExams(categoryExams);
      } else {
        console.error('❌ Failed to fetch exams:', response.data);
      }
    } catch (error) {
      console.error('❌ Error fetching exams:', error);
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

  const getCategoryIcon = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('railway')) return 'train';
    if (categoryLower.includes('ssc')) return 'school';
    if (categoryLower.includes('math')) return 'calculator';
    if (categoryLower.includes('science')) return 'flask';
    if (categoryLower.includes('english')) return 'book';
    if (categoryLower.includes('computer')) return 'laptop';
    if (categoryLower.includes('general')) return 'bulb';
    if (categoryLower.includes('reasoning')) return 'bulb';
    if (categoryLower.includes('banking')) return 'card';
    if (categoryLower.includes('upsc')) return 'library';
    return 'library';
  };

  const getGradientColors = (category: string) => {
    const categoryLower = category.toLowerCase();
    
    const colorSchemes = [
      ['#8B5CF6', '#A855F7'], // Purple
      ['#06B6D4', '#0891B2'], // Cyan  
      ['#10B981', '#059669'], // Green
      ['#F59E0B', '#D97706'], // Orange
      ['#EF4444', '#DC2626'], // Red
      ['#8B5CF6', '#A855F7'], // Purple again
    ];
    
    const hash = categoryLower.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const colorIndex = Math.abs(hash) % colorSchemes.length;
    return colorSchemes[colorIndex] as [string, string];
  };

  const handleStartExam = (exam: PracticeExam) => {
    router.push({
      pathname: '/(tabs)/practice-exam/[id]',
      params: { id: exam.id }
    });
  };

  const handleReviewExam = (exam: PracticeExam) => {
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

  const getFilteredExams = () => {
    if (selectedFilter === 'all') return exams;
    if (selectedFilter === 'completed') return exams.filter(exam => exam.attempted);
    if (selectedFilter === 'pending') return exams.filter(exam => !exam.attempted);
    return exams;
  };

  const getFilteredGroupedExams = () => {
    const filteredExams = getFilteredExams();
    const grouped: { [key: string]: PracticeExam[] } = {};
    filteredExams.forEach(exam => {
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
          <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text style={styles.loadingText}>Loading {category} Exams...</Text>
              <Text style={styles.loadingSubtext}>Please wait while we fetch your exams</Text>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  if (exams.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
            <View style={styles.emptyCard}>
              <Ionicons name="library-outline" size={80} color="#8B5CF6" />
              <Text style={styles.emptyTitle}>No {category} Exams Available</Text>
              <Text style={styles.emptySubtext}>
                Check back later for new {category} practice exams.
              </Text>
              <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                <Ionicons name="refresh" size={20} color="#FFFFFF" />
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  const groupedExams = getFilteredGroupedExams();
  const subcategories = Object.keys(groupedExams);
  const totalExams = exams.length;
  const attemptedExams = exams.filter(exam => exam.attempted).length;
  const overallProgress = totalExams > 0 ? (attemptedExams / totalExams) * 100 : 0;
  const categoryColors = getGradientColors(category || '');

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced Header */}
      <LinearGradient
        colors={categoryColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <View style={styles.categoryIconContainer}>
              <Ionicons name={getCategoryIcon(category || '')} size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.categoryTitle}>{category}</Text>
            <Text style={styles.categorySubtitle}>
              {totalExams} exam{totalExams !== 1 ? 's' : ''} available
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Enhanced Progress Overview */}
      <Animated.View 
        style={[
          styles.progressSection,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <LinearGradient
          colors={['#F8FAFC', '#F1F5F9']}
          style={styles.progressCard}
        >
          <View style={styles.progressHeader}>
            <View style={styles.progressLeft}>
              <Text style={styles.progressTitle}>Your Progress</Text>
              <Text style={styles.progressSubtitle}>
                {attemptedExams} of {totalExams} completed
              </Text>
            </View>
            <View style={styles.progressRight}>
              <Text style={styles.progressPercentage}>
                {Math.round(overallProgress)}%
              </Text>
              <Text style={styles.progressEmoji}>
                {getCompletionEmoji(overallProgress)}
              </Text>
            </View>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill,
                  { width: `${overallProgress}%` }
                ]} 
              />
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Filter Tabs */}
      <Animated.View 
        style={[
          styles.filterSection,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <View style={styles.filterContainer}>
          {[
            { key: 'all', label: 'All', count: totalExams },
            { key: 'completed', label: 'Completed', count: attemptedExams },
            { key: 'pending', label: 'Pending', count: totalExams - attemptedExams }
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                selectedFilter === filter.key && styles.activeFilterTab
              ]}
              onPress={() => setSelectedFilter(filter.key as any)}
            >
              <Text style={[
                styles.filterText,
                selectedFilter === filter.key && styles.activeFilterText
              ]}>
                {filter.label}
              </Text>
              <View style={[
                styles.filterCount,
                selectedFilter === filter.key && styles.activeFilterCount
              ]}>
                <Text style={[
                  styles.filterCountText,
                  selectedFilter === filter.key && styles.activeFilterCountText
                ]}>
                  {filter.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Enhanced Exams List */}
      <ScrollView
        style={styles.examsContainer} 
        contentContainerStyle={styles.examsContentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8B5CF6']}
            tintColor="#8B5CF6"
          />
        }
      >
        {Object.entries(groupedExams).map(([subcategory, subcategoryExams], sectionIndex) => {
          const subcategoryProgress = subcategoryExams.length > 0 
            ? (subcategoryExams.filter(exam => exam.attempted).length / subcategoryExams.length) * 100 
            : 0;
          
          return (
            <Animated.View 
              key={subcategory} 
                              style={[
                  styles.subcategorySection,
                  { 
                    opacity: fadeAnim, 
                    transform: [{ 
                      translateY: slideAnim
                    }] 
                  }
                ]}
            >
              <View style={styles.subcategoryHeader}>
                <View style={styles.subcategoryInfo}>
                  <View style={styles.subcategoryTitleRow}>
                    <Text style={styles.subcategoryTitle}>{subcategory}</Text>
                    <View style={styles.subcategoryBadge}>
                      <Text style={styles.subcategoryBadgeText}>
                        {subcategoryExams.length}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.subcategoryCount}>
                    {subcategoryExams.length} exam{subcategoryExams.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.subcategoryProgress}>
                  <View style={styles.subcategoryProgressRing}>
                    <Text style={styles.subcategoryProgressText}>
                      {Math.round(subcategoryProgress)}%
                    </Text>
                  </View>
                  <Text style={styles.subcategoryProgressLabel}>completed</Text>
                </View>
              </View>

              {subcategoryExams.map((exam, index) => (
                <Animated.View
                  key={exam.id}
                  style={[
                    styles.examCardWrapper,
                    { 
                      opacity: fadeAnim, 
                      transform: [{ 
                        translateY: slideAnim
                      }] 
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={styles.enhancedExamCard}
                    onPress={() => exam.attempted ? handleReviewExam(exam) : handleStartExam(exam)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={exam.attempted ? ['#10B981', '#059669'] : ['#FFFFFF', '#F8FAFC']}
                      style={styles.examCardGradient}
                    >
                      <View style={styles.examCardContent}>
                        <View style={styles.examLeftSection}>
                          <View style={styles.examHeader}>
                            <Text style={[
                              styles.examTitle,
                              exam.attempted && styles.completedExamTitle
                            ]}>
                              {exam.title}
                            </Text>
                            <View style={[
                              styles.statusBadge,
                              exam.attempted ? styles.completedBadge : styles.pendingBadge
                            ]}>
                              <Ionicons 
                                name={exam.attempted ? "checkmark-circle" : "time"} 
                                size={16} 
                                color={exam.attempted ? "#10B981" : "#6B7280"} 
                              />
                              <Text style={[
                                styles.statusText,
                                exam.attempted ? styles.completedText : styles.pendingText
                              ]}>
                                {exam.attempted ? 'Completed' : 'Pending'}
                              </Text>
                            </View>
                          </View>
                          
                          <View style={styles.examMeta}>
                            <View style={styles.metaItem}>
                              <View style={styles.metaIconContainer}>
                                <Ionicons name="calendar" size={14} color="#6B7280" />
                              </View>
                              <Text style={styles.metaText}>
                                Ends {formatDate(exam.endTime)}
                              </Text>
                            </View>
                            <View style={styles.metaItem}>
                              <View style={styles.metaIconContainer}>
                                <Ionicons name="people" size={14} color="#6B7280" />
                              </View>
                              <Text style={styles.metaText}>
                                {exam.spotsLeft}/{exam.spots} spots
                              </Text>
                            </View>
                          </View>
                        </View>
                        
                        <View style={styles.examRightSection}>
                          <TouchableOpacity
                            style={[
                              styles.actionButton,
                              exam.attempted ? styles.reviewButton : styles.startButton
                            ]}
                            onPress={() => exam.attempted ? handleReviewExam(exam) : handleStartExam(exam)}
                          >
                            <Ionicons 
                              name={exam.attempted ? "eye" : "play"} 
                              size={18} 
                              color="#FFFFFF" 
                            />
                            <Text style={styles.actionButtonText}>
                              {exam.attempted ? 'Review' : 'Start'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Floating Action Button */}
      <Animated.View 
        style={[
          styles.fabContainer,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
        ]}
      >
        <TouchableOpacity style={styles.fab} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  // Enhanced Header
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  categorySubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  // Enhanced Progress Section
  progressSection: {
    marginTop: -15,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  progressCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressLeft: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressRight: {
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: '800',
    color: '#8B5CF6',
    marginBottom: 4,
  },
  progressEmoji: {
    fontSize: 20,
  },
  progressBarContainer: {
    alignItems: 'center',
  },
  progressBar: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 6,
  },
  // Filter Section
  filterSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  activeFilterTab: {
    backgroundColor: '#8B5CF6',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  filterCount: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  activeFilterCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  activeFilterCountText: {
    color: '#FFFFFF',
  },
  // Enhanced Exam Cards
  examsContainer: {
    flex: 1,
  },
  examsContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Extra space for FAB
  },
  subcategorySection: {
    marginBottom: 30,
  },
  subcategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  subcategoryInfo: {
    flex: 1,
  },
  subcategoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  subcategoryTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginRight: 12,
  },
  subcategoryBadge: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  subcategoryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subcategoryCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  subcategoryProgress: {
    alignItems: 'center',
  },
  subcategoryProgressRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  subcategoryProgressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  subcategoryProgressLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  examCardWrapper: {
    marginBottom: 16,
  },
  enhancedExamCard: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  examCardGradient: {
    padding: 24,
  },
  examCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  examLeftSection: {
    flex: 1,
    marginRight: 20,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  examTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
    lineHeight: 24,
  },
  completedExamTitle: {
    color: '#FFFFFF',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  completedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  completedText: {
    color: '#10B981',
  },
  pendingText: {
    color: '#6B7280',
  },
  examMeta: {
    flexDirection: 'row',
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
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
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  startButton: {
    backgroundColor: '#8B5CF6',
  },
  reviewButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  // Floating Action Button
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Loading and Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  refreshButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default ExamCategoryPage; 