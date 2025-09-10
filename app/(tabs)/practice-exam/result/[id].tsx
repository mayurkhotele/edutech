import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function PracticeExamResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<{ [qid: string]: number | undefined }>({});
  const [timeData, setTimeData] = useState<{ [qid: string]: number }>({});

  useEffect(() => {
    if (!id || !user?.token) return;
    fetchResults();
  }, [id, user?.token]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      if (!user?.token) return;
      const res = await apiFetchAuth(`/student/practice-exams/${id}/questions-with-answers`, user.token);
      if (res.ok) {
        setQuestions(res.data.questions || res.data);
        setUserAnswers(res.data.userAnswers || {});
        setTimeData(res.data.timeData || {});
      }
    } catch (e) {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  // Calculate comprehensive analytics
  const total = questions.length;
  let correct = 0, incorrect = 0, unattempted = 0, totalMarks = 0, score = 0;
  let totalTime = 0, avgTime = 0;
  const difficultyStats = { easy: 0, medium: 0, hard: 0 };
  const topicStats: { [topic: string]: { correct: number, total: number } } = {};

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

    // Difficulty analysis
    if (q.difficulty === 'easy') difficultyStats.easy++;
    else if (q.difficulty === 'medium') difficultyStats.medium++;
    else if (q.difficulty === 'hard') difficultyStats.hard++;

    // Topic analysis
    if (q.topic) {
      if (!topicStats[q.topic]) topicStats[q.topic] = { correct: 0, total: 0 };
      topicStats[q.topic].total++;
      if (userAns === q.correct) topicStats[q.topic].correct++;
    }
  });

  avgTime = total > 0 ? totalTime / total : 0;
  const accuracy = total > 0 ? (correct / total) * 100 : 0;
  const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;

  // Performance rating
  const getPerformanceRating = () => {
    if (percentage >= 90) return { text: 'Excellent', color: '#10B981', icon: 'star' };
    if (percentage >= 80) return { text: 'Very Good', color: '#06B6D4', icon: 'star' };
    if (percentage >= 70) return { text: 'Good', color: '#3B82F6', icon: 'star-half' };
    if (percentage >= 60) return { text: 'Average', color: '#F59E0B', icon: 'star-half' };
    if (percentage >= 50) return { text: 'Below Average', color: '#EF4444', icon: 'star-outline' };
    return { text: 'Needs Improvement', color: '#FF6B6B', icon: 'alert-circle' };
  };

  const performance = getPerformanceRating();

  // Chart data
  const accuracyData = [
    { label: 'Correct', value: correct, color: '#10B981' },
    { label: 'Incorrect', value: incorrect, color: '#EF4444' },
    { label: 'Unattempted', value: unattempted, color: '#6B7280' }
  ];

  const difficultyData = [
    { label: 'Easy', value: difficultyStats.easy, color: '#10B981' },
    { label: 'Medium', value: difficultyStats.medium, color: '#F59E0B' },
    { label: 'Hard', value: difficultyStats.hard, color: '#EF4444' }
  ];

  const renderBarChart = (data: any[], title: string, maxValue: number) => (
    <View style={styles.superChartContainer}>
      <View style={styles.superBarChartContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.superEnhancedBarRow}>
            <View style={styles.superBarLabelContainer}>
              <View style={styles.superBarColorIndicator}>
                <LinearGradient
                  colors={[item.color, item.color + '80']}
                  style={styles.colorIndicatorGradient}
                />
              </View>
              <Text style={styles.superBarLabel}>{item.label}</Text>
              <View style={styles.barLabelBadge}>
                <Text style={styles.barLabelBadgeText}>
                  {maxValue > 0 ? ((item.value / maxValue) * 100).toFixed(1) : 0}%
                </Text>
              </View>
            </View>
            <View style={styles.superBarContainer}>
              <View style={styles.barBackground}>
                <LinearGradient
                  colors={[item.color, item.color + 'CC', item.color + '80']}
                  style={[
                    styles.superEnhancedBar,
                    { width: `${Math.max((item.value / maxValue) * 100, 8)}%` }
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                <View style={styles.barGlow} />
              </View>
              <View style={styles.superBarValueContainer}>
                <Text style={styles.superBarValue}>{item.value}</Text>
                <Text style={styles.superBarSubtext}>questions</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderCircularProgress = (percentage: number, size: number = 80) => {
    const radius = size / 2 - 4;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <View style={[styles.circularContainer, { width: size, height: size }]}>
        <View style={[styles.circularBackground, { width: size, height: size, borderRadius: size / 2 }]} />
        <View 
          style={[
            styles.circularProgress,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: 4,
              borderColor: performance.color,
              borderTopColor: 'transparent',
              borderRightColor: 'transparent',
              transform: [{ rotate: '-90deg' }]
            }
          ]}
        />
        <View style={styles.circularText}>
          <Text style={[styles.circularPercentage, { color: performance.color }]}>{Math.round(percentage)}%</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading your results...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Enhanced Performance Overview Card */}
      <View style={[
        styles.overviewCard,
        performance.text === 'Needs Improvement' && styles.needsImprovementCard
      ]}>
        <LinearGradient
          colors={performance.text === 'Needs Improvement' 
            ? ['#FEF2F2', '#FEE2E2']
            : ['#F0F9FF', '#E0F2FE']
          }
          style={styles.overviewGradient}
        >
          <View style={styles.performanceHeader}>
            <View style={styles.trophyContainer}>
              <LinearGradient
                colors={performance.text === 'Needs Improvement' 
                  ? ['#EF4444', '#DC2626']
                  : performance.text === 'Excellent'
                  ? ['#10B981', '#059669']
                  : performance.text === 'Very Good'
                  ? ['#06B6D4', '#0891B2']
                  : performance.text === 'Good'
                  ? ['#3B82F6', '#2563EB']
                  : performance.text === 'Average'
                  ? ['#F59E0B', '#D97706']
                  : ['#EF4444', '#DC2626']
                }
                style={styles.trophyGradient}
              >
                <Ionicons 
                  name={performance.icon as any} 
                  size={40} 
                  color="#fff" 
                />
              </LinearGradient>
            </View>
            <View style={[
              styles.performanceInfo,
              performance.text === 'Needs Improvement' && styles.needsImprovementBackground
            ]}>
              <Text style={[
                styles.performanceTitle,
                performance.text === 'Needs Improvement' && styles.needsImprovementText,
                performance.text === 'Excellent' && styles.excellentText,
                performance.text === 'Very Good' && styles.veryGoodText,
                performance.text === 'Good' && styles.goodText,
                performance.text === 'Average' && styles.averageText,
                performance.text === 'Below Average' && styles.belowAverageText
              ]}>{performance.text}</Text>
              <Text style={[
                styles.performanceScore,
                performance.text === 'Needs Improvement' && styles.needsImprovementScore,
                performance.text === 'Excellent' && styles.excellentScore,
                performance.text === 'Very Good' && styles.veryGoodScore,
                performance.text === 'Good' && styles.goodScore,
                performance.text === 'Average' && styles.averageScore,
                performance.text === 'Below Average' && styles.belowAverageScore
              ]}>{percentage.toFixed(1)}%</Text>
              <Text style={styles.performanceSubtext}>
                {score} out of {totalMarks} marks
              </Text>
            </View>
          </View>
          
          {/* Enhanced Accuracy Circle */}
          <View style={styles.accuracySection}>
            <View style={styles.accuracyContainer}>
              {renderCircularProgress(accuracy, 100)}
              <View style={styles.accuracyInfo}>
                <Text style={styles.accuracyLabel}>Accuracy</Text>
                <Text style={styles.accuracyValue}>{accuracy.toFixed(1)}%</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Enhanced Quick Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <LinearGradient
            colors={['rgba(16, 185, 129, 0.6)', 'rgba(5, 150, 105, 0.5)']}
            style={styles.statGradient}
          >
            <View style={styles.statIconContainer}>
              <Ionicons name="checkmark-circle" size={28} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{correct}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </LinearGradient>
        </View>
        <View style={styles.statCard}>
          <LinearGradient
            colors={['rgba(239, 68, 68, 0.6)', 'rgba(220, 38, 38, 0.5)']}
            style={styles.statGradient}
          >
            <View style={styles.statIconContainer}>
              <Ionicons name="close-circle" size={28} color="#EF4444" />
            </View>
            <Text style={styles.statValue}>{incorrect}</Text>
            <Text style={styles.statLabel}>Incorrect</Text>
          </LinearGradient>
        </View>
        <View style={styles.statCard}>
          <LinearGradient
            colors={['rgba(168, 85, 247, 0.6)', 'rgba(147, 51, 234, 0.5)']}
            style={styles.statGradient}
          >
            <View style={styles.statIconContainer}>
              <Ionicons name="remove-circle" size={28} color="#A855F7" />
            </View>
            <Text style={styles.statValue}>{unattempted}</Text>
            <Text style={styles.statLabel}>Unattempted</Text>
          </LinearGradient>
        </View>
        <View style={styles.statCard}>
          <LinearGradient
            colors={['rgba(59, 130, 246, 0.6)', 'rgba(37, 99, 235, 0.5)']}
            style={styles.statGradient}
          >
            <View style={styles.statIconContainer}>
              <Ionicons name="time" size={28} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>
              {Math.floor(avgTime / 60)}m {Math.floor(avgTime % 60)}s
            </Text>
            <Text style={styles.statLabel}>Avg Time</Text>
          </LinearGradient>
        </View>
      </View>

      {/* Detailed Analysis */}
      <View style={styles.analysisSection}>
        <Text style={styles.sectionTitle}>Detailed Analysis</Text>
        
        {/* Super Enhanced Answer Distribution Chart */}
        <View style={styles.superEnhancedChartCard}>
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFC', '#F1F5F9']}
            style={styles.superChartGradient}
          >
            <View style={styles.superChartHeader}>
              <View style={styles.superChartIconContainer}>
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  style={styles.iconGradient}
                >
                  <Ionicons name="analytics" size={28} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <View style={styles.superChartTitleContainer}>
                <Text style={styles.superEnhancedChartTitle}>Answer Distribution</Text>
                <Text style={styles.superChartDescription}>Comprehensive breakdown of your exam performance</Text>
                <View style={styles.chartStatsContainer}>
                  <View style={styles.chartStatItem}>
                    <Text style={styles.chartStatValue}>{total}</Text>
                    <Text style={styles.chartStatLabel}>Total Questions</Text>
                  </View>
                  <View style={styles.chartStatDivider} />
                  <View style={styles.chartStatItem}>
                    <Text style={styles.chartStatValue}>{accuracy.toFixed(1)}%</Text>
                    <Text style={styles.chartStatLabel}>Accuracy Rate</Text>
                  </View>
                </View>
              </View>
            </View>
            {renderBarChart(accuracyData, 'Accuracy', total)}
          </LinearGradient>
        </View>

        {/* Difficulty Analysis */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Difficulty Breakdown</Text>
          {renderBarChart(difficultyData, 'Difficulty', Math.max(...Object.values(difficultyStats)))}
        </View>

        {/* Topic Performance */}
        {Object.keys(topicStats).length > 0 && (
          <View style={styles.topicSection}>
            <Text style={styles.topicTitle}>Topic-wise Performance</Text>
            {Object.entries(topicStats).map(([topic, stats]) => (
              <View key={topic} style={styles.topicCard}>
                <View style={styles.topicHeader}>
                  <Text style={styles.topicName}>{topic}</Text>
                  <Text style={styles.topicScore}>
                    {stats.correct}/{stats.total}
                  </Text>
                </View>
                <View style={styles.topicProgress}>
                  <View 
                    style={[
                      styles.topicProgressBar, 
                      { width: `${(stats.correct / stats.total) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.topicPercentage}>
                  {((stats.correct / stats.total) * 100).toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => router.back()}
        >
          <Ionicons name="home" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>Back to Exams</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => {
            // Share results functionality
          }}
        >
          <Ionicons name="share-outline" size={20} color="#667eea" />
          <Text style={styles.secondaryButtonText}>Share Results</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f8fb',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    paddingTop: 48,
    paddingBottom: 32,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 18,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  shareButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 26,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 50,
  },
  overviewCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  overviewGradient: {
    borderRadius: 20,
    padding: 24,
    flexDirection: 'column',
    alignItems: 'center',
  },
  trophyGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  accuracyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  accuracyInfo: {
    alignItems: 'center',
    marginTop: 8,
  },
  accuracyValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 2,
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  trophyContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 10,
    marginRight: 15,
  },
  performanceInfo: {
    flex: 1,
  },
  needsImprovementBackground: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    marginLeft: 10,
  },
  needsImprovementText: {
    color: '#000000',
    fontWeight: 'bold',
  },
  needsImprovementCard: {
    borderWidth: 3,
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  excellentText: {
    color: '#059669',
    fontWeight: 'bold',
  },
  veryGoodText: {
    color: '#0891B2',
    fontWeight: 'bold',
  },
  goodText: {
    color: '#2563EB',
    fontWeight: 'bold',
  },
  averageText: {
    color: '#D97706',
    fontWeight: 'bold',
  },
  belowAverageText: {
    color: '#DC2626',
    fontWeight: 'bold',
  },
  needsImprovementScore: {
    color: '#DC2626',
  },
  excellentScore: {
    color: '#059669',
  },
  veryGoodScore: {
    color: '#0891B2',
  },
  goodScore: {
    color: '#2563EB',
  },
  averageScore: {
    color: '#D97706',
  },
  belowAverageScore: {
    color: '#DC2626',
  },
  performanceTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  performanceScore: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  performanceSubtext: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  accuracySection: {
    alignItems: 'center',
    marginTop: 20,
  },
  accuracyLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statCard: {
    width: '45%',
    borderRadius: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  statGradient: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
    textAlign: 'center',
    fontWeight: '500',
  },
  analysisSection: {
    marginHorizontal: 18,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    marginTop: 8,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  enhancedChartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  chartGradient: {
    borderRadius: 16,
    padding: 20,
  },
  chartCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chartTitleContainer: {
    flex: 1,
  },
  enhancedChartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  chartDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartSubtitle: {
    marginTop: 4,
  },
  chartSubtitleText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  barChartContainer: {
    gap: 12,
  },
  enhancedBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  barLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  barColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  barLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  enhancedBar: {
    height: 8,
    borderRadius: 4,
    marginRight: 12,
    minWidth: 20,
  },
  barValueContainer: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  barValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  barPercentage: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  superEnhancedChartCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  superChartGradient: {
    borderRadius: 20,
    padding: 24,
  },
  superChartHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  superChartIconContainer: {
    marginRight: 16,
  },
  iconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  superChartTitleContainer: {
    flex: 1,
  },
  superEnhancedChartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  superChartDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  chartStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderRadius: 12,
    padding: 12,
  },
  chartStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  chartStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 2,
  },
  chartStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  chartStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    marginHorizontal: 12,
  },
  superChartContainer: {
    marginTop: 8,
  },
  superBarChartContainer: {
    gap: 16,
  },
  superEnhancedBarRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  superBarLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  superBarColorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
    overflow: 'hidden',
  },
  colorIndicatorGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  superBarLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  barLabelBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  barLabelBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  superBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barBackground: {
    flex: 1,
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    marginRight: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  superEnhancedBar: {
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  barGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  superBarValueContainer: {
    alignItems: 'center',
    minWidth: 60,
  },
  superBarValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  superBarSubtext: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '500',
  },
  topicSection: {
    marginTop: 16,
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  topicCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  topicName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  topicScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
  },
  topicProgress: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
  },
  topicProgressBar: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#28a745',
  },
  topicPercentage: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 18,
    marginBottom: 32,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#667eea',
    width: '45%',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#667eea',
    width: '45%',
  },
  secondaryButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  circularContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularBackground: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  circularProgress: {
    position: 'absolute',
  },
  circularText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barLabel: {
    width: 80,
    fontSize: 14,
    color: '#666',
  },
  barContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  bar: {
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  barValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 30,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  topicName: {
    width: 100,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  topicStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  topicAccuracy: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  topicCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  topicBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginLeft: 12,
    overflow: 'hidden',
  },
  topicBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  timeStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeStat: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  timeStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  timeStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  trendsContainer: {
    marginTop: 8,
  },
  trendItem: {
    marginBottom: 16,
  },
  trendLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  trendBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  trendFill: {
    height: '100%',
    borderRadius: 4,
  },
  trendValue: {
    fontSize: 12,
    color: '#666',
  },
  analysisGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  analysisCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  analysisTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  analysisText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  comparisonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  comparisonItem: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  comparisonLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  comparisonValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  recommendationsList: {
    marginTop: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  shareButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    width: '48%',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  rankButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    width: '100%',
  },
  rankButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: '100%',
  },
  rankButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
}); 