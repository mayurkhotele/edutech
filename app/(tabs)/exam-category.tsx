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
        
        // Filter exams by the selected category - improved matching
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
        
        // If still no exams found, show all exams for debugging
        if (categoryExams.length === 0) {
          console.log('⚠️ No exams found for category, showing all exams for debugging');
          setExams(response.data);
        } else {
          setExams(categoryExams);
        }
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
  const categoryColors = getGradientColors(category || '');

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
        

        {/* Test Navigation Button */}
        {exams.length > 0 && (
          <View style={styles.testButtonContainer}>
            <TouchableOpacity 
              style={styles.testButton}
              onPress={() => {
                console.log('🎯 Test button pressed');
                handleStartExam(exams[0]);
              }}
            >
              <Text style={styles.testButtonText}>Test Navigation - Click to go to first exam</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Simple Exam List - Always Show */}
        {exams.length > 0 ? (
          <View style={styles.simpleExamListContainer}>
            <Text style={styles.simpleExamListTitle}>Practice Your Exam</Text>
            {exams.map((exam, index) => (
              <Animated.View
                key={exam.id}
                style={[
                  styles.enhancedExamCard,
                  { 
                    opacity: fadeAnim,
                    transform: [{ 
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0]
                      })
                    }]
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.examCardTouchable}
                  onPress={() => {
                    console.log('🎯 Exam card pressed:', exam.title);
                    exam.attempted ? handleReviewExam(exam) : handleStartExam(exam);
                  }}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={exam.attempted ? ['#10B981', '#059669'] : ['#FFFFFF', '#F8FAFC']}
                    style={styles.examCardGradient}
                  >
                    <View style={styles.examCardHeader}>
                      <View style={styles.examCardLeft}>
                        <View style={styles.examIconContainer}>
                          <Ionicons 
                            name={getCategoryIcon(exam.category)} 
                            size={24} 
                            color={exam.attempted ? "#FFFFFF" : "#8B5CF6"} 
                          />
                        </View>
                        <View style={styles.examInfo}>
                          <Text style={[
                            styles.examTitle,
                            exam.attempted && styles.completedExamTitle
                          ]}>
                            {exam.title}
                          </Text>
                          <Text style={[
                            styles.examSubcategory,
                            exam.attempted && styles.completedExamSubcategory
                          ]}>
                            {exam.subcategory}
                          </Text>
                          <Text style={[
                            styles.examCategory,
                            exam.attempted && styles.completedExamCategory
                          ]}>
                            {exam.category}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.examCardRight}>
                        <View style={[
                          styles.examStatusBadge,
                          exam.attempted ? styles.completedBadge : styles.pendingBadge
                        ]}>
                          <Ionicons 
                            name={exam.attempted ? "checkmark-circle" : "play-circle"} 
                            size={20} 
                            color={exam.attempted ? "#10B981" : "#8B5CF6"} 
                          />
                          <Text style={[
                            styles.examStatusText,
                            exam.attempted ? styles.completedStatusText : styles.pendingStatusText
                          ]}>
                            {exam.attempted ? 'Completed' : 'Start Exam'}
                          </Text>
                        </View>
                        <View style={styles.examActionButton}>
                          <Ionicons 
                            name="arrow-forward" 
                            size={16} 
                            color={exam.attempted ? "#10B981" : "#8B5CF6"} 
                          />
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
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
        
        {/* Original Grouped Exam Section */}
        {Object.keys(groupedExams).length > 0 ? (
          Object.entries(groupedExams).map(([subcategory, subcategoryExams], sectionIndex) => {
          const subcategoryProgress = subcategoryExams.length > 0 
            ? (subcategoryExams.filter(exam => exam.attempted).length / subcategoryExams.length) * 100 
            : 0;
          
          return (
            <View 
              key={subcategory} 
              style={styles.subcategorySection}
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

              {subcategoryExams.map((exam, index) => {
                console.log(`🎯 Rendering exam: ${exam.title} (${exam.id})`);
                return (
                  <Animated.View
                    key={exam.id}
                    style={[
                      styles.examCardWrapper,
                      { 
                        opacity: fadeAnim,
                        transform: [{ 
                          translateY: slideAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0]
                          })
                        }]
                      }
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.enhancedExamCard}
                      onPress={() => exam.attempted ? handleReviewExam(exam) : handleStartExam(exam)}
                      activeOpacity={0.7}
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
                );
              })}
            </View>
          );
        })
        ) : (
          /* Fallback: Show exams directly if no grouping */
          exams.length > 0 && (
            <View style={styles.fallbackContainer}>
              <Text style={styles.fallbackTitle}>Available Exams</Text>
              {exams.map((exam, index) => (
                <TouchableOpacity
                  key={exam.id}
                  style={styles.simpleExamCard}
                  onPress={() => exam.attempted ? handleReviewExam(exam) : handleStartExam(exam)}
                >
                  <Text style={styles.simpleExamTitle}>{exam.title}</Text>
                  <Text style={styles.simpleExamSubcategory}>{exam.subcategory}</Text>
                  <Text style={styles.simpleExamStatus}>
                    {exam.attempted ? 'Completed' : 'Available'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )
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
  // Enhanced Exam List styles
  simpleExamListContainer: {
    padding: 20,
  },
  simpleExamListTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  enhancedExamCard: {
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  examCardTouchable: {
    borderRadius: 20,
    overflow: 'hidden',
    flex: 1,
  },
  examCardGradient: {
    padding: 24,
    borderRadius: 20,
  },
  examCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  examCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  examIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  examInfo: {
    flex: 1,
  },
  examTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
    lineHeight: 26,
  },
  completedExamTitle: {
    color: '#FFFFFF',
  },
  examSubcategory: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  completedExamSubcategory: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  examCategory: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  completedExamCategory: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  examCardRight: {
    alignItems: 'flex-end',
    gap: 12,
  },
  examStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
  },
  completedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  examStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  completedStatusText: {
    color: '#FFFFFF',
  },
  pendingStatusText: {
    color: '#8B5CF6',
  },
  examActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
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
  simpleExamCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  simpleExamTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  simpleExamSubcategory: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  simpleExamStatus: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8B5CF6',
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