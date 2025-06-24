import { AppColors } from '@/constants/Colors';
import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ExamResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  timeTaken: number;
  submittedAt: string;
}

const PracticeExamResultScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ExamResult | null>(null);

  useEffect(() => {
    if (!id || !user?.token) return;
    fetchResult();
  }, [id, user?.token]);

  const fetchResult = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const res = await apiFetchAuth(`/student/practice-exams/${id}/result`, user.token);
      if (res.ok) {
        setResult(res.data);
      } else {
        Alert.alert('Error', 'Could not fetch result.');
      }
    } catch (e) {
      console.error('Error fetching result:', e);
      Alert.alert('Error', 'Could not fetch result.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={styles.loadingText}>Loading Result...</Text>
      </View>
    );
  }

  if (!result) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#F44336" />
        <Text style={styles.errorText}>No result found</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchResult}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={AppColors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exam Result</Text>
      </View>

      <View style={styles.resultCard}>
        <View style={styles.scoreSection}>
          <Text style={styles.scoreTitle}>Your Score</Text>
          <Text style={styles.scoreValue}>{result.score}/{result.totalQuestions}</Text>
          <Text style={styles.percentage}>{result.percentage}%</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
            <Text style={styles.statValue}>{result.correctAnswers}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="close-circle" size={32} color="#F44336" />
            <Text style={styles.statValue}>{result.totalQuestions - result.correctAnswers}</Text>
            <Text style={styles.statLabel}>Incorrect</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time" size={32} color={AppColors.primary} />
            <Text style={styles.statValue}>{Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s</Text>
            <Text style={styles.statLabel}>Time Taken</Text>
          </View>
        </View>

        <View style={styles.performanceSection}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.performanceBar}>
            <View 
              style={[
                styles.performanceFill, 
                { width: `${result.percentage}%` },
                result.percentage >= 70 ? { backgroundColor: '#4CAF50' } :
                result.percentage >= 50 ? { backgroundColor: '#FF9800' } :
                { backgroundColor: '#F44336' }
              ]} 
            />
          </View>
          <Text style={styles.performanceText}>
            {result.percentage >= 70 ? 'Excellent!' :
             result.percentage >= 50 ? 'Good!' :
             'Keep practicing!'}
          </Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.primaryBtn} 
          onPress={() => router.push('/(tabs)/practice-exam')}
        >
          <Text style={styles.primaryBtnText}>Take Another Exam</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.secondaryBtn} 
          onPress={() => router.push('/(tabs)/home')}
        >
          <Text style={styles.secondaryBtnText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: AppColors.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    marginTop: 10,
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.primary,
    marginLeft: 16,
  },
  resultCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreTitle: {
    fontSize: 16,
    color: AppColors.darkGrey,
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: AppColors.primary,
  },
  percentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.primary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: AppColors.darkGrey,
    marginTop: 4,
  },
  performanceSection: {
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.primary,
    marginBottom: 12,
  },
  performanceBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  performanceFill: {
    height: '100%',
    borderRadius: 4,
  },
  performanceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.primary,
    marginTop: 8,
  },
  actionsContainer: {
    padding: 16,
  },
  primaryBtn: {
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryBtn: {
    backgroundColor: '#E0F7FA',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.primary,
  },
  secondaryBtnText: {
    color: AppColors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PracticeExamResultScreen; 