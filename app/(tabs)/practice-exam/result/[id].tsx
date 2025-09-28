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
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<number>(0);
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
          fetchLeaderboard();
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
        fetchLeaderboard();
      }
    } catch (e) {
      console.error('Error fetching results:', e);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      if (!user?.token) return;
      const leaderboardRes = await apiFetchAuth(`/student/practice-exams/${id}/leaderboard`, user.token);
      if (leaderboardRes.ok) {
        setLeaderboard(leaderboardRes.data.leaderboard || []);
        setUserRank(leaderboardRes.data.userRank || 0);
      }
    } catch (e) {
      console.error('Error fetching leaderboard:', e);
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
      color: '#059669', 
      icon: 'trophy',
      gradient: ['#ECFDF5', '#D1FAE5'],
      borderColor: '#10B981'
    };
    if (percentage >= 80) return { 
      text: 'Excellent!', 
      color: '#0891B2', 
      icon: 'star',
      gradient: ['#F0F9FF', '#E0F2FE'],
      borderColor: '#06B6D4'
    };
    if (percentage >= 70) return { 
      text: 'Very Good!', 
      color: '#2563EB', 
      icon: 'star-half',
      gradient: ['#EFF6FF', '#DBEAFE'],
      borderColor: '#3B82F6'
    };
    if (percentage >= 60) return { 
      text: 'Good!', 
      color: '#D97706', 
      icon: 'star-half',
      gradient: ['#FFFBEB', '#FEF3C7'],
      borderColor: '#F59E0B'
    };
    if (percentage >= 50) return { 
      text: 'Average', 
      color: '#DC2626', 
      icon: 'star-outline',
      gradient: ['#FEF2F2', '#FEE2E2'],
      borderColor: '#EF4444'
    };
    return { 
      text: 'Keep Practicing!', 
      color: '#EF4444', 
      icon: 'alert-circle',
      gradient: ['#FEF2F2', '#FEE2E2'],
      borderColor: '#EF4444'
    };
  };

  const performance = getPerformanceRating();

  const handleRetakeExam = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    router.back();
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#F8FAFC', '#E2E8F0']}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Analyzing your performance...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
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
              colors={performance.gradient}
              style={[styles.performanceGradient, { borderColor: performance.borderColor }]}
            >
              <View style={styles.performanceHeader}>
                <View style={styles.trophyContainer}>
                  <View style={[styles.trophyIcon, { backgroundColor: performance.color }]}>
                    <Ionicons 
                      name={performance.icon as any} 
                      size={28} 
                      color="#fff" 
                    />
                  </View>
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
                <View style={[styles.scoreCircle, { borderColor: performance.color }]}>
                  <Text style={[styles.scorePercentage, { color: performance.color }]}>
                    {Math.round(percentage)}%
                  </Text>
                  <Text style={styles.scoreLabel}>Score</Text>
                </View>
                <View style={[styles.accuracyCircle, { borderColor: performance.color }]}>
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
              <View style={[styles.statIconContainer, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="checkmark-circle" size={24} color="#059669" />
              </View>
              <Text style={styles.statValue}>{correct}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="close-circle" size={24} color="#DC2626" />
              </View>
              <Text style={styles.statValue}>{incorrect}</Text>
              <Text style={styles.statLabel}>Incorrect</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#F3F4F6' }]}>
                <Ionicons name="remove-circle" size={24} color="#6B7280" />
              </View>
              <Text style={styles.statValue}>{unattempted}</Text>
              <Text style={styles.statLabel}>Unattempted</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="time" size={24} color="#2563EB" />
              </View>
              <Text style={styles.statValue}>{total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>

          {/* Leaderboard Section */}
          {leaderboard.length > 0 && (
            <View style={styles.leaderboardCard}>
              <View style={styles.leaderboardHeader}>
                <Ionicons name="trophy" size={24} color="#F59E0B" />
                <Text style={styles.leaderboardTitle}>Leaderboard</Text>
                {userRank > 0 && (
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>Your Rank: #{userRank}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.leaderboardContent}>
                {leaderboard.slice(0, 5).map((student, index) => (
                  <View key={student.id} style={styles.leaderboardItem}>
                    <View style={styles.rankContainer}>
                      {index < 3 ? (
                        <View style={[styles.rankIcon, { backgroundColor: index === 0 ? '#F59E0B' : index === 1 ? '#6B7280' : '#CD7F32' }]}>
                          <Ionicons name="trophy" size={16} color="#fff" />
                        </View>
                      ) : (
                        <Text style={styles.rankNumber}>{index + 1}</Text>
                      )}
                    </View>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{student.name}</Text>
                      <Text style={styles.studentScore}>{student.score}%</Text>
                    </View>
                    <View style={styles.scoreContainer}>
                      <Text style={styles.scoreText}>{student.marks}</Text>
                      <Text style={styles.scoreLabel}>marks</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Detailed Analysis */}
          <View style={styles.analysisCard}>
            <View style={styles.analysisHeader}>
              <Ionicons name="analytics" size={24} color="#3B82F6" />
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
                    <View style={[styles.distributionDot, { backgroundColor: '#059669' }]} />
                    <Text style={styles.distributionText}>Correct: {correct}</Text>
                  </View>
                  <View style={styles.distributionItem}>
                    <View style={[styles.distributionDot, { backgroundColor: '#DC2626' }]} />
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
                  <Ionicons name="checkmark-circle" size={20} color="#059669" />
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

          {/* Enhanced Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleRetakeExam}
            >
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={styles.primaryButtonGradient}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Retake Exam</Text>
              </LinearGradient>
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
    color: '#475569',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  resultContainer: {
    padding: 20,
  },
  mainPerformanceCard: {
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  performanceGradient: {
    padding: 24,
    borderWidth: 1,
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  trophyContainer: {
    marginRight: 16,
  },
  trophyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  performanceInfo: {
    flex: 1,
  },
  performanceTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  performanceScore: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  performanceSubtext: {
    fontSize: 14,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 60,
    width: 120,
    height: 120,
    justifyContent: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  scorePercentage: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 4,
  },
  accuracyCircle: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    width: 100,
    height: 100,
    justifyContent: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  accuracyPercentage: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  accuracyLabel: {
    fontSize: 10,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  leaderboardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  leaderboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  rankBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rankText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '600',
  },
  leaderboardContent: {
    gap: 12,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
  },
  rankIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  studentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  studentScore: {
    fontSize: 12,
    color: '#6B7280',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  scoreLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  analysisCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
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
    fontSize: 14,
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
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  analysisValue: {
    fontSize: 14,
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'right',
  },
  scoreDistribution: {
    flex: 1,
    marginLeft: 16,
  },
  distributionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  distributionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  distributionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  recommendationsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
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
    marginBottom: 32,
  },
  primaryButton: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
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
});