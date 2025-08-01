import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { io, Socket } from 'socket.io-client';

const { width, height } = Dimensions.get('window');

interface BattleQuiz {
  id: string;
  title: string;
  description: string;
  entryAmount: number;
  categoryId: string;
  questionCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  category: {
    id: string;
    name: string;
    color: string;
  };
  _count: {
    participants: number;
    winners: number;
  };
}

interface BattleQuizResponse {
  quizzes: BattleQuiz[];
  walletBalance: number;
}

interface BattleEvent {
  type: 'player_joined' | 'player_left' | 'battle_started' | 'question_ready' | 'battle_ended';
  data: any;
  quizId: string;
}

export default function QuizScreen() {
  const { user } = useAuth();
  const [battleQuizzes, setBattleQuizzes] = useState<BattleQuiz[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [rotateAnim] = useState(new Animated.Value(0));
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectedQuizzes, setConnectedQuizzes] = useState<Set<string>>(new Set());
  const [battleStatus, setBattleStatus] = useState<Record<string, any>>({});

  // Floating animation refs
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const floatAnim3 = useRef(new Animated.Value(0)).current;

  // Initialize socket connection
  useEffect(() => {
    if (user?.token) {
      const newSocket = io('http://localhost:3000', {
        auth: {
          token: user.token
        },
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      newSocket.on('battle_event', (event: BattleEvent) => {
        handleBattleEvent(event);
      });

      newSocket.on('quiz_updated', (updatedQuiz: BattleQuiz) => {
        updateQuizInList(updatedQuiz);
      });

      newSocket.on('wallet_updated', (newBalance: number) => {
        setWalletBalance(newBalance);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user?.token]);

  const handleBattleEvent = (event: BattleEvent) => {
    console.log('Battle event received:', event);
    
    switch (event.type) {
      case 'player_joined':
        showNotification(`Player joined ${event.data.playerName}`);
        updateQuizParticipants(event.quizId, event.data.participantCount);
        break;
      case 'player_left':
        showNotification(`Player left the battle`);
        updateQuizParticipants(event.quizId, event.data.participantCount);
        break;
      case 'battle_started':
        showNotification('Battle started! Get ready!');
        setBattleStatus(prev => ({
          ...prev,
          [event.quizId]: { status: 'started', startTime: Date.now() }
        }));
        break;
      case 'question_ready':
        showNotification('New question available!');
        break;
      case 'battle_ended':
        showNotification(`Battle ended! Winner: ${event.data.winner}`);
        setBattleStatus(prev => ({
          ...prev,
          [event.quizId]: { status: 'ended', winner: event.data.winner }
        }));
        break;
    }
  };

  const updateQuizInList = (updatedQuiz: BattleQuiz) => {
    setBattleQuizzes(prev => 
      prev.map(quiz => 
        quiz.id === updatedQuiz.id ? updatedQuiz : quiz
      )
    );
  };

  const updateQuizParticipants = (quizId: string, participantCount: number) => {
    setBattleQuizzes(prev => 
      prev.map(quiz => 
        quiz.id === quizId 
          ? { ...quiz, _count: { ...quiz._count, participants: participantCount } }
          : quiz
      )
    );
  };

  const showNotification = (message: string) => {
    // You can implement a proper notification system here
    console.log('Notification:', message);
    Alert.alert('Battle Update', message, [{ text: 'OK' }]);
  };

  const fetchBattleQuizzes = async () => {
    if (!user?.token) return;
    
    try {
      const response = await apiFetchAuth('/student/battle-quiz', user.token);
      if (response.ok) {
        const data: BattleQuizResponse = response.data;
        setBattleQuizzes(data.quizzes);
        setWalletBalance(data.walletBalance);
        
        // Enhanced animations
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }),
        ]).start();

        // Start floating animations
        startFloatingAnimations();
      }
    } catch (error) {
      console.error('Failed to fetch battle quizzes:', error);
      Alert.alert('Error', 'Failed to load battle quizzes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const startFloatingAnimations = () => {
    const createFloatingAnimation = (anim: Animated.Value, delay: number = 0) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 3000,
            delay,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.sin),
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.sin),
          }),
        ])
      ).start();
    };

    createFloatingAnimation(floatAnim1, 0);
    createFloatingAnimation(floatAnim2, 1000);
    createFloatingAnimation(floatAnim3, 2000);
  };

  useEffect(() => {
    fetchBattleQuizzes();
    
    // Start pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();

    // Start rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();
  }, [user?.token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBattleQuizzes();
  };

  const handleJoinBattle = async (quiz: BattleQuiz) => {
    if (walletBalance < quiz.entryAmount) {
      Alert.alert(
        'Insufficient Balance',
        `You need ${quiz.entryAmount} coins to join this battle. Your balance: ${walletBalance} coins`
      );
      return;
    }
    
    if (!socket) {
      Alert.alert('Error', 'Not connected to server');
      return;
    }

    Alert.alert(
      'Join Battle',
      `Join "${quiz.title}" for ${quiz.entryAmount} coins?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Join', 
          onPress: async () => {
            try {
              // Emit join battle event
              socket.emit('join_battle', {
                quizId: quiz.id,
                userId: user?.id,
                userName: user?.name
              });

              // Add to connected quizzes
              setConnectedQuizzes(prev => new Set([...prev, quiz.id]));
              
              showNotification('Joining battle...');
              
              // You can navigate to battle screen here
              // navigation.navigate('BattleScreen', { quizId: quiz.id });
              
            } catch (error) {
              console.error('Failed to join battle:', error);
              Alert.alert('Error', 'Failed to join battle');
            }
          }
        }
      ]
    );
  };

  const handleLeaveBattle = (quizId: string) => {
    if (!socket) return;

    socket.emit('leave_battle', {
      quizId: quizId,
      userId: user?.id
    });

    setConnectedQuizzes(prev => {
      const newSet = new Set(prev);
      newSet.delete(quizId);
      return newSet;
    });

    showNotification('Left the battle');
  };

  const handleQuizPress = (quizId: string) => {
    setSelectedQuiz(selectedQuiz === quizId ? null : quizId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGradientColors = (categoryColor: string): [string, string] => {
    const colors: Record<string, [string, string]> = {
      '#3B82F6': ['#3B82F6', '#1D4ED8'],
      '#10B981': ['#10B981', '#059669'],
      '#F59E0B': ['#F59E0B', '#D97706'],
      '#EF4444': ['#EF4444', '#DC2626'],
      '#8B5CF6': ['#8B5CF6', '#7C3AED'],
      '#EC4899': ['#EC4899', '#DB2777'],
    };
    return colors[categoryColor] || ['#6366F1', '#4F46E5'];
  };

  const getDifficultyColor = (questionCount: number): [string, string] => {
    if (questionCount <= 5) return ['#10B981', '#059669']; // Easy - Green
    if (questionCount <= 10) return ['#F59E0B', '#D97706']; // Medium - Yellow
    return ['#EF4444', '#DC2626']; // Hard - Red
  };

  const getDifficultyText = (questionCount: number) => {
    if (questionCount <= 5) return 'Easy';
    if (questionCount <= 10) return 'Medium';
    return 'Hard';
  };

  const isConnectedToQuiz = (quizId: string) => connectedQuizzes.has(quizId);
  const getBattleStatus = (quizId: string) => battleStatus[quizId];

  if (loading) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.loadingContainer}
      >
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContent}>
          <Animated.View 
            style={[
              styles.loadingIcon,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <Ionicons name="game-controller" size={48} color="#fff" />
          </Animated.View>
          <Text style={styles.loadingText}>Loading Battle Quizzes...</Text>
          <View style={styles.loadingDots}>
            <Animated.View style={[styles.dot, styles.dot1, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.dot, styles.dot2, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.dot, styles.dot3, { opacity: pulseAnim }]} />
          </View>
        </View>
        
        {/* Floating elements in loading */}
        <Animated.View 
          style={[
            styles.floatingElement1,
            { transform: [{ translateY: floatAnim1.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -20]
            })}] }
          ]} 
        />
        <Animated.View 
          style={[
            styles.floatingElement2,
            { transform: [{ translateY: floatAnim2.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -15]
            })}] }
          ]} 
        />
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Enhanced Premium Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <Animated.Text 
              style={[
                styles.headerTitle,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              ⚔️ Battle Quiz
            </Animated.Text>
            <Text style={styles.headerSubtitle}>Challenge other players in real-time battles</Text>
          </View>
          
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
              style={styles.walletCard}
            >
              <View style={styles.walletIcon}>
                <Ionicons name="wallet" size={20} color="#fff" />
              </View>
              <Text style={styles.walletBalance}>{walletBalance.toLocaleString()}</Text>
              <Text style={styles.walletLabel}>Coins</Text>
            </LinearGradient>
          </Animated.View>
        </View>
        
        {/* Enhanced floating particles */}
        <Animated.View 
          style={[
            styles.particle1,
            { transform: [{ translateY: floatAnim1.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -30]
            })}] }
          ]} 
        />
        <Animated.View 
          style={[
            styles.particle2,
            { transform: [{ translateY: floatAnim2.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -25]
            })}] }
          ]} 
        />
        <Animated.View 
          style={[
            styles.particle3,
            { transform: [{ translateY: floatAnim3.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -35]
            })}] }
          ]} 
        />
        
        {/* Rotating decorative element */}
        <Animated.View 
          style={[
            styles.rotatingElement,
            { transform: [{ rotate: rotateAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg']
            })}] }
          ]} 
        />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#667eea"
            colors={['#667eea', '#764ba2']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {battleQuizzes.length === 0 ? (
          <Animated.View 
            style={[
              styles.emptyContainer,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
          >
            <LinearGradient
              colors={['rgba(102, 126, 234, 0.2)', 'rgba(118, 75, 162, 0.2)']}
              style={styles.emptyIconContainer}
            >
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Ionicons name="game-controller" size={64} color="#667eea" />
              </Animated.View>
            </LinearGradient>
            <Text style={styles.emptyTitle}>No Battle Quizzes Available</Text>
            <Text style={styles.emptySubtitle}>Check back later for exciting new challenges!</Text>
            <TouchableOpacity style={styles.refreshButton}>
              <Ionicons name="refresh" size={16} color="#667eea" />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          battleQuizzes.map((quiz, index) => {
            const isConnected = isConnectedToQuiz(quiz.id);
            const status = getBattleStatus(quiz.id);
            
            return (
              <Animated.View 
                key={quiz.id} 
                style={[
                  styles.quizCard,
                  { 
                    opacity: fadeAnim, 
                    transform: [{ translateY: slideAnim }],
                    marginTop: index === 0 ? 0 : 12
                  }
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => handleQuizPress(quiz.id)}
                >
                  <LinearGradient
                    colors={['#fff', '#f8fafc']}
                    style={[
                      styles.cardGradient,
                      selectedQuiz === quiz.id && styles.selectedCard,
                      isConnected && styles.connectedCard
                    ]}
                  >
                    {/* Enhanced Card Header */}
                    <View style={styles.quizHeader}>
                      <LinearGradient
                        colors={getGradientColors(quiz.category.color)}
                        style={styles.categoryBadge}
                      >
                        <Ionicons name="bookmark" size={12} color="#fff" />
                        <Text style={styles.categoryName}>{quiz.category.name}</Text>
                      </LinearGradient>
                      
                      <View style={styles.statusContainer}>
                        {isConnected && (
                          <View style={styles.connectedIndicator}>
                            <View style={styles.connectedDot} />
                            <Text style={styles.connectedText}>Connected</Text>
                          </View>
                        )}
                        <View style={[
                          styles.statusDot, 
                          { backgroundColor: quiz.isActive ? '#10B981' : '#EF4444' }
                        ]} />
                        <Text style={styles.statusText}>
                          {quiz.isActive ? '🟢 Active' : '🔴 Inactive'}
                        </Text>
                      </View>
                    </View>

                    {/* Enhanced Quiz Title & Description */}
                    <Text style={styles.quizTitle}>🎯 {quiz.title}</Text>
                    <Text style={styles.quizDescription}>{quiz.description}</Text>

                    {/* Battle Status */}
                    {status && (
                      <View style={styles.battleStatusContainer}>
                        <LinearGradient
                          colors={status.status === 'started' ? ['#10B981', '#059669'] : ['#F59E0B', '#D97706']}
                          style={styles.battleStatusBadge}
                        >
                          <Text style={styles.battleStatusText}>
                            {status.status === 'started' ? '⚡ Battle Started' : '🏆 Battle Ended'}
                          </Text>
                        </LinearGradient>
                      </View>
                    )}

                    {/* Enhanced Stats Grid */}
                    <View style={styles.statsGrid}>
                      <View style={styles.statCard}>
                        <LinearGradient
                          colors={['#EFF6FF', '#DBEAFE']}
                          style={styles.statIconContainer}
                        >
                          <Ionicons name="help-circle" size={20} color="#3B82F6" />
                        </LinearGradient>
                        <Text style={styles.statNumber}>{quiz.questionCount}</Text>
                        <Text style={styles.statLabel}>Questions</Text>
                      </View>
                      
                      <View style={styles.statCard}>
                        <LinearGradient
                          colors={['#F0FDF4', '#DCFCE7']}
                          style={styles.statIconContainer}
                        >
                          <Ionicons name="people" size={20} color="#10B981" />
                        </LinearGradient>
                        <Text style={styles.statNumber}>{quiz._count.participants}</Text>
                        <Text style={styles.statLabel}>Players</Text>
                      </View>
                      
                      <View style={styles.statCard}>
                        <LinearGradient
                          colors={['#FEF3C7', '#FDE68A']}
                          style={styles.statIconContainer}
                        >
                          <Ionicons name="trophy" size={20} color="#F59E0B" />
                        </LinearGradient>
                        <Text style={styles.statNumber}>{quiz._count.winners}</Text>
                        <Text style={styles.statLabel}>Winners</Text>
                      </View>
                    </View>

                    {/* Difficulty Indicator */}
                    <View style={styles.difficultyContainer}>
                      <LinearGradient
                        colors={getDifficultyColor(quiz.questionCount)}
                        style={styles.difficultyBadge}
                      >
                        <Text style={styles.difficultyText}>
                          {getDifficultyText(quiz.questionCount)}
                        </Text>
                      </LinearGradient>
                    </View>

                    {/* Enhanced Action Section */}
                    <View style={styles.actionSection}>
                      <View style={styles.entryInfo}>
                        <LinearGradient
                          colors={['#FEF3C7', '#FDE68A']}
                          style={styles.entryIconContainer}
                        >
                          <Ionicons name="cash" size={16} color="#F59E0B" />
                        </LinearGradient>
                        <View>
                          <Text style={styles.entryAmount}>{quiz.entryAmount} Coins</Text>
                          <Text style={styles.entryLabel}>Entry Fee</Text>
                        </View>
                      </View>
                      
                      {isConnected ? (
                        <TouchableOpacity
                          style={styles.leaveButton}
                          onPress={() => handleLeaveBattle(quiz.id)}
                        >
                          <LinearGradient
                            colors={['#EF4444', '#DC2626']}
                            style={styles.joinButtonGradient}
                          >
                            <Text style={styles.joinButtonText}>
                              🚪 Leave Battle
                            </Text>
                            <Ionicons name="exit-outline" size={16} color="#fff" />
                          </LinearGradient>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[
                            styles.joinButton,
                            { opacity: quiz.isActive ? 1 : 0.5 }
                          ]}
                          onPress={() => handleJoinBattle(quiz)}
                          disabled={!quiz.isActive}
                        >
                          <LinearGradient
                            colors={quiz.isActive ? ['#667eea', '#764ba2'] : ['#9CA3AF', '#6B7280']}
                            style={styles.joinButtonGradient}
                          >
                            <Text style={styles.joinButtonText}>
                              {quiz.isActive ? '⚔️ Join Battle' : '⏸️ Inactive'}
                            </Text>
                            <Ionicons name="arrow-forward" size={16} color="#fff" />
                          </LinearGradient>
                        </TouchableOpacity>
                      )}
                    </View>

                    <Text style={styles.createdAt}>Created {formatDate(quiz.createdAt)}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  loadingContent: {
    alignItems: 'center',
    zIndex: 2,
  },
  loadingIcon: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 20,
  },
  loadingDots: {
    flexDirection: 'row',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginHorizontal: 4,
  },
  dot1: {
    opacity: 0.3,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 1,
  },
  floatingElement1: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    top: 100,
    right: 50,
  },
  floatingElement2: {
    position: 'absolute',
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    top: 150,
    left: 30,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  walletCard: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  walletIcon: {
    marginBottom: 8,
  },
  walletBalance: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  walletLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  particle1: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    top: 80,
    right: 60,
  },
  particle2: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    top: 120,
    left: 40,
  },
  particle3: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.4)',
    top: 100,
    right: 120,
  },
  rotatingElement: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: 80,
    left: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  refreshButtonText: {
    marginLeft: 6,
    color: '#667eea',
    fontWeight: '600',
    fontSize: 14,
  },
  quizCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  cardGradient: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  selectedCard: {
    borderColor: '#667eea',
    borderWidth: 2,
    shadowColor: '#667eea',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  connectedCard: {
    borderColor: '#10B981',
    borderWidth: 2,
    shadowColor: '#10B981',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    lineHeight: 24,
  },
  quizDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  difficultyContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  entryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  entryAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  entryLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  joinButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  joinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 6,
  },
  createdAt: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  connectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  connectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  connectedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
  },
  battleStatusContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  battleStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  battleStatusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  leaveButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
}); 