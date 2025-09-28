import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function PracticeExamResultScreen() {
  const { id, resultData } = useLocalSearchParams<{ id: string, resultData?: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<{ [qid: string]: number | undefined }>({});
  const [timeData, setTimeData] = useState<{ [qid: string]: number }>({});
  const [actualResult, setActualResult] = useState<any>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    if (!id) return;
    loadResultData();
  }, [id, resultData]);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  const loadResultData = () => {
    setLoading(true);
    try {
      if (resultData) {
        const submitResponse = JSON.parse(resultData);
        console.log('Submit response data:', submitResponse);
        
        if (submitResponse.result) {
          setActualResult(submitResponse.result);
          setQuestions([{
            id: 'result',
            marks: submitResponse.result.totalMarks,
            correct: 1,
            difficulty: 'medium',
            topic: 'Practice Exam'
          }]);
          setUserAnswers({ 'result': submitResponse.result.correctAnswers });
          setTimeData({ 'result': 0 });
        }
      } else {
        fetchResults();
      }
    } catch (e) {
      console.error('Error loading result data:', e);
      fetchResults();
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    try {
      if (!user?.token) return;
      const resultRes = await apiFetchAuth(`/student/practice-exams/${id}/result`, user.token);
      if (resultRes.ok) {
        const resultData = resultRes.data.result;
        setActualResult(resultData);
        setQuestions([{
          id: 'result',
          marks: resultData.totalMarks,
          correct: 1,
          difficulty: 'medium',
          topic: 'Practice Exam'
        }]);
        setUserAnswers({ 'result': resultData.correctAnswers });
        setTimeData({ 'result': 0 });
      }
    } catch (e) {
      console.error('Error fetching results:', e);
    }
  };

  // Calculate results
  let total = actualResult ? actualResult.totalQuestions : questions.length;
  let correct = actualResult ? actualResult.correctAnswers : 0;
  let incorrect = actualResult ? actualResult.wrongAnswers : 0;
  let unattempted = actualResult ? actualResult.unattempted : 0;
  let totalMarks = actualResult ? actualResult.totalMarks : 0;
  let score = actualResult ? actualResult.earnedMarks : 0;
  let totalTime = 0;
  let avgTime = 0;

  if (!actualResult) {
    total = questions.length;
    correct = 0;
    incorrect = 0;
    unattempted = 0;
    totalMarks = 0;
    score = 0;
    totalTime = 0;
    
    questions.forEach(q => {
      totalMarks += q.marks || 1;
      const userAns = userAnswers[q.id];
      const timeSpent = timeData[q.id] || 0;
      totalTime += timeSpent;

      if (userAns === undefined) unattempted++;
      else if (userAns === q.correct) { 
        correct++; 
        score += q.marks || 1; 
      } else incorrect++;
    });
    
    avgTime = total > 0 ? totalTime / total : 0;
  }

  const accuracy = total > 0 ? (correct / total) * 100 : 0;
  const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;

  const getPerformanceRating = () => {
    if (percentage >= 90) return { 
      text: 'Outstanding!', 
      color: '#10B981', 
      icon: 'trophy',
      gradient: ['#10B981', '#059669'],
      bgGradient: ['#F0FDF4', '#DCFCE7']
    };
    if (percentage >= 80) return { 
      text: 'Excellent!', 
      color: '#06B6D4', 
      icon: 'star',
      gradient: ['#06B6D4', '#0891B2'],
      bgGradient: ['#F0F9FF', '#E0F2FE']
    };
    if (percentage >= 70) return { 
      text: 'Very Good!', 
      color: '#3B82F6', 
      icon: 'star-half',
      gradient: ['#3B82F6', '#2563EB'],
      bgGradient: ['#EFF6FF', '#DBEAFE']
    };
    if (percentage >= 60) return { 
      text: 'Good!', 
      color: '#F59E0B', 
      icon: 'star-half',
      gradient: ['#F59E0B', '#D97706'],
      bgGradient: ['#FFFBEB', '#FEF3C7']
    };
    if (percentage >= 50) return { 
      text: 'Average', 
      color: '#EF4444', 
      icon: 'star-outline',
      gradient: ['#EF4444', '#DC2626'],
      bgGradient: ['#FEF2F2', '#FEE2E2']
    };
    return { 
      text: 'Keep Practicing!', 
      color: '#FF6B6B', 
      icon: 'alert-circle',
      gradient: ['#FF6B6B', '#EF4444'],
      bgGradient: ['#FEF2F2', '#FEE2E2']
    };
  };

  const performance = getPerformanceRating();

  const handleRetakeExam = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    router.back();
  };

  const handleViewSolutions = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    // Navigate to solutions screen
  };

  const handleShareResults = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    // Share functionality
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Analyzing your performance...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Exam Results</Text>
            <Text style={styles.headerSubtitle}>Practice Exam Analysis</Text>
          </View>
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={handleShareResults}
          >
            <Ionicons name="share-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View 
          style={[
            styles.resultContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Main Performance Card */}
          <View style={styles.mainPerformanceCard}>
            <LinearGradient
              colors={performance.bgGradient}
              style={styles.performanceGradient}
            >
              <View style={styles.performanceHeader}>
                <View style={styles.trophyContainer}>
                  <LinearGradient
                    colors={performance.gradient}
                    style={styles.trophyGradient}
                  >
                    <Ionicons 
                      name={performance.icon as any} 
                      size={32} 
                      color="#fff" 
                    />
                  </LinearGradient>
                </View>
                <View style={styles.performanceInfo}>
                  <Text style={[styles.performanceTitle, { color: performance.color }]}>
                    {performance.text}
                  </Text>
                  <Text style={styles.performanceScore}>{percentage.toFixed(1)}%</Text>
                  <Text style={styles.performanceSubtext}>
                    {score} out of {totalMarks} marks
                  </Text>
                </View>
              </View>

              {/* Score Circle */}
              <View style={styles.scoreCircleContainer}>
                <View style={styles.scoreCircle}>
                  <Text style={[styles.scorePercentage, { color: performance.color }]}>
                    {Math.round(percentage)}%
                  </Text>
                  <Text style={styles.scoreLabel}>Score</Text>
                </View>
                <View style={styles.accuracyCircle}>
                  <Text style={[styles.accuracyPercentage, { color: performance.color }]}>
                    {Math.round(accuracy)}%
                  </Text>
                  <Text style={styles.accuracyLabel}>Accuracy</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Quick Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.statGradient}
              >
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.statValue}>{correct}</Text>
                <Text style={styles.statLabel}>Correct</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={styles.statGradient}
              >
                <Ionicons name="close-circle" size={24} color="#fff" />
                <Text style={styles.statValue}>{incorrect}</Text>
                <Text style={styles.statLabel}>Incorrect</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#6B7280', '#4B5563']}
                style={styles.statGradient}
              >
                <Ionicons name="remove-circle" size={24} color="#fff" />
                <Text style={styles.statValue}>{unattempted}</Text>
                <Text style={styles.statLabel}>Unattempted</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={styles.statGradient}
              >
                <Ionicons name="time" size={24} color="#fff" />
                <Text style={styles.statValue}>{total}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Detailed Analysis */}
          <View style={styles.analysisCard}>
            <View style={styles.analysisHeader}>
              <Ionicons name="analytics" size={24} color="#667eea" />
              <Text style={styles.analysisTitle}>Performance Analysis</Text>
            </View>
            
            <View style={styles.analysisContent}>
              <View style={styles.analysisRow}>
                <Text style={styles.analysisLabel}>Accuracy Rate</Text>
                <View style={styles.analysisValueContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${accuracy}%`,
                          backgroundColor: performance.color
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.analysisValue, { color: performance.color }]}>
                    {accuracy.toFixed(1)}%
                  </Text>
                </View>
              </View>
              
              <View style={styles.analysisRow}>
                <Text style={styles.analysisLabel}>Score Distribution</Text>
                <View style={styles.scoreDistribution}>
                  <View style={styles.distributionItem}>
                    <View style={[styles.distributionDot, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.distributionText}>Correct: {correct}</Text>
                  </View>
                  <View style={styles.distributionItem}>
                    <View style={[styles.distributionDot, { backgroundColor: '#EF4444' }]} />
                    <Text style={styles.distributionText}>Incorrect: {incorrect}</Text>
                  </View>
                  <View style={styles.distributionItem}>
                    <View style={[styles.distributionDot, { backgroundColor: '#6B7280' }]} />
                    <Text style={styles.distributionText}>Unattempted: {unattempted}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Recommendations */}
          <View style={styles.recommendationsCard}>
            <View style={styles.recommendationsHeader}>
              <Ionicons name="bulb" size={24} color="#F59E0B" />
              <Text style={styles.recommendationsTitle}>Recommendations</Text>
            </View>
            
            <View style={styles.recommendationsContent}>
              {percentage >= 80 ? (
                <View style={styles.recommendationItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={styles.recommendationText}>
                    Excellent performance! Keep up the great work and continue practicing.
                  </Text>
                </View>
              ) : percentage >= 60 ? (
                <View style={styles.recommendationItem}>
                  <Ionicons name="trending-up" size={20} color="#3B82F6" />
                  <Text style={styles.recommendationText}>
                    Good attempt! Focus on weak areas and practice more questions.
                  </Text>
                </View>
              ) : (
                <View style={styles.recommendationItem}>
                  <Ionicons name="refresh" size={20} color="#F59E0B" />
                  <Text style={styles.recommendationText}>
                    Keep practicing! Review the concepts and try again.
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleRetakeExam}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.primaryButtonGradient}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Retake Exam</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={handleViewSolutions}
            >
              <Ionicons name="document-text" size={20} color="#667eea" />
              <Text style={styles.secondaryButtonText}>View Solutions</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  shareButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flex: 1,
  },
  resultContainer: {
    padding: 20,
  },
  mainPerformanceCard: {
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  performanceGradient: {
    padding: 24,
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  trophyContainer: {
    marginRight: 16,
  },
  trophyGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  performanceInfo: {
    flex: 1,
  },
  performanceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  performanceScore: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  performanceSubtext: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  scoreCircleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  scoreCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 60,
    width: 120,
    height: 120,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scorePercentage: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 4,
  },
  accuracyCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 50,
    width: 100,
    height: 100,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  accuracyPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  accuracyLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  analysisCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
  },
  analysisContent: {
    gap: 16,
  },
  analysisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  analysisLabel: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  analysisValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 16,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  analysisValue: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 50,
    textAlign: 'right',
  },
  scoreDistribution: {
    flex: 1,
    marginLeft: 16,
  },
  distributionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  distributionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  distributionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  recommendationsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
  },
  recommendationsContent: {
    gap: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recommendationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  primaryButton: {
    flex: 1,
    marginRight: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButton: {
    flex: 1,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#667eea',
    backgroundColor: '#fff',
  },
  secondaryButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});