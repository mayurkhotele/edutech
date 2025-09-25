import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
  
  // Get category colors early
  const categoryColors = getGradientColors(category || '');
  

  useEffect(() => {
    console.log('🔍 ExamCategoryPage mounted with category:', category);
    if (category) {
      fetchExamsByCategory();
    } else {
      console.log('❌ No category provided!');
      setLoading(false);
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
        console.log('📊 Total exams received:', response.data.length);
        console.log('📊 Looking for category:', category);
        console.log('📊 Available categories:', [...new Set(response.data.map((exam: PracticeExam) => exam.category))]);
        
        // Filter exams by the selected category
        let categoryExams = response.data.filter((exam: PracticeExam) => {
          const examCategory = exam.category.toLowerCase().trim();
          const searchCategory = category.toLowerCase().trim();
          console.log(`📊 Comparing: "${examCategory}" === "${searchCategory}"`);
          
          // Exact match
          if (examCategory === searchCategory) {
            console.log(`✅ Exact match found for: ${exam.title}`);
            return true;
          }
          
          // Handle common typos and variations
          const categoryMappings: { [key: string]: string[] } = {
            'science': ['sceinecr', 'sci', 'sciences'],
            'english': ['eng', 'englis'],
            'math': ['mathematics', 'maths'],
            'history': ['hist', 'histories']
          };
          
          // Check if search category has mappings
          if (categoryMappings[searchCategory]) {
            const hasMatch = categoryMappings[searchCategory].includes(examCategory);
            if (hasMatch) {
              console.log(`✅ Mapped match found for: ${exam.title}`);
              return true;
            }
          }
          
          // Check if exam category has mappings
          Object.keys(categoryMappings).forEach(key => {
            if (categoryMappings[key].includes(examCategory) && key === searchCategory) {
              console.log(`✅ Reverse mapped match found for: ${exam.title}`);
              return true;
            }
          });
          
          return false;
        });
        
        // If still no match, try partial matching
        if (categoryExams.length === 0) {
          console.log('📊 No exact match found, trying partial matching...');
          categoryExams = response.data.filter((exam: PracticeExam) => {
            const examCategory = exam.category.toLowerCase().trim();
            const searchCategory = category.toLowerCase().trim();
            const partialMatch = examCategory.includes(searchCategory) || searchCategory.includes(examCategory);
            if (partialMatch) {
              console.log(`✅ Partial match found for: ${exam.title}`);
            }
            return partialMatch;
          });
        }
        
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


  const handleStartExam = (exam: PracticeExam) => {
    console.log('🎯 Starting exam:', exam.title, 'ID:', exam.id);
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

  if (!category) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyCard}>
            <Ionicons name="alert-circle-outline" size={80} color="#EF4444" />
            <Text style={styles.emptyTitle}>Invalid Category</Text>
            <Text style={styles.emptySubtext}>
              No category was provided. Please go back and select a category.
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              <Text style={styles.refreshButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
        {/* Header for empty state */}
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
                No exams available
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.emptyContainer}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
            <View style={styles.emptyCard}>
              <Ionicons name="library-outline" size={80} color="#8B5CF6" />
              <Text style={styles.emptyTitle}>No {category} Exams Available</Text>
              <Text style={styles.emptySubtext}>
                There are currently no practice exams available for {category}. Check back later for new exams.
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
  
  // Check if we're showing all exams (debugging mode)
  const isShowingAllExams = exams.length > 0 && !exams.every(exam => 
    exam.category.toLowerCase().trim() === category?.toLowerCase().trim()
  );
  const overallProgress = totalExams > 0 ? (attemptedExams / totalExams) * 100 : 0;

  return (
    <SafeAreaView style={styles.container}>


      {/* Enhanced Filter Tabs */}
      <Animated.View 
        style={[
          styles.filterSection,
          { 
            opacity: fadeAnim, 
            transform: [{ 
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0]
              })
            }] 
          }
        ]}
      >
        <View style={styles.filterContainer}>
          <Text style={styles.filterSectionTitle}>Filter Exams</Text>
          <View style={styles.filterTabsRow}>
            {[
              { key: 'all', label: 'All', count: totalExams, icon: 'list' },
              { key: 'completed', label: 'Completed', count: attemptedExams, icon: 'checkmark-circle' },
              { key: 'pending', label: 'Pending', count: totalExams - attemptedExams, icon: 'time' }
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterTab,
                  selectedFilter === filter.key && styles.activeFilterTab
                ]}
                onPress={() => setSelectedFilter(filter.key as any)}
                activeOpacity={0.8}
              >
                <View style={styles.filterTabContent}>
                  <Ionicons 
                    name={filter.icon as any} 
                    size={16} 
                    color={selectedFilter === filter.key ? '#FFFFFF' : '#6B7280'} 
                  />
                  <Text style={[
                    styles.filterText,
                    selectedFilter === filter.key && styles.activeFilterText
                  ]}>
                    {filter.label}
                  </Text>
                </View>
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
        


        {/* Enhanced Header Section */}
        <LinearGradient
          colors={[...categoryColors, '#A855F7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.enhancedHeader}
        >
          <View style={styles.enhancedHeaderContent}>
            <TouchableOpacity 
              style={styles.enhancedBackButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.enhancedHeaderInfo}>
              <View style={styles.enhancedCategoryIcon}>
                <Ionicons name={getCategoryIcon(category || '')} size={28} color="#FFFFFF" />
          </View>
              <Text style={styles.enhancedCategoryTitle}>{category}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Stats Section */}
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          style={styles.statsSection}
        >
          <View style={styles.statsRow}>
            <LinearGradient
              colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
              style={styles.statItemGradient}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
                style={styles.statIconContainer}
              >
                <Ionicons name="library" size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.statValue}>{exams.length}</Text>
              <Text style={styles.statLabel}>Total Exams</Text>
            </LinearGradient>
            
            <LinearGradient
              colors={['#10B981', '#059669', '#047857']}
              style={styles.statItemGradient}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
                style={styles.statIconContainer}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.statValue}>{attemptedExams}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </LinearGradient>
            
            <LinearGradient
              colors={['#F59E0B', '#D97706', '#B45309']}
              style={styles.statItemGradient}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
                style={styles.statIconContainer}
              >
                <Ionicons name="time" size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.statValue}>{exams.length - attemptedExams}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </LinearGradient>
          </View>
        </LinearGradient>

        {/* Enhanced Exam List */}
        {exams.length > 0 ? (
          <View style={styles.enhancedExamListContainer}>
            <View style={styles.examListHeader}>
              <Text style={styles.examListTitle}>Practice Your Exam</Text>
            </View>
            
            {exams.map((exam, index) => (
              <View
                key={exam.id}
                style={[
                  styles.enhancedExamCard,
                  exam.attempted && styles.completedExamCard
                ]}
              >
                <TouchableOpacity
                  style={styles.enhancedExamCardTouchable}
                  onPress={() => {
                    console.log('🎯 Exam card pressed:', exam.title);
                    exam.attempted ? handleReviewExam(exam) : handleStartExam(exam);
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={exam.attempted ? ['#F0FDF4', '#FFFFFF', '#F8FAFC'] : ['#FFFFFF', '#F8FAFC', '#F1F5F9']}
                    style={styles.examCardGradient}
                  >
                    {/* Card Header */}
                    <View style={styles.enhancedExamHeader}>
                      <View style={styles.examLeftSection}>
                        <LinearGradient
                          colors={exam.attempted ? ['#10B981', '#059669'] : ['#4F46E5', '#7C3AED']}
                          style={[
                            styles.enhancedExamIcon,
                            exam.attempted && styles.completedExamIcon
                          ]}
                        >
                          <Ionicons 
                            name={getCategoryIcon(exam.category)} 
                            size={24} 
                            color="#FFFFFF" 
                          />
                        </LinearGradient>
                        <View style={styles.examInfoSection}>
                          <Text style={[
                            styles.enhancedExamTitle,
                            exam.attempted && styles.completedExamTitle
                          ]}>
                            {exam.title}
                          </Text>
                          <Text style={[
                            styles.enhancedExamSubcategory,
                            exam.attempted && styles.completedExamSubcategory
                          ]}>
                            {exam.subcategory}
                          </Text>
                          <LinearGradient
                            colors={exam.attempted ? ['#10B981', '#059669'] : ['#4F46E5', '#7C3AED']}
                            style={styles.categoryTag}
                          >
                            <Text style={[
                                styles.categoryTagText,
                                exam.attempted && styles.completedCategoryTagText
                            ]}>
                              {exam.category}
                            </Text>
                          </LinearGradient>
                      </View>
                        </View>
                      
                        </View>

                    {/* Exam Details Row */}
                    <View style={styles.enhancedExamDetails}>
                      <View style={styles.detailItem}>
                        <View style={styles.detailIconContainer}>
                          <Ionicons name="calendar" size={16} color="#6B7280" />
                      </View>
                        <Text style={styles.detailText}>
                          {formatDate(exam.startTime)}
            </Text>
          </View>
                      
                      <View style={styles.detailItem}>
                        <View style={styles.detailIconContainer}>
                          <Ionicons name="people" size={16} color="#6B7280" />
                    </View>
                        <Text style={styles.detailText}>
                          {exam.spotsLeft}/{exam.spots} spots
                  </Text>
              </View>

                      <View style={styles.detailItem}>
                        <View style={styles.detailIconContainer}>
                          <Ionicons name="time" size={16} color="#6B7280" />
                            </View>
                        <Text style={styles.detailText}>
                          Practice
                              </Text>
                          </View>
                        </View>
                        
                    {/* Action Button */}
                    <View style={styles.enhancedActionContainer}>
                      <LinearGradient
                        colors={exam.attempted ? ['#10B981', '#059669'] : ['#8B5CF6', '#7C3AED']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.enhancedActionButton}
                          >
                            <Ionicons 
                              name={exam.attempted ? "eye" : "play"} 
                              size={18} 
                              color="#FFFFFF" 
                            />
                        <Text style={styles.enhancedActionText}>
                          {exam.attempted ? 'Review Results' : 'Start Exam'}
                            </Text>
                        <Ionicons 
                          name="arrow-forward" 
                          size={16} 
                          color="#FFFFFF" 
                        />
                      </LinearGradient>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
            </View>
            ))}
          </View>
        ) : (
          <View style={styles.noExamsContainer}>
            <Text style={styles.noExamsTitle}>No Exams Found</Text>
            <Text style={styles.noExamsText}>
              No exams available for {category} category.
                  </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.refreshButtonText}>Refresh</Text>
                </TouchableOpacity>
            </View>
        )}
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
    position: 'relative',
    overflow: 'hidden',
  },
  headerPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  floatingCircle1: {
    position: 'absolute',
    top: 20,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  floatingCircle2: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
    textAlign: 'center',
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
  progressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressRight: {
    alignItems: 'center',
  },
  progressPercentageContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 4,
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
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressLabelStart: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressLabelEnd: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
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
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  filterTabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
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
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 4,
  },
  filterTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  // Fallback styles
  fallbackContainer: {
    padding: 16,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  // Debug styles
  debugContainer: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  debugText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
    marginBottom: 4,
  },
  // No exams styles
  noExamsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  noExamsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  noExamsText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  // Test button styles
  testButtonContainer: {
    padding: 16,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Enhanced Header Styles
  enhancedHeader: {
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  enhancedHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  enhancedBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  enhancedHeaderInfo: {
    flex: 1,
    alignItems: 'center',
  },
  enhancedCategoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  enhancedCategoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  enhancedCategorySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
    textAlign: 'center',
  },
  // Stats Section
  statsSection: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  statItemGradient: {
    alignItems: 'center',
    flex: 1,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textAlign: 'center',
  },
  // Enhanced Exam List
  enhancedExamListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  examListHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  examListTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: 0.3,
    lineHeight: 26,
  },
  examCountBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  examCountText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  enhancedExamCard: {
    marginBottom: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  completedExamCard: {
    borderWidth: 2,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOpacity: 0.2,
  },
  enhancedExamCardTouchable: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  examCardGradient: {
    padding: 24,
  },
  enhancedExamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingHorizontal: 6,
  },
  examLeftSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    paddingRight: 16,
  },
  enhancedExamIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  completedExamIcon: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    shadowColor: '#10B981',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  completedExamTitle: {
    color: '#10B981',
  },
  completedExamSubcategory: {
    color: '#059669',
  },
  examInfoSection: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  enhancedExamTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 10,
    lineHeight: 28,
    letterSpacing: 0.4,
  },
  enhancedExamSubcategory: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
    fontWeight: '500',
    lineHeight: 22,
  },
  categoryTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryTagText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  completedCategoryTagText: {
    color: '#FFFFFF',
  },
  enhancedStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  completedStatusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    shadowColor: '#10B981',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  pendingStatusBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    shadowColor: '#F59E0B',
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  enhancedStatusText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
    color: '#F59E0B',
    letterSpacing: 0.2,
  },
  completedStatusText: {
    color: '#10B981',
  },
  pendingStatusText: {
    color: '#F59E0B',
  },
  enhancedExamDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
    paddingHorizontal: 12,
    paddingVertical: 20,
    backgroundColor: 'rgba(249, 250, 251, 0.9)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  detailIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.5)',
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  enhancedActionContainer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  enhancedActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 18,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    minWidth: 220,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  enhancedActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginHorizontal: 10,
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  // Test card styles
  testCard: {
    backgroundColor: '#E0F2FE',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0891B2',
  },
  testCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0C4A6E',
    marginBottom: 8,
  },
  testCardText: {
    fontSize: 14,
    color: '#0C4A6E',
    marginBottom: 4,
  },
});

export default ExamCategoryPage; 