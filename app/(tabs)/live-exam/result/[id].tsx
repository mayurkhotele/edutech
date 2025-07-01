import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

interface LiveExamResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unattempted: number;
}

export default function LiveExamResultScreen() {
  const { id, resultData } = useLocalSearchParams<{ id: string, resultData?: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LiveExamResult | null>(null);

  useEffect(() => {
    if (resultData) {
      try {
        const parsedResult = JSON.parse(resultData);
        setResult(parsedResult);
      } catch (e) {
        console.error('Error parsing result data:', e);
      }
    }
  }, [resultData]);

  if (!result) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Loading Results...</Text>
      </View>
    );
  }

  // Calculate analytics
  const total = result.totalQuestions;
  const correct = result.correctAnswers;
  const incorrect = result.wrongAnswers;
  const unattempted = result.unattempted;
  const score = result.score;
  const totalMarks = total; // Assuming 1 mark per question

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
        <Text style={styles.headerTitle}>Live Exam Results</Text>
        <Text style={styles.scoreText}>Score: <Text style={{ color: '#FFD700' }}>{score}</Text> / {totalMarks}</Text>
        
        <View style={styles.performanceContainer}>
          {renderCircularProgress(percentage, 100)}
          <View style={styles.performanceInfo}>
            <Text style={[styles.performanceText, { color: performance.color }]}>
              <Ionicons name={performance.icon as any} size={20} /> {performance.text}
            </Text>
            <Text style={styles.accuracyText}>Accuracy: {accuracy.toFixed(1)}%</Text>
            <Text style={styles.timeText}>Total Questions: {total}</Text>
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
            {renderBarChart(accuracyData, 'Answer Analysis', total)}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/(tabs)/home')}
              >
                <Ionicons name="home" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Go to Home</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#28a745' }]}
                onPress={() => router.push('/(tabs)/exam')}
              >
                <Ionicons name="library" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Take More Exams</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f8fb'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6C63FF'
  },
  header: {
    padding: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 16,
  },
  performanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  performanceInfo: {
    flex: 1,
    marginLeft: 20,
  },
  performanceText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  accuracyText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 14,
    color: '#fff',
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryCardLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  barLabel: {
    width: 80,
    fontSize: 14,
    color: '#666',
  },
  barContainer: {
    flex: 1,
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  bar: {
    height: '100%',
    borderRadius: 10,
  },
  barValue: {
    position: 'absolute',
    right: 8,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C63FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 