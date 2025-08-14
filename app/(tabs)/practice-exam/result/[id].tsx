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
    if (percentage >= 90) return { text: 'Excellent', color: '#28a745', icon: 'star' };
    if (percentage >= 80) return { text: 'Very Good', color: '#20c997', icon: 'star' };
    if (percentage >= 70) return { text: 'Good', color: '#17a2b8', icon: 'star-half' };
    if (percentage >= 60) return { text: 'Average', color: '#ffc107', icon: 'star-half' };
    if (percentage >= 50) return { text: 'Below Average', color: '#fd7e14', icon: 'star-outline' };
    return { text: 'Needs Improvement', color: '#dc3545', icon: 'alert-circle' };
  };

  const performance = getPerformanceRating();

  // Chart data
  const accuracyData = [
    { label: 'Correct', value: correct, color: '#28a745' },
    { label: 'Incorrect', value: incorrect, color: '#dc3545' },
    { label: 'Unattempted', value: unattempted, color: '#6c757d' }
  ];

  const difficultyData = [
    { label: 'Easy', value: difficultyStats.easy, color: '#28a745' },
    { label: 'Medium', value: difficultyStats.medium, color: '#ffc107' },
    { label: 'Hard', value: difficultyStats.hard, color: '#dc3545' }
  ];

  const renderBarChart = (data: any[], title: string, maxValue: number) => (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      {data.map((item, index) => (
        <View key={index} style={styles.barRow}>
          <Text style={styles.barLabel}>{item.label}</Text>
          <View style={styles.barContainer}>
            <View 
              style={[
                styles.bar, 
                { 
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color 
                }
              ]} 
            />
            <Text style={styles.barValue}>{item.value}</Text>
          </View>
        </View>
      ))}
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
      {/* Header Section */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Exam Results</Text>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      {/* Performance Overview Card */}
      <View style={styles.overviewCard}>
        <View style={styles.performanceHeader}>
          <View style={styles.trophyContainer}>
            <Ionicons 
              name={performance.icon as any} 
              size={48} 
              color={performance.color} 
            />
          </View>
          <View style={styles.performanceInfo}>
            <Text style={styles.performanceTitle}>{performance.text}</Text>
            <Text style={styles.performanceScore}>{percentage.toFixed(1)}%</Text>
            <Text style={styles.performanceSubtext}>
              {score} out of {totalMarks} marks
            </Text>
          </View>
        </View>
        
        {/* Accuracy Circle */}
        <View style={styles.accuracySection}>
          {renderCircularProgress(accuracy, 120)}
          <Text style={styles.accuracyLabel}>Accuracy</Text>
        </View>
      </View>

      {/* Quick Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#e8f5e8' }]}>
          <Ionicons name="checkmark-circle" size={32} color="#28a745" />
          <Text style={[styles.statValue, { color: '#28a745' }]}>{correct}</Text>
          <Text style={styles.statLabel}>Correct</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#ffeaea' }]}>
          <Ionicons name="close-circle" size={32} color="#dc3545" />
          <Text style={[styles.statValue, { color: '#dc3545' }]}>{incorrect}</Text>
          <Text style={styles.statLabel}>Incorrect</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#f0f0f0' }]}>
          <Ionicons name="remove-circle" size={32} color="#6c757d" />
          <Text style={[styles.statValue, { color: '#6c757d' }]}>{unattempted}</Text>
          <Text style={styles.statLabel}>Unattempted</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#e3f2fd' }]}>
          <Ionicons name="time" size={32} color="#2196f3" />
          <Text style={[styles.statValue, { color: '#2196f3' }]}>
            {Math.floor(avgTime / 60)}m {Math.floor(avgTime % 60)}s
          </Text>
          <Text style={styles.statLabel}>Avg Time</Text>
        </View>
      </View>

      {/* Detailed Analysis */}
      <View style={styles.analysisSection}>
        <Text style={styles.sectionTitle}>Detailed Analysis</Text>
        
        {/* Accuracy Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Answer Distribution</Text>
          {renderBarChart(accuracyData, 'Accuracy', total)}
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
    backgroundColor: '#f6f8fb',
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
    padding: 24,
    marginHorizontal: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    flexDirection: 'column',
    alignItems: 'center',
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
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
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
    alignItems: 'center',
    padding: 16,
    borderRadius: 15,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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