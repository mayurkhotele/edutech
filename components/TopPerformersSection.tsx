import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { apiFetchAuth } from '../constants/api';
import { useAuth } from '../context/AuthContext';

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

interface TopPerformersSectionProps {
    onPress?: () => void;
}

const TopPerformersSection: React.FC<TopPerformersSectionProps> = ({ onPress }) => {
    const { user } = useAuth();
    const [leaderboardData, setLeaderboardData] = useState<WeeklyLeaderboardData | null>(null);
    const [loading, setLoading] = useState(true);
    
    const cardAnimation = useRef(new Animated.Value(0)).current;
    const trophyAnimation = useRef(new Animated.Value(0)).current;
    const crownAnimation = useRef(new Animated.Value(0)).current;
    const floatingAnimation = useRef(new Animated.Value(0)).current;
    
    // Header animations - same as Offer Soon
    const headerSparkleAnim = useRef(new Animated.Value(0)).current;
    const headerFloatAnim = useRef(new Animated.Value(0)).current;

    // Fetch weekly leaderboard data
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
        }
    };

    useEffect(() => {
        fetchLeaderboardData();
    }, [user?.token]);

    useEffect(() => {
        // Header animations - same as Offer Soon
        const headerSparkleAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(headerSparkleAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(headerSparkleAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        );

        const headerFloatAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(headerFloatAnim, {
                    toValue: 1,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(headerFloatAnim, {
                    toValue: 0,
                    duration: 3000,
                    useNativeDriver: true,
                }),
            ])
        );

        // Card entrance animation
        const cardEntrance = Animated.timing(cardAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        });

        // Simple trophy pulse animation
        const trophyPulse = Animated.loop(
            Animated.sequence([
                Animated.timing(trophyAnimation, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(trophyAnimation, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        );

        // Gentle crown floating animation
        const crownFloat = Animated.loop(
            Animated.sequence([
                Animated.timing(crownAnimation, {
                    toValue: 1,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(crownAnimation, {
                    toValue: 0,
                    duration: 3000,
                    useNativeDriver: true,
                }),
            ])
        );

        // Subtle floating cards animation
        const floatingCards = Animated.loop(
            Animated.sequence([
                Animated.timing(floatingAnimation, {
                    toValue: 1,
                    duration: 5000,
                    useNativeDriver: true,
                }),
                Animated.timing(floatingAnimation, {
                    toValue: 0,
                    duration: 5000,
                    useNativeDriver: true,
                }),
            ])
        );

        // Start all animations
        headerSparkleAnimation.start();
        headerFloatAnimation.start();
        cardEntrance.start();
        trophyPulse.start();
        crownFloat.start();
        floatingCards.start();
    }, []);

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return '🎓';
            case 2:
                return '📚';
            case 3:
                return '📜';
            default:
                return '⭐';
        }
    };

    const getRankColors = (rank: number): [string, string] => {
        switch (rank) {
            case 1:
                return ['#10B981', '#059669']; // Green for excellence
            case 2:
                return ['#06B6D4', '#0891B2']; // Blue for achievement
            case 3:
                return ['#8B5CF6', '#7C3AED']; // Purple for progress
            default:
                return ['#E8E8E8', '#D0D0D0']; // Default
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'Scholar':
                return '#10B981';
            case 'Achiever':
                return '#06B6D4';
            case 'Learner':
                return '#8B5CF6';
            default:
                return '#6B7280';
        }
    };

    const trophyScale = trophyAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.1],
    });

    const crownTranslateY = crownAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -5],
    });

    const floatingTranslateY = floatingAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -3],
    });

    // Header animation interpolations - same as Offer Soon
    const headerSparkleTranslateY = headerSparkleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -10],
    });

    const headerFloatTranslateY = headerFloatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -5],
    });





    return (
        <View style={styles.container}>
                            <LinearGradient
                    colors={['#FAFBFF', '#F8F9FF', '#FFFFFF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.sectionBackground}
                >










                                    {/* Header with Offer Soon Style Gradient & Animation */}
                    <LinearGradient
                        colors={['#10B981', '#06B6D4', '#4F46E5']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.headerGradient}
                    >
                        {/* Animated Background Pattern - same as Offer Soon */}
                        <View style={styles.headerPatternContainer}>
                            {[...Array(8)].map((_, index) => (
                                <Animated.View
                                    key={index}
                                    style={[
                                        styles.headerSparkle,
                                        {
                                            left: `${Math.random() * 100}%`,
                                            top: `${Math.random() * 100}%`,
                                            transform: [
                                                {
                                                    translateY: headerSparkleTranslateY,
                                                },
                                                {
                                                    scale: headerSparkleAnim.interpolate({
                                                        inputRange: [0, 0.5, 1],
                                                        outputRange: [0.8, 1.2, 0.8],
                                                    }),
                                                },
                                            ],
                                            opacity: headerSparkleAnim.interpolate({
                                                inputRange: [0, 0.5, 1],
                                                outputRange: [0.3, 1, 0.3],
                                            }),
                                        },
                                    ]}
                                >
                                    <Text style={styles.sparkleText}>✨</Text>
                                </Animated.View>
                            ))}
                        </View>
                    <View style={styles.headerLeft}>
                        <View style={styles.headerIconContainer}>
                            <LinearGradient
                            colors={['#10B981', '#06B6D4']}
                            style={styles.iconGradient}
                            >
                                <Animated.View
                                    style={[
                                        {
                                            transform: [{ scale: trophyScale }]
                                        }
                                    ]}
                                >
                                    <Ionicons name="school" size={22} color="#FFFFFF" />
                                </Animated.View>
                            </LinearGradient>
                        </View>
                                                    <Animated.View 
                                style={[
                                    styles.headerTextContainer,
                                    {
                                        transform: [{ translateY: headerFloatTranslateY }]
                                    }
                                ]}
                            >
                                <Text style={styles.headerTitle}>Academic Excellence</Text>
                                <Text style={styles.headerSubtitle}>Top learning achievers</Text>
                            </Animated.View>
                    </View>
                    <TouchableOpacity style={styles.viewAllButton} onPress={onPress}>
                        <LinearGradient
                            colors={['#10B981', '#06B6D4']}
                            style={styles.viewAllGradient}
                        >
                            <Text style={styles.viewAllText}>View All</Text>
                            <Ionicons name="chevron-forward" size={15} color="#FFFFFF" />
                        </LinearGradient>
                    </TouchableOpacity>
                </LinearGradient>

                {/* Exam-wise Toppers with Horizontal Scroll */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4F46E5" />
                        <Text style={styles.loadingText}>Loading exam toppers...</Text>
                    </View>
                ) : leaderboardData?.leaderboard && leaderboardData.leaderboard.length > 0 ? (
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.examScrollContainer}
                        style={styles.examScrollView}
                    >
                        {leaderboardData.leaderboard.map((exam, examIndex) => (
                            <Animated.View
                                key={exam.examId}
                                style={[
                                    styles.examCard,
                                    {
                                        transform: [
                                            { scale: cardAnimation },
                                            { translateY: floatingTranslateY }
                                        ],
                                        opacity: cardAnimation,
                                    }
                                ]}
                            >
                                <LinearGradient
                                    colors={['#FFFFFF', '#F8FAFC']}
                                    style={styles.examCardGradient}
                                >
                                    {/* Exam Header */}
                                    <View style={styles.examHeader}>
                                        <View style={styles.examIconContainer}>
                                            <Ionicons name="book" size={20} color="#4F46E5" />
                                        </View>
                                        <View style={styles.examInfoContainer}>
                                            <Text style={styles.examTitle} numberOfLines={2}>
                                                {exam.examTitle}
                                            </Text>
                                            <Text style={styles.examDate}>
                                                {formatDate(exam.examDate)}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Top 5 Winners */}
                                    <View style={styles.winnersContainer}>
                                        {exam.winners.slice(0, 5).map((winner, winnerIndex) => (
                                            <View key={winner.userId} style={styles.winnerItem}>
                                                <View style={styles.winnerRankContainer}>
                                                    <Text style={styles.winnerRank}>{winner.rank}</Text>
                                                </View>
                                                <View style={styles.winnerInfo}>
                                                    <Text style={styles.winnerName} numberOfLines={1}>
                                                        {winner.name.split(' ')[0]}
                                                    </Text>
                                                    <Text style={styles.winnerScore}>
                                                        {winner.score} pts
                                                    </Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>

                                    {/* Exam Stats */}
                                    <View style={styles.examStats}>
                                        <View style={styles.statItem}>
                                            <Text style={styles.statValue}>{exam.totalParticipants}</Text>
                                            <Text style={styles.statLabel}>Participants</Text>
                                        </View>
                                        <View style={styles.statItem}>
                                            <Text style={styles.statValue}>₹{exam.prizePool}</Text>
                                            <Text style={styles.statLabel}>Prize Pool</Text>
                                        </View>
                                    </View>
                                </LinearGradient>
                            </Animated.View>
                        ))}
                    </ScrollView>
                ) : (
                    <View style={styles.noDataContainer}>
                        <Ionicons name="trophy-outline" size={48} color="#9CA3AF" />
                        <Text style={styles.noDataText}>No exam toppers this week</Text>
                        <Text style={styles.noDataSubtext}>Check back after exams are completed</Text>
                    </View>
                )}
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 15,
        marginBottom: 20,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 12,
        borderWidth: 2,
        borderColor: 'rgba(79, 70, 229, 0.2)',
    },
    sectionBackground: {
        backgroundColor: '#FFFFFF',
        padding: 25,
        paddingTop: 25,
        paddingBottom: 30,
        position: 'relative',
    },
    shimmer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        width: 100,
        opacity: 0.6,
    },
    sparkle: {
        position: 'absolute',
        zIndex: 1,
    },
    sparkleText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        textShadowColor: 'rgba(255, 255, 255, 0.8)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 4,
    },



    headerGradient: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
        marginHorizontal: -20,
        marginTop: -20,
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        position: 'relative',
        overflow: 'hidden',
    },
    headerPatternContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
    },
    headerSparkle: {
        position: 'absolute',
        zIndex: 2,
    },

    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        zIndex: 3,
    },
    headerIconContainer: {
        borderRadius: 14,
        marginRight: 14,
        overflow: 'hidden',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 7,
        elevation: 5,
        zIndex: 4,
    },
    iconGradient: {
        padding: 10,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTextContainer: {
        flex: 1,
        zIndex: 3,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        letterSpacing: 0.6,
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '600',
        marginTop: 2,
        letterSpacing: 0.3,
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        includeFontPadding: false,
    },
    viewAllButton: {
        borderRadius: 11,
        overflow: 'hidden',
        zIndex: 3,
    },
    viewAllGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 11,
        paddingVertical: 7,
    },
    viewAllText: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '700',
        marginRight: 7,
        letterSpacing: 0.6,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        includeFontPadding: false,
    },
    podiumContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        marginBottom: 30,
        paddingHorizontal: 15,
        marginTop: 10,
    },
    podiumItem: {
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 6,
    },
    performerCard: {
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        paddingHorizontal: 18,
        marginBottom: 15,
        width: 100,
        borderWidth: 3,
        borderColor: 'rgba(16, 185, 129, 0.4)',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 8,
    },
    winnerCrown: {
        position: 'absolute',
        top: -15,
        left: '50%',
        marginLeft: -8,
        zIndex: 5,
    },
    crownEmoji: {
        fontSize: 16,
        textShadowColor: '#FFD700',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    winnerAura: {
        position: 'absolute',
        top: -20,
        left: -20,
        right: -20,
        bottom: -20,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        borderWidth: 2,
        borderColor: 'rgba(255, 215, 0, 0.3)',
        zIndex: -1,
    },

    avatar: {
        fontSize: 32,
    },
    rankBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    rankIcon: {
        fontSize: 16,
    },
    performerName: {
        fontSize: 14,
        fontWeight: '800',
        color: '#2D3748',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 0.8,
        textShadowColor: 'rgba(255, 215, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
        includeFontPadding: false,
    },
    scoreContainer: {
        alignItems: 'center',
    },
    scoreText: {
        fontSize: 17,
        fontWeight: '900',
        color: '#059669',
        textShadowColor: 'rgba(5, 150, 105, 0.4)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        letterSpacing: 0.5,
    },
    scoreLabel: {
        fontSize: 11,
        color: '#4A5568',
        fontWeight: '700',
        letterSpacing: 0.4,
        textShadowColor: 'rgba(5, 150, 105, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },
    podium: {
        width: 100,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        position: 'relative',
        overflow: 'hidden',
    },
    podiumContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        paddingTop: 5,
    },
    podiumRank: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        zIndex: 2,
        textAlign: 'center',
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
    winnerGlow: {
        position: 'absolute',
        top: -10,
        left: -10,
        right: -10,
        bottom: -10,
        backgroundColor: 'rgba(255, 215, 0, 0.3)',
        borderRadius: 20,
        zIndex: 1,
    },
    otherPerformers: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 2,
        borderColor: 'rgba(79, 70, 229, 0.2)',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    performerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(247, 147, 30, 0.2)',
    },
    performerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    rankNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(79, 70, 229, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        borderWidth: 2,
        borderColor: 'rgba(79, 70, 229, 0.3)',
    },
    rankText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#4F46E5',
        textShadowColor: 'rgba(79, 70, 229, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    performerAvatar: {
        fontSize: 20,
        marginRight: 12,
    },
    performerInfo: {
        flex: 1,
    },
    performerRowName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1A202C',
        marginBottom: 3,
        letterSpacing: 0.5,
        textShadowColor: 'rgba(255, 107, 53, 0.15)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        includeFontPadding: false,
    },
    levelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    levelDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    levelText: {
        fontSize: 12,
        color: '#4A5568',
        fontWeight: '700',
        letterSpacing: 0.3,
        textShadowColor: 'rgba(5, 150, 105, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },
    performerRight: {
        alignItems: 'flex-end',
    },
    performerScore: {
        fontSize: 17,
        fontWeight: '900',
        color: '#059669',
        textShadowColor: 'rgba(5, 150, 105, 0.4)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 3,
        letterSpacing: 0.5,
    },
    examCount: {
        fontSize: 11,
        color: '#4A5568',
        fontWeight: '600',
        marginTop: 3,
        letterSpacing: 0.2,
        textShadowColor: 'rgba(5, 150, 105, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },
    // New styles for exam-wise toppers
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        fontSize: 16,
        color: '#6B7280',
        marginTop: 12,
        fontWeight: '600',
    },
    examScrollView: {
        marginTop: 10,
    },
    examScrollContainer: {
        paddingHorizontal: 15,
        gap: 15,
    },
    examCard: {
        width: 280,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    examCardGradient: {
        padding: 16,
        borderRadius: 16,
    },
    examHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    examIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    examInfoContainer: {
        flex: 1,
    },
    examTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
        lineHeight: 20,
    },
    examDate: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    winnersContainer: {
        marginBottom: 16,
    },
    winnerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: 'rgba(79, 70, 229, 0.05)',
        borderRadius: 8,
        marginBottom: 4,
    },
    winnerRankContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    winnerRank: {
        fontSize: 12,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    winnerInfo: {
        flex: 1,
    },
    winnerName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 1,
    },
    winnerScore: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '500',
    },
    examStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(79, 70, 229, 0.1)',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4F46E5',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '500',
    },
    noDataContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    noDataText: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '600',
        marginTop: 12,
        textAlign: 'center',
    },
    noDataSubtext: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 4,
        textAlign: 'center',
    },
});

export default TopPerformersSection;
