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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f6f8fb' }} contentContainerStyle={{ paddingBottom: 32 }}>
      <LinearGradient colors={['#667eea', '#764ba2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Ionicons name="trophy" size={40} color="#FFD700" style={{ marginBottom: 8 }} />
        <Text style={styles.headerTitle}>Detailed Analysis</Text>
        <Text style={styles.scoreText}>Score: <Text style={{ color: '#FFD700' }}>{score}</Text> / {totalMarks}</Text>
        
        <View style={styles.performanceContainer}>
          {renderCircularProgress(percentage, 100)}
          <View style={styles.performanceInfo}>
            <Text style={[styles.performanceText, { color: performance.color }]}>
              <Ionicons name={performance.icon as any} size={20} /> {performance.text}
            </Text>
            <Text style={styles.accuracyText}>Accuracy: {accuracy.toFixed(1)}%</Text>
            <Text style={styles.timeText}>Avg Time: {avgTime.toFixed(1)}s</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={{ padding: 18 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#6C63FF" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Summary Cards */}
            <View style={styles.summaryGrid}>
              <View style={[styles.summaryCard, { backgroundColor: '#d4edda' }]}>
                <Ionicons name="checkmark-circle" size={24} color="#28a745" />
                <Text style={[styles.summaryCardValue, { color: '#28a745' }]}>{correct}</Text>
                <Text style={styles.summaryCardLabel}>Correct</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: '#f8d7da' }]}>
                <Ionicons name="close-circle" size={24} color="#dc3545" />
                <Text style={[styles.summaryCardValue, { color: '#dc3545' }]}>{incorrect}</Text>
                <Text style={styles.summaryCardLabel}>Incorrect</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: '#e2e3e5' }]}>
                <Ionicons name="remove-circle" size={24} color="#6c757d" />
                <Text style={[styles.summaryCardValue, { color: '#6c757d' }]}>{unattempted}</Text>
                <Text style={styles.summaryCardLabel}>Unattempted</Text>
              </View>
            </View>

            {/* Charts */}
            {renderBarChart(accuracyData, 'Answer Distribution', total)}
            {renderBarChart(difficultyData, 'Difficulty Breakdown', total)}

            {/* Topic Performance */}
            {Object.keys(topicStats).length > 0 && (
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Topic Performance</Text>
                {Object.entries(topicStats).map(([topic, stats]) => {
                  const topicAccuracy = (stats.correct / stats.total) * 100;
                  return (
                    <View key={topic} style={styles.topicRow}>
                      <Text style={styles.topicName}>{topic}</Text>
                      <View style={styles.topicStats}>
                        <Text style={styles.topicAccuracy}>{topicAccuracy.toFixed(1)}%</Text>
                        <Text style={styles.topicCount}>({stats.correct}/{stats.total})</Text>
                      </View>
                      <View style={styles.topicBar}>
                        <View 
                          style={[
                            styles.topicBarFill,
                            { 
                              width: `${topicAccuracy}%`,
                              backgroundColor: topicAccuracy >= 70 ? '#28a745' : topicAccuracy >= 50 ? '#ffc107' : '#dc3545'
                            }
                          ]} 
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Time Analysis */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Time Analysis</Text>
              <View style={styles.timeStats}>
                <View style={styles.timeStat}>
                  <Text style={styles.timeStatLabel}>Total Time</Text>
                  <Text style={styles.timeStatValue}>{Math.floor(totalTime / 60)}m {Math.round(totalTime % 60)}s</Text>
                </View>
                <View style={styles.timeStat}>
                  <Text style={styles.timeStatLabel}>Average per Question</Text>
                  <Text style={styles.timeStatValue}>{avgTime.toFixed(1)}s</Text>
                </View>
                <View style={styles.timeStat}>
                  <Text style={styles.timeStatLabel}>Fastest Answer</Text>
                  <Text style={styles.timeStatValue}>{Math.min(...Object.values(timeData))}s</Text>
                </View>
                <View style={styles.timeStat}>
                  <Text style={styles.timeStatLabel}>Slowest Answer</Text>
                  <Text style={styles.timeStatValue}>{Math.max(...Object.values(timeData))}s</Text>
                </View>
              </View>
            </View>

            {/* Performance Trends */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Performance Trends</Text>
              <View style={styles.trendsContainer}>
                <View style={styles.trendItem}>
                  <Text style={styles.trendLabel}>Time vs Accuracy</Text>
                  <View style={styles.trendBar}>
                    <View style={[styles.trendFill, { width: `${Math.min(accuracy, 100)}%`, backgroundColor: accuracy >= 70 ? '#28a745' : accuracy >= 50 ? '#ffc107' : '#dc3545' }]} />
                  </View>
                  <Text style={styles.trendValue}>{accuracy.toFixed(1)}% accuracy in {avgTime.toFixed(1)}s avg</Text>
                </View>
                <View style={styles.trendItem}>
                  <Text style={styles.trendLabel}>Efficiency Score</Text>
                  <View style={styles.trendBar}>
                    <View style={[styles.trendFill, { width: `${Math.min((accuracy / avgTime) * 10, 100)}%`, backgroundColor: '#6C63FF' }]} />
                  </View>
                  <Text style={styles.trendValue}>{(accuracy / avgTime * 10).toFixed(1)} points per second</Text>
                </View>
              </View>
            </View>

            {/* Strength & Weakness Analysis */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Strength & Weakness Analysis</Text>
              <View style={styles.analysisGrid}>
                <View style={styles.analysisCard}>
                  <Ionicons name="trending-up" size={24} color="#28a745" />
                  <Text style={styles.analysisTitle}>Strengths</Text>
                  <Text style={styles.analysisText}>
                    {difficultyStats.easy > 0 && `Easy questions: ${((difficultyStats.easy / total) * 100).toFixed(1)}%`}
                    {difficultyStats.medium > 0 && `\nMedium questions: ${((difficultyStats.medium / total) * 100).toFixed(1)}%`}
                  </Text>
                </View>
                <View style={styles.analysisCard}>
                  <Ionicons name="trending-down" size={24} color="#dc3545" />
                  <Text style={styles.analysisTitle}>Areas to Improve</Text>
                  <Text style={styles.analysisText}>
                    {difficultyStats.hard > 0 && `Hard questions: ${((difficultyStats.hard / total) * 100).toFixed(1)}%`}
                    {unattempted > 0 && `\nUnattempted: ${((unattempted / total) * 100).toFixed(1)}%`}
                  </Text>
                </View>
              </View>
            </View>

            {/* Comparative Performance */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Comparative Performance</Text>
              <View style={styles.comparisonGrid}>
                <View style={styles.comparisonItem}>
                  <Text style={styles.comparisonLabel}>Your Score</Text>
                  <Text style={[styles.comparisonValue, { color: performance.color }]}>{percentage.toFixed(1)}%</Text>
                </View>
                <View style={styles.comparisonItem}>
                  <Text style={styles.comparisonLabel}>Class Average</Text>
                  <Text style={[styles.comparisonValue, { color: '#6c757d' }]}>75.2%</Text>
                </View>
                <View style={styles.comparisonItem}>
                  <Text style={styles.comparisonLabel}>Top 10%</Text>
                  <Text style={[styles.comparisonValue, { color: '#28a745' }]}>92.8%</Text>
                </View>
                <View style={styles.comparisonItem}>
                  <Text style={styles.comparisonLabel}>Your Rank</Text>
                  <Text style={[styles.comparisonValue, { color: percentage >= 80 ? '#28a745' : percentage >= 60 ? '#ffc107' : '#dc3545' }]}>
                    {percentage >= 90 ? 'Top 5%' : percentage >= 80 ? 'Top 15%' : percentage >= 70 ? 'Top 30%' : percentage >= 60 ? 'Top 50%' : 'Below 50%'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.rankButton}
                onPress={() => router.push('/(tabs)/exam')}
              >
                <LinearGradient colors={['#667eea', '#764ba2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.rankButtonGradient}>
                  <Ionicons name="trophy" size={16} color="#fff" />
                  <Text style={styles.rankButtonText}>View your Rank</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Study Recommendations */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Study Recommendations</Text>
              <View style={styles.recommendationsList}>
                {percentage < 70 && (
                  <View style={styles.recommendationItem}>
                    <Ionicons name="book" size={20} color="#6C63FF" />
                    <Text style={styles.recommendationText}>Review fundamental concepts and practice more basic questions</Text>
                  </View>
                )}
                {difficultyStats.hard > 0 && (
                  <View style={styles.recommendationItem}>
                    <Ionicons name="school" size={20} color="#ffc107" />
                    <Text style={styles.recommendationText}>Focus on advanced topics and complex problem-solving</Text>
                  </View>
                )}
                {unattempted > 0 && (
                  <View style={styles.recommendationItem}>
                    <Ionicons name="time" size={20} color="#dc3545" />
                    <Text style={styles.recommendationText}>Improve time management and speed up problem-solving</Text>
                  </View>
                )}
                {Object.entries(topicStats).some(([_, stats]) => (stats.correct / stats.total) < 0.6) && (
                  <View style={styles.recommendationItem}>
                    <Ionicons name="analytics" size={20} color="#17a2b8" />
                    <Text style={styles.recommendationText}>Focus on weak topics identified in the analysis</Text>
                  </View>
                )}
                <View style={styles.recommendationItem}>
                  <Ionicons name="refresh" size={20} color="#28a745" />
                  <Text style={styles.recommendationText}>Take more practice tests to improve overall performance</Text>
                </View>
              </View>
            </View>

            {/* Export & Share */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Share Your Results</Text>
              <View style={styles.shareButtons}>
                <TouchableOpacity style={[styles.shareButton, { backgroundColor: '#25D366' }]}>
                  <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                  <Text style={styles.shareButtonText}>WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.shareButton, { backgroundColor: '#1DA1F2' }]}>
                  <Ionicons name="logo-twitter" size={20} color="#fff" />
                  <Text style={styles.shareButtonText}>Twitter</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.shareButton, { backgroundColor: '#4267B2' }]}>
                  <Ionicons name="logo-facebook" size={20} color="#fff" />
                  <Text style={styles.shareButtonText}>Facebook</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.shareButton, { backgroundColor: '#6C63FF' }]}>
                  <Ionicons name="download" size={20} color="#fff" />
                  <Text style={styles.shareButtonText}>Download PDF</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Detailed Question Analysis */}
            <Text style={styles.sectionTitle}>Question Analysis</Text>
            {questions.map((q, idx) => {
              const userAns = userAnswers[q.id];
              const timeSpent = timeData[q.id] || 0;
              return (
                <View key={q.id} style={styles.qCard}>
                  <View style={styles.qHeader}>
                    <Text style={styles.qNumber}>Q{idx + 1}.</Text>
                    <View style={styles.qMeta}>
                      <Text style={[styles.qDifficulty, { 
                        color: q.difficulty === 'easy' ? '#28a745' : q.difficulty === 'medium' ? '#ffc107' : '#dc3545' 
                      }]}>{q.difficulty?.toUpperCase()}</Text>
                      <Text style={styles.qTime}>{timeSpent}s</Text>
                      <Text style={styles.qMarks}>{q.marks || 1} mark{q.marks !== 1 ? 's' : ''}</Text>
                    </View>
                  </View>
                  <Text style={styles.qText}>{q.text}</Text>
                  <View style={{ marginTop: 10 }}>
                    {q.options.map((opt: string, i: number) => {
                      let bg = '#f1f1f1', color = '#222', border = '#eee';
                      if (i === q.correct) { bg = '#d4edda'; color = '#28a745'; border = '#28a745'; }
                      if (userAns === i && i !== q.correct) { bg = '#f8d7da'; color = '#dc3545'; border = '#dc3545'; }
                      return (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: bg, borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: border }}>
                          <Text style={{ fontWeight: 'bold', color, marginRight: 10 }}>{String.fromCharCode(65 + i)}.</Text>
                          <Text style={{ color, flex: 1 }}>{opt}</Text>
                          {i === q.correct && <Ionicons name="checkmark-circle" size={18} color="#28a745" style={{ marginLeft: 8 }} />}
                          {userAns === i && i !== q.correct && <Ionicons name="close-circle" size={18} color="#dc3545" style={{ marginLeft: 8 }} />}
                        </View>
                      );
                    })}
                  </View>
                  <View style={styles.qFooter}>
                    <Text style={{ color: userAns === q.correct ? '#28a745' : userAns === undefined ? '#888' : '#dc3545', fontWeight: 'bold' }}>
                      {userAns === q.correct ? 'Correct' : userAns === undefined ? 'Unattempted' : 'Incorrect'}
                    </Text>
                    {userAns !== undefined && (
                      <Text style={{ marginLeft: 16, color: '#888' }}>Your answer: <Text style={{ fontWeight: 'bold', color: userAns === q.correct ? '#28a745' : '#dc3545' }}>{String.fromCharCode(65 + userAns)}</Text></Text>
                    )}
                    <Text style={{ marginLeft: 16, color: '#28a745' }}>Correct: <Text style={{ fontWeight: 'bold' }}>{String.fromCharCode(65 + q.correct)}</Text></Text>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 48,
    paddingBottom: 32,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 18,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 26,
    marginBottom: 6,
  },
  scoreText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  performanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  performanceInfo: {
    marginLeft: 20,
    alignItems: 'flex-start',
  },
  performanceText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  accuracyText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 2,
  },
  timeText: {
    color: '#fff',
    fontSize: 14,
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
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  summaryCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  summaryCardLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  chartContainer: {
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    marginTop: 8,
  },
  qCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  qHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  qNumber: {
    fontWeight: 'bold',
    color: '#6C63FF',
    fontSize: 15,
  },
  qMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qDifficulty: {
    fontSize: 10,
    fontWeight: 'bold',
    marginRight: 8,
  },
  qTime: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  qMarks: {
    fontSize: 12,
    color: '#666',
  },
  qText: {
    color: '#222',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  qFooter: {
    flexDirection: 'row',
    marginTop: 6,
    flexWrap: 'wrap',
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