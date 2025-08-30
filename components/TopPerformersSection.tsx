import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface Performer {
    id: string;
    name: string;
    score: number;
    rank: number;
    avatar: string;
    level: string;
    examsTaken: number;
}

interface TopPerformersSectionProps {
    onPress?: () => void;
}

const TopPerformersSection: React.FC<TopPerformersSectionProps> = ({ onPress }) => {
    const cardAnimation = useRef(new Animated.Value(0)).current;
    const trophyAnimation = useRef(new Animated.Value(0)).current;
    const crownAnimation = useRef(new Animated.Value(0)).current;
    const floatingAnimation = useRef(new Animated.Value(0)).current;
    
    // Header animations - same as Offer Soon
    const headerSparkleAnim = useRef(new Animated.Value(0)).current;
    const headerFloatAnim = useRef(new Animated.Value(0)).current;



    // Dummy data for top performers
    const topPerformers: Performer[] = [
        {
            id: '1',
            name: 'Rahul Sharma',
            score: 2850,
            rank: 1,
            avatar: '👨‍💼',
            level: 'Expert',
            examsTaken: 45
        },
        {
            id: '2',
            name: 'Priya Singh',
            score: 2720,
            rank: 2,
            avatar: '👩‍💼',
            level: 'Advanced',
            examsTaken: 38
        },
        {
            id: '3',
            name: 'Amit Kumar',
            score: 2580,
            rank: 3,
            avatar: '👨‍🎓',
            level: 'Advanced',
            examsTaken: 42
        },
        {
            id: '4',
            name: 'Sneha Patel',
            score: 2450,
            rank: 4,
            avatar: '👩‍🎓',
            level: 'Intermediate',
            examsTaken: 35
        },
        {
            id: '5',
            name: 'Arjun Reddy',
            score: 2380,
            rank: 5,
            avatar: '👨‍💻',
            level: 'Intermediate',
            examsTaken: 33
        }
    ];

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
        const cardEntrance = Animated.stagger(200, 
            topPerformers.map((_, index) =>
                Animated.timing(cardAnimation, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                })
            )
        );

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
                return '🏆';
            case 2:
                return '🥈';
            case 3:
                return '🥉';
            default:
                return '⭐';
        }
    };

    const getRankColors = (rank: number): [string, string] => {
        switch (rank) {
            case 1:
                return ['#FFD700', '#FFA500']; // Gold
            case 2:
                return ['#C0C0C0', '#A8A8A8']; // Silver
            case 3:
                return ['#CD7F32', '#B8860B']; // Bronze
            default:
                return ['#E8E8E8', '#D0D0D0']; // Default
        }
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'Expert':
                return '#10B981';
            case 'Advanced':
                return '#3B82F6';
            case 'Intermediate':
                return '#F59E0B';
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
                        colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
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
                                colors={['#FFD700', '#FF6B6B']}
                                style={styles.iconGradient}
                            >
                                <Animated.View
                                    style={[
                                        {
                                            transform: [{ scale: trophyScale }]
                                        }
                                    ]}
                                >
                                    <Ionicons name="trophy" size={22} color="#FFFFFF" />
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
                                <Text style={styles.headerTitle}>Top Performers</Text>
                                <Text style={styles.headerSubtitle}>This week's champions</Text>
                            </Animated.View>
                    </View>
                    <TouchableOpacity style={styles.viewAllButton} onPress={onPress}>
                        <LinearGradient
                            colors={['#FFD700', '#FF6B6B']}
                            style={styles.viewAllGradient}
                        >
                            <Text style={styles.viewAllText}>View All</Text>
                            <Ionicons name="chevron-forward" size={15} color="#FFFFFF" />
                        </LinearGradient>
                    </TouchableOpacity>
                </LinearGradient>

                {/* Top 3 Podium */}
                <View style={styles.podiumContainer}>
                    {topPerformers.slice(0, 3).map((performer, index) => {
                        const isWinner = performer.rank === 1;
                        const podiumHeight = isWinner ? 80 : performer.rank === 2 ? 60 : 40;
                        
                        return (
                            <Animated.View
                                key={performer.id}
                                style={[
                                    styles.podiumItem,
                                    {
                                        transform: [
                                            { scale: cardAnimation },
                                            { translateY: floatingTranslateY }
                                        ],
                                        opacity: cardAnimation,
                                    }
                                ]}
                            >
                                <View style={styles.performerCard}>
                                    <View style={styles.avatarContainer}>
                                        <Text style={styles.avatar}>{performer.avatar}</Text>
                                        <View style={styles.rankBadge}>
                                            <Text style={styles.rankIcon}>{getRankIcon(performer.rank)}</Text>
                                        </View>
                                        {isWinner && (
                                            <>
                                                <Animated.View
                                                    style={[
                                                        styles.winnerCrown,
                                                        {
                                                            transform: [
                                                                { translateY: crownTranslateY },
                                                                { scale: trophyScale }
                                                            ],
                                                        }
                                                    ]}
                                                >
                                                    <Text style={styles.crownEmoji}>👑</Text>
                                                </Animated.View>

                                            </>
                                        )}
                                    </View>
                                    <Text style={styles.performerName} numberOfLines={1}>
                                        {performer.name.split(' ')[0]}
                                    </Text>
                                    <View style={styles.scoreContainer}>
                                        <Text style={styles.scoreText}>{performer.score.toLocaleString()}</Text>
                                        <Text style={styles.scoreLabel}>pts</Text>
                                    </View>
                                </View>
                                <LinearGradient
                                    colors={getRankColors(performer.rank)}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[styles.podium, { height: podiumHeight }]}
                                >
                                    <View style={styles.podiumContent}>
                                        <Text style={styles.podiumRank}>{performer.rank}</Text>
                                        {isWinner && (
                                            <Animated.View
                                                style={[
                                                    styles.winnerGlow,
                                                    {
                                                        opacity: 0.6,
                                                        transform: [{ scale: 1.1 }]
                                                    }
                                                ]}
                                            />
                                        )}
                                    </View>
                                </LinearGradient>
                            </Animated.View>
                        );
                    })}
                </View>

                {/* Other Performers List */}
                <View style={styles.otherPerformers}>
                    {topPerformers.slice(3).map((performer, index) => (
                        <Animated.View
                            key={performer.id}
                            style={[
                                styles.performerRow,
                                {
                                    transform: [{ translateY: cardAnimation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [50, 0],
                                    })}],
                                    opacity: cardAnimation,
                                }
                            ]}
                        >
                            <View style={styles.performerLeft}>
                                <View style={styles.rankNumber}>
                                    <Text style={styles.rankText}>{performer.rank}</Text>
                                </View>
                                <Text style={styles.performerAvatar}>{performer.avatar}</Text>
                                <View style={styles.performerInfo}>
                                    <Text style={styles.performerRowName}>{performer.name}</Text>
                                    <View style={styles.levelContainer}>
                                        <View style={[styles.levelDot, { backgroundColor: getLevelColor(performer.level) }]} />
                                        <Text style={styles.levelText}>{performer.level}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.performerRight}>
                                <Text style={styles.performerScore}>{performer.score.toLocaleString()}</Text>
                                <Text style={styles.examCount}>{performer.examsTaken} exams</Text>
                            </View>
                        </Animated.View>
                    ))}
                </View>
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
        borderColor: 'rgba(255, 215, 0, 0.4)',
        shadowColor: '#FFD700',
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
        color: '#FF6B35',
        textShadowColor: 'rgba(255, 107, 53, 0.4)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        letterSpacing: 0.5,
    },
    scoreLabel: {
        fontSize: 11,
        color: '#4A5568',
        fontWeight: '700',
        letterSpacing: 0.4,
        textShadowColor: 'rgba(255, 107, 53, 0.1)',
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
        textShadowColor: 'rgba(255, 107, 53, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },
    performerRight: {
        alignItems: 'flex-end',
    },
    performerScore: {
        fontSize: 17,
        fontWeight: '900',
        color: '#FF6B35',
        textShadowColor: 'rgba(255, 107, 53, 0.4)',
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
        textShadowColor: 'rgba(255, 107, 53, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },
});

export default TopPerformersSection;
