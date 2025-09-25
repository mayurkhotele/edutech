import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';

const { width, height } = Dimensions.get('window');

interface LiveExamResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unattempted: number;
  examDuration: number;
  timeTakenSeconds: number;
  timeTakenMinutes: number;
  timeTakenFormatted: string;
  currentRank: number;
  prizeAmount: number;
  examTitle: string;
  completedAt: string;
  accuracy: number;
  timeEfficiency: number;
  message: string;
}

export default function LiveExamResultScreen() {
  const { id, resultData } = useLocalSearchParams<{ id: string, resultData?: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LiveExamResult | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scoreAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [showConfetti, setShowConfetti] = useState(false);
  const [breakdownAnim] = useState(new Animated.Value(0));
  const [donutAnim] = useState(new Animated.Value(0));
  const [rankAnim] = useState(new Animated.Value(0));

  // Confetti particles
  const confettiRefs = useRef<Animated.Value[]>([]);

  useEffect(() => {
    if (resultData) {
      try {
        const parsedResult = JSON.parse(resultData);
        console.log('📊 Complete API Response:', parsedResult);
        setResult(parsedResult);
        
        // Enhanced animations sequence
        Animated.sequence([
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
          ]),
          Animated.timing(scoreAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Start confetti if score is high
          console.log('🎯 Accuracy:', parsedResult.accuracy, 'Score:', parsedResult.score);
          if (parsedResult.score >= 60) {
            console.log('🎉 Triggering victory celebration!');
            startConfetti();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else {
            console.log('😔 Score too low for celebration');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }

          // Start breakdown animations
          Animated.sequence([
            Animated.timing(breakdownAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.parallel([
              Animated.timing(donutAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.timing(rankAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
              }),
            ]),
          ]).start();
        });

        // Pulse animation for performance badge
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.05,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ).start();

      } catch (e) {
        console.error('Error parsing result data:', e);
      }
    }

    // Cleanup function to prevent memory leaks
    return () => {
      confettiRefs.current.forEach(anim => {
        if (anim) {
          anim.stopAnimation();
        }
      });
      confettiRefs.current = [];
    };
  }, [resultData]);

  const startConfetti = () => {
    console.log('🎉 Starting confetti celebration!');
    console.log('🎊 Confetti animation initiated');
    setShowConfetti(true);
    confettiRefs.current = Array.from({ length: 25 }, () => new Animated.Value(0));
    
    confettiRefs.current.forEach((anim, index) => {
      const startAnimation = () => {
        Animated.sequence([
          Animated.delay(index * 40),
          Animated.parallel([
            Animated.timing(anim, {
              toValue: 1,
              duration: 3000,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => {
          // Restart animation for continuous effect without recursion
          anim.setValue(0);
          setTimeout(() => {
            startAnimation();
          }, 100);
        });
      };
      
      startAnimation();
    });
    console.log('🎊 Confetti particles created:', confettiRefs.current.length);
  };


  if (!result) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading results...</Text>
      </LinearGradient>
    );
  }

  const accuracy = (result.correctAnswers / result.totalQuestions) * 100;
  const completion = ((result.correctAnswers + result.wrongAnswers) / result.totalQuestions) * 100;

  const getPerformanceRating = () => {
    if (accuracy >= 90) return 'Excellent!';
    if (accuracy >= 80) return 'Very Good!';
    if (accuracy >= 70) return 'Good!';
    if (accuracy >= 60) return 'Average!';
    return 'Needs Improvement!';
  };

  const getCongratulatoryMessage = () => {
    if (accuracy >= 80) return "Congratulations! You've excelled! 🎉";
    if (accuracy >= 60) return "Well done! You've passed! 🎯";
    return "Keep practicing! You'll improve! 😔";
  };

  const getScoreColor = (): [string, string, string] => {
    return ['#667eea', '#764ba2', '#f093fb'];
  };

  const getBackgroundGradient = (): [string, string, string] => {
    return ['#FAFBFC', '#F8FAFC', '#F1F5F9']; // Even more faint light gradient
  };

  return (
    <LinearGradient
      colors={getBackgroundGradient()}
      style={styles.container}
    >
      {/* Confetti Background */}
      {showConfetti && (
        <View style={styles.confettiContainer} pointerEvents="none">
          {confettiRefs.current.map((anim, index) => (
            <Animated.View
              key={`confetti-${index}`}
              style={[
                styles.confetti,
                {
                  backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'][index % 10],
                  left: Math.random() * width,
                  transform: [
                    {
                      translateY: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-50, height + 50],
                      }),
                    },
                    {
                      rotate: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
      )}

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View 
          style={[
            styles.resultContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>{result.examTitle}</Text>
          </View>

          {/* Main Score Circle */}
          <View style={styles.scoreCircleContainer}>
            {/* Animated Background Elements */}
            <Animated.View 
              style={[
                styles.animatedBg1,
                {
                  transform: [
                    {
                      rotate: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View 
              style={[
                styles.animatedBg2,
                {
                  transform: [
                    {
                      rotate: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['360deg', '0deg'],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View 
              style={[
                styles.animatedBg3,
                {
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1.2],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View 
              style={[
                styles.animatedBg4,
                {
                  transform: [
                    {
                      rotate: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '-360deg'],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View 
              style={[
                styles.animatedBg5,
                {
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1.2, 0.8],
                      }),
                    },
                  ],
                },
              ]}
            />
            
            <Animated.View 
              style={[
                styles.scoreCircle,
                { transform: [{ scale: scoreAnim }] }
              ]}
            >
              <LinearGradient
                colors={getScoreColor()}
                style={styles.scoreGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.scoreInnerGlow} />
                <Text style={styles.scoreLabel}>Your Score</Text>
                <Text style={styles.scoreValue}>{result.score}</Text>
                <Text style={styles.scoreUnit}>%</Text>
                <Animated.View 
                  style={[
                    styles.performanceBadge,
                    { transform: [{ scale: pulseAnim }] }
                  ]}
                >
                  <Text style={styles.performanceText}>{getPerformanceRating()}</Text>
                </Animated.View>
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Congratulatory Message */}
          <Animated.Text 
            style={[
              styles.congratulatoryMessage,
              { opacity: scoreAnim }
            ]}
          >
            {getCongratulatoryMessage()}
          </Animated.Text>

          {/* Stats Grid */}
          <Animated.View 
            style={[
              styles.statsGrid,
              { opacity: scoreAnim }
            ]}
          >
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#DBEAFE', '#BFDBFE']}
                style={styles.statGradient}
              >
                <View style={[styles.statIconContainer, { backgroundColor: '#60A5FA', borderColor: '#3B82F6' }]}>
                  <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.statValue}>{completion.toFixed(0)}%</Text>
                <Text style={styles.statLabel}>Completion</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={['#FCE7F3', '#FBCFE8']}
                style={styles.statGradient}
              >
                <View style={[styles.statIconContainer, { backgroundColor: '#EC4899', borderColor: '#DB2777' }]}>
                  <Ionicons name="help-circle" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.statValue}>{result.totalQuestions}</Text>
                <Text style={styles.statLabel}>Questions</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={['#D1FAE5', '#A7F3D0']}
                style={styles.statGradient}
              >
                <View style={[styles.statIconContainer, { backgroundColor: '#10B981', borderColor: '#059669' }]}>
                  <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.statValue}>{result.correctAnswers}</Text>
                <Text style={styles.statLabel}>Correct</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={['#FEE2E2', '#FECACA']}
                style={styles.statGradient}
              >
                <View style={[styles.statIconContainer, { backgroundColor: '#EF4444', borderColor: '#DC2626' }]}>
                  <Ionicons name="close-circle" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.statValue}>{result.wrongAnswers}</Text>
                <Text style={styles.statLabel}>Wrong</Text>
              </LinearGradient>
            </View>
          </Animated.View>

          {/* Performance Breakdown with Donut Chart */}
          <Animated.View 
            style={[
              styles.breakdownCard,
              { opacity: scoreAnim }
            ]}
          >
            <LinearGradient
              colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']}
              style={styles.breakdownGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Animated Background Elements */}
              <Animated.View 
                style={[
                  styles.breakdownBg1,
                  {
                    opacity: breakdownAnim,
                    transform: [
                      {
                        scale: breakdownAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View 
                style={[
                  styles.breakdownBg2,
                  {
                    opacity: breakdownAnim,
                    transform: [
                      {
                        rotate: breakdownAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View 
                style={[
                  styles.breakdownBg3,
                  {
                    opacity: breakdownAnim,
                    transform: [
                      {
                        scale: breakdownAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.2],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View 
                style={[
                  styles.breakdownBg4,
                  {
                    opacity: breakdownAnim,
                    transform: [
                      {
                        rotate: breakdownAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '-360deg'],
                        }),
                      },
                      {
                        scale: breakdownAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1.1],
                        }),
                      },
                    ],
                  },
                ]}
              />

              <View style={styles.breakdownContent}>
                <Animated.Text 
                  style={[
                    styles.breakdownTitle,
                    {
                      opacity: breakdownAnim,
                      transform: [
                        {
                          translateY: breakdownAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  Performance Breakdown
                </Animated.Text>
                
                {/* Donut Chart */}
                <Animated.View 
                  style={[
                    styles.donutChartContainer,
                    {
                      opacity: donutAnim,
                      transform: [
                        {
                          scale: donutAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Animated.View 
                    style={[
                      styles.donutChart,
                      { transform: [{ scale: scoreAnim }] }
                    ]}
                  >
                    <LinearGradient
                      colors={['#FFFFFF', '#F8FAFC']}
                      style={styles.donutChartGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.donutChartInner}>
                        <Text style={styles.donutChartText}>{accuracy.toFixed(0)}%</Text>
                      </View>
                      <View style={styles.donutChartSegments}>
                        {/* Wrong Answers (Background) */}
                        <View 
                          style={[
                            styles.donutSegment, 
                            { 
                              backgroundColor: '#EF4444',
                              width: '100%',
                              height: '100%',
                              borderRadius: 70,
                              position: 'absolute',
                            }
                          ]} 
                        />
                        {/* Correct Answers (Progress) */}
                        <View 
                          style={[
                            styles.donutSegment, 
                            { 
                              backgroundColor: '#10B981',
                              width: '100%',
                              height: '100%',
                              borderRadius: 70,
                              position: 'absolute',
                              transform: [
                                { rotate: '-90deg' },
                                { scale: (result.correctAnswers / result.totalQuestions) }
                              ],
                            }
                          ]} 
                        />
                      </View>
                    </LinearGradient>
                  </Animated.View>
                </Animated.View>

                {/* Legend */}
                <Animated.View 
                  style={[
                    styles.legendContainer,
                    {
                      opacity: donutAnim,
                      transform: [
                        {
                          translateY: donutAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [10, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.legendText}>Correct</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                    <Text style={styles.legendText}>Wrong</Text>
                  </View>
                </Animated.View>

                {/* Current Rank Section */}
                <Animated.View 
                  style={[
                    styles.rankSection,
                    {
                      opacity: rankAnim,
                      transform: [
                        {
                          translateY: rankAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Text style={styles.sectionTitle}>Current Rank</Text>
                  
                  <View style={styles.rankContainer}>
                    <View style={styles.rankIconContainer}>
                      <Ionicons name="trophy" size={32} color="#F59E0B" />
                    </View>
                    <View style={styles.rankInfo}>
                      <Text style={styles.rankNumber}>#{result.currentRank}</Text>
                      <Text style={styles.rankLabel}>Your Position</Text>
                    </View>
                  </View>

                  <View style={styles.prizeInfo}>
                    <Text style={styles.prizeLabel}>Prize Amount</Text>
                    <Text style={styles.prizeAmount}>₹{result.prizeAmount.toLocaleString()}</Text>
                  </View>
                </Animated.View>
              </View>
            </LinearGradient>
          </Animated.View>

        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    marginTop: 12,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 40,
    flexGrow: 1,
  },
  resultContainer: {
    paddingVertical: 20,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    color: '#1E293B',
    fontWeight: '800',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  examTitle: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '500',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scoreCircleContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  scoreCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 20,
    position: 'relative',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  scoreGradient: {
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  scoreLabel: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  scoreValue: {
    fontSize: 56,
    color: '#FFFFFF',
    fontWeight: 'bold',
    lineHeight: 56,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  scoreUnit: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: -8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  performanceBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  performanceText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  congratulatoryMessage: {
    fontSize: 24,
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '700',
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.8,
    lineHeight: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    width: '48%',
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  statGradient: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  statValue: {
    fontSize: 28,
    color: '#1E293B',
    fontWeight: '800',
    marginBottom: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  breakdownCard: {
    borderRadius: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  breakdownGradient: {
    borderRadius: 24,
    padding: 24,
  },
  breakdownContent: {
    alignItems: 'center',
  },
  breakdownTitle: {
    fontSize: 26,
    color: '#1E293B',
    fontWeight: '800',
    marginBottom: 24,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.8,
  },
  donutChartContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  donutChart: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  donutChartGradient: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutChartInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  donutChartText: {
    fontSize: 20,
    color: '#1E293B',
    fontWeight: 'bold',
  },
  donutChartSegments: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 70,
  },
  donutSegment: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 70,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  legendText: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '600',
  },
  subjectSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
    marginBottom: 16,
  },
  subjectItem: {
    marginBottom: 16,
  },
  subjectInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  subjectName: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  subjectScore: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  subjectBar: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  subjectFill: {
    height: '100%',
    borderRadius: 3,
  },
  animatedBg1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    top: -30,
    right: -30,
    zIndex: -1,
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  animatedBg2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    bottom: -40,
    right: -40,
    zIndex: -1,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  animatedBg3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(236, 72, 153, 0.08)',
    top: 0,
    right: 0,
    zIndex: -1,
    shadowColor: 'rgba(255, 255, 255, 0.5)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 4,
  },
  animatedBg4: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    top: -20,
    left: -20,
    zIndex: -1,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  animatedBg5: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    bottom: 0,
    left: 0,
    zIndex: -1,
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreInnerGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -20,
    left: -20,
    zIndex: -1,
    shadowColor: 'rgba(255, 255, 255, 0.5)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 5,
  },
  rankSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rankIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rankInfo: {
    alignItems: 'flex-start',
  },
  rankNumber: {
    fontSize: 32,
    color: '#1E293B',
    fontWeight: '800',
    lineHeight: 40,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  rankLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  prizeInfo: {
    alignItems: 'center',
  },
  prizeLabel: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 8,
  },
  prizeAmount: {
    fontSize: 32,
    color: '#1E293B',
    fontWeight: '800',
    lineHeight: 40,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  breakdownBg1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(236, 72, 153, 0.08)',
    top: -20,
    left: -20,
    zIndex: -1,
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  breakdownBg2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    bottom: -40,
    right: -40,
    zIndex: -1,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  breakdownBg3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    top: 0,
    right: 0,
    zIndex: -1,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  breakdownBg4: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    bottom: -20,
    left: -20,
    zIndex: -1,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
}); 