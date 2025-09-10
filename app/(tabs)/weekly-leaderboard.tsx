import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { apiFetchAuth } from '@/constants/api';

const { width } = Dimensions.get('window');

interface Winner {
  userId: string;
  name: string;
  rank: number;
  score: number;
  prizeAmount: number;
}

interface ExamLeaderboard {
  examId: string;
  examTitle: string;
  examDate: string;
  totalParticipants: number;
  prizePool: number;
  winners: Winner[];
}

interface WeeklyLeaderboardData {
  currentWeek: string;
  weekStart: string;
  weekEnd: string;
  totalExams: number;
  leaderboard: ExamLeaderboard[];
}

export default function WeeklyLeaderboardScreen() {
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState<WeeklyLeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboardData = async () => {
    try {
      if (!user?.token) return;
      
      const response = await apiFetchAuth('/student/weekly-leaderboard', user.token);
      
      if (response.ok) {
        setLeaderboardData(response.data);
      } else {
        console.error('Failed to fetch leaderboard data:', response.data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboardData();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPrizeAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return { name: 'trophy', color: '#FFD700' };
      case 2:
        return { name: 'medal', color: '#C0C0C0' };
      case 3:
        return { name: 'ribbon', color: '#CD7F32' };
      default:
        return { name: 'star', color: '#8B5CF6' };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading Weekly Leaderboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.trophyIconContainer}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.trophyGradient}
              >
                <Ionicons name="trophy" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>🏆 Weekly Leaderboard</Text>
              <Text style={styles.headerSubtitle}>
                {leaderboardData?.currentWeek} • {leaderboardData?.totalExams} exams
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8B5CF6']}
            tintColor="#8B5CF6"
          />
        }
      >
        {/* Week Info Card */}
        {leaderboardData && (
          <View style={styles.weekInfoCard}>
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFC', '#F1F5F9']}
              style={styles.weekInfoGradient}
            >
              <View style={styles.weekInfoContent}>
                <View style={styles.weekInfoLeft}>
                  <View style={styles.weekIconContainer}>
                    <Ionicons name="calendar" size={24} color="#0EA5E9" />
                  </View>
                  <View style={styles.weekTextContainer}>
                    <Text style={styles.weekTitle}>Current Week</Text>
                    <Text style={styles.weekDates}>
                      {formatDate(leaderboardData.weekStart)} - {formatDate(leaderboardData.weekEnd)}
                    </Text>
                  </View>
                </View>
                <View style={styles.weekStatsContainer}>
                  <View style={styles.weekStatItem}>
                    <Text style={styles.weekStatValue}>{leaderboardData.totalExams}</Text>
                    <Text style={styles.weekStatLabel}>Exams</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Exam Leaderboards */}
        {leaderboardData?.leaderboard.map((exam, index) => (
          <View key={exam.examId} style={styles.examCard}>
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFC']}
              style={styles.examCardGradient}
            >
              <View style={styles.examCardHeader}>
                <View style={styles.examCardLeft}>
                  <View style={styles.examIconContainer}>
                    <Ionicons name="book" size={24} color="#8B5CF6" />
                  </View>
                  <View style={styles.examInfoContainer}>
                    <Text style={styles.examTitle}>{exam.examTitle}</Text>
                    <Text style={styles.examDate}>{formatDate(exam.examDate)}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.examStatsContainer}>
                <View style={styles.examStatItem}>
                  <Text style={styles.examStatValue}>{exam.totalParticipants}</Text>
                  <Text style={styles.examStatLabel}>Participants</Text>
                </View>
                <View style={styles.examStatItem}>
                  <Text style={styles.prizeAmount}>{formatPrizeAmount(exam.prizePool)}</Text>
                  <Text style={styles.examStatLabel}>Prize Pool</Text>
                </View>
              </View>

              {/* Winners Section */}
              {exam.winners.length > 0 ? (
                <View style={styles.winnersSection}>
                  <View style={styles.winnersHeader}>
                    <Ionicons name="trophy" size={16} color="#FFD700" />
                    <Text style={styles.winnersTitle}>Winners</Text>
                  </View>
                  <View style={styles.winnersList}>
                    {exam.winners.map((winner, winnerIndex) => {
                      const rankIcon = getRankIcon(winner.rank);
                      return (
                        <View key={winner.userId} style={styles.winnerCard}>
                          <View style={styles.winnerLeft}>
                            <View style={[
                              styles.winnerRankBadge,
                              winner.rank === 1 && styles.firstPlaceBadge,
                              winner.rank === 2 && styles.secondPlaceBadge,
                              winner.rank === 3 && styles.thirdPlaceBadge,
                            ]}>
                              <Ionicons 
                                name={rankIcon.name as any} 
                                size={16} 
                                color={rankIcon.color} 
                              />
                            </View>
                            <View style={styles.winnerInfo}>
                              <Text style={styles.winnerName}>{winner.name}</Text>
                              <Text style={styles.winnerScore}>{winner.score} points</Text>
                            </View>
                          </View>
                          <View style={styles.winnerRight}>
                            <Text style={styles.winnerPrize}>
                              {formatPrizeAmount(winner.prizeAmount)}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ) : (
                <View style={styles.noWinnersSection}>
                  <Ionicons name="trophy-outline" size={32} color="#CBD5E1" />
                  <Text style={styles.noWinnersText}>No winners yet</Text>
                  <Text style={styles.noWinnersSubtext}>
                    Complete the exam to compete for prizes!
                  </Text>
                </View>
              )}
            </LinearGradient>
          </View>
        ))}

        {/* Empty State */}
        {leaderboardData?.leaderboard.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyStateTitle}>No Exams This Week</Text>
            <Text style={styles.emptyStateSubtext}>
              Check back later for weekly competitions!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  loadingText: {
    fontSize: 18,
    color: '#8B5CF6',
    marginTop: 16,
    fontWeight: '600',
  },
  headerGradient: {
    paddingTop: 0,
    paddingBottom: 28,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  trophyIconContainer: {
    marginRight: 16,
  },
  trophyGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  weekInfoCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  weekInfoGradient: {
    padding: 16,
  },
  weekInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  weekIconContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginRight: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  weekTextContainer: {
    flex: 1,
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 4,
  },
  weekDates: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  weekStatsContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  weekStatItem: {
    alignItems: 'center',
  },
  weekStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  weekStatLabel: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    fontWeight: '600',
  },
  examCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  examCardGradient: {
    padding: 16,
  },
  examCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  examCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  examIconContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginRight: 20,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  examInfoContainer: {
    flex: 1,
  },
  examTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 6,
  },
  examDate: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  examStatsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  examStatItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
  },
  examStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  examStatLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  prizeAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  winnersSection: {
    borderTopWidth: 2,
    borderTopColor: 'rgba(139, 92, 246, 0.1)',
    paddingTop: 20,
    marginTop: 8,
  },
  winnersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  winnersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  winnersList: {
    gap: 12,
  },
  winnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  winnerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  winnerRankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  firstPlaceBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    shadowColor: '#FFD700',
  },
  secondPlaceBadge: {
    backgroundColor: 'rgba(192, 192, 192, 0.2)',
    shadowColor: '#C0C0C0',
  },
  thirdPlaceBadge: {
    backgroundColor: 'rgba(205, 127, 50, 0.2)',
    shadowColor: '#CD7F32',
  },
  winnerInfo: {
    flex: 1,
  },
  winnerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  winnerScore: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  winnerRight: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  winnerPrize: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  noWinnersSection: {
    alignItems: 'center',
    paddingVertical: 32,
    borderTopWidth: 2,
    borderTopColor: 'rgba(139, 92, 246, 0.1)',
    marginTop: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.02)',
    borderRadius: 16,
  },
  noWinnersText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 8,
  },
  noWinnersSubtext: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    backgroundColor: 'rgba(139, 92, 246, 0.02)',
    borderRadius: 20,
    marginTop: 20,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#64748B',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyStateSubtext: {
    fontSize: 18,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '500',
  },
});
