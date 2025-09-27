import { apiFetchAuth } from '@/constants/api';
import { AppColors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ExamCard from '../../../components/ExamCard';

const ExamDetailScreen = () => {
    const { id, from, status } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    
    
    const [exam, setExam] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string|null>(null);
    const [activeTab, setActiveTab] = useState('Info');

    const [winnings, setWinnings] = useState<any[]>([]);
    const [winningsLoading, setWinningsLoading] = useState(false);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [leaderboardLoading, setLeaderboardLoading] = useState(false);
    const [isParticipant, setIsParticipant] = useState(false);
    const [participantLoading, setParticipantLoading] = useState(false);

    // Check if user is a participant in this exam
    const checkParticipantStatus = async () => {
        if (!user?.token || !id) return;
        
        try {
            setParticipantLoading(true);
            const response = await apiFetchAuth(`/student/live-exams/${id}/participant`, user.token);
            if (response.ok) {
                setIsParticipant(true);
            } else {
                setIsParticipant(false);
            }
        } catch (error) {
            console.error('Error checking participant status:', error);
            setIsParticipant(false);
        } finally {
            setParticipantLoading(false);
        }
    };

    // Handle start exam for participants
    const handleStartExam = async () => {
        if (!user?.token || !id || !exam) return;
        
        try {
            // Fetch questions
            const questionsRes = await apiFetchAuth(`/student/live-exams/${id}/questions`, user.token);
            if (!questionsRes.ok) {
                throw new Error('Failed to fetch questions');
            }
            
            // Navigate to questions page
            router.push({ 
                pathname: '/(tabs)/live-exam/questions', 
                params: { 
                    id: exam.id, 
                    duration: exam.duration, 
                    questions: JSON.stringify(questionsRes.data) 
                } 
            });
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to start exam.');
        }
    };

    useEffect(() => {
        checkParticipantStatus();
    }, [user?.token, id]);

    useEffect(() => {
        const fetchLeaderboardData = async () => {
            if (!user?.token || !id) return;
            try {
                setLeaderboardLoading(true);
                const response = await apiFetchAuth(`/student/live-exams/${id}/leaderboard`, user.token);
                if (response.ok) {
                    console.log('Leaderboard API Response:', response.data);
                    setCurrentUser(response.data.currentUser);
                    setLeaderboard(response.data.leaderboard || []);
                    
                    // Debug: Log the first few items to check rank structure
                    if (response.data.leaderboard && response.data.leaderboard.length > 0) {
                        console.log('First leaderboard item:', response.data.leaderboard[0]);
                        console.log('Current user data:', response.data.currentUser);
                    }
                } else {
                    console.error("Failed to load leaderboard:", response.data);
                    setLeaderboard([]);
                }
            } catch (e: any) {
                console.error("An error occurred while fetching leaderboard", e);
            } finally {
                setLeaderboardLoading(false);
            }
        };

        if (activeTab === 'Leaderboard') {
            fetchLeaderboardData();
        }
    }, [activeTab, id, user]);

    useEffect(() => {
        const fetchWinningsData = async () => {
            if (!user?.token || !id || winnings.length > 0) return; 
            try {
                setWinningsLoading(true);
                const response = await apiFetchAuth(`/student/live-exams/${id}/winnings`, user.token);
                if (response.ok) {
                    setWinnings(response.data || []);
                } else {
                    console.error("Failed to load winnings: ", response.data);
                    setWinnings([]);
                }
            } catch (e: any) {
                console.error("An error occurred while fetching winnings", e);
            } finally {
                setWinningsLoading(false);
            }
        };

        if (activeTab === 'Winnings') {
            fetchWinningsData();
        }
    }, [activeTab, id, user]);

    useEffect(() => {
        const fetchExamDetails = async () => {
            setExam(null);
            setWinnings([]);
            setLeaderboard([]);
            setActiveTab('Info');
            setError(null);
            setIsParticipant(false);

            if (!user?.token || !id) return;

            const idStr = String(id);
            setLoading(true);
            try {
                // Try generic exams list first
                const response = await apiFetchAuth('/student/exams', user.token);
                let examData: any | null = null;
                if (response.ok && Array.isArray(response.data)) {
                    examData = response.data.find((e: any) => String(e?.id) === idStr);
                }

                // Fallback to live exam details if not found
                if (!examData) {
                    // Prefer a direct exam endpoint; if it fails, try list fallback
                    let liveRes = await apiFetchAuth(`/student/live-exams/${idStr}`, user.token);
                    if (liveRes.ok && liveRes.data) {
                        examData = liveRes.data;
                    } else {
                        liveRes = await apiFetchAuth('/student/live-exams', user.token);
                        if (liveRes.ok && Array.isArray(liveRes.data)) {
                            examData = liveRes.data.find((e: any) => String(e?.id) === idStr || String(e?.examId) === idStr);
                        }
                    }
                }

                if (examData) {
                    // Normalize minimal fields used by this screen
                    const normalized = {
                        ...examData,
                        id: examData.id ?? examData.examId ?? idStr,
                        duration: examData.duration ?? examData.timeLimit ?? 0,
                        questions: examData.questions ?? [],
                        entryFee: examData.entryFee ?? examData.fee ?? 0,
                        createdBy: examData.createdBy ?? examData.author ?? { name: 'Admin' },
                        startTime: examData.startTime ?? examData.start_date ?? new Date().toISOString(),
                        spots: examData.spots ?? examData.totalSpots ?? 0,
                        spotsLeft: examData.spotsLeft ?? examData.remainingSpots ?? 0,
                    };
                    setExam(normalized);
                    checkParticipantStatus();
                } else {
                    setError('Exam not found.');
                }
            } catch (e: any) {
                setError(e?.data?.message || 'An error occurred.');
            } finally {
                setLoading(false);
            }
        };
        fetchExamDetails();
    }, [id, user]);

    if (loading) {
        return <ActivityIndicator size="large" color={AppColors.primary} style={styles.centered} />;
    }

    if (error || !exam) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error || 'Exam not found.'}</Text>
            </View>
        );
    }
    
    const progress = exam.spots > 0 ? ((exam.spots - exam.spotsLeft) / exam.spots) * 100 : 0;
    
    return (
        <View style={styles.container}>
            <FlatList
                data={[{ key: 'content' }]}
                renderItem={() => (
                    <>
                        <ExamCard exam={exam} hideAttemptButton={String(from) === 'my-exams'} />

                        <View style={styles.tabContainer}>
                            {['Info', 'Leaderboard', 'Winnings'].map(tabName => (
                                <TouchableOpacity 
                                    key={tabName} 
                                    style={[styles.tab, activeTab === tabName && styles.activeTab]}
                                    onPress={() => setActiveTab(tabName)}
                                >
                                    <Text style={[styles.tabText, activeTab === tabName && styles.activeTabText]}>{tabName}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.tabContent}>
                            {activeTab === 'Info' && (
                                <>
                                    <View style={styles.infoTable}>
                                        <InfoRow label="Standard" value="Daily GK & Current Affairs" />
                                        <InfoRow label="Subject" value="GK" />
                                        <InfoRow label="No. of questions" value={exam.questions?.length || 5} />
                                        <InfoRow label="Required Time" value={`${exam.duration} Min`} />
                                        <InfoRow label="Start Date" value={new Date(exam.startTime).toLocaleDateString()} />
                                        <InfoRow label="End Date" value={new Date(new Date(exam.startTime).getTime() + 24 * 60 * 60 * 1000).toLocaleDateString()} />
                                        <InfoRow label="Author" value={exam.createdBy?.name || 'Admin'} />
                                        <InfoRow label="Test Cost" value={`₹ ${exam.entryFee.toFixed(2)}`} isCost />
                                    </View>
                                    
                                    {/* Start Exam Button for Participants - Only show if not completed */}
                                    {isParticipant && status !== 'COMPLETED' && (
                                        <View style={styles.startExamContainer}>
                                            <TouchableOpacity 
                                                style={styles.startExamButton}
                                                onPress={handleStartExam}
                                                disabled={participantLoading}
                                            >
                                                <Ionicons name="play" size={20} color={AppColors.white} />
                                                <Text style={styles.startExamButtonText}>
                                                    {participantLoading ? 'Loading...' : 'Start Exam'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </>
                            )}
                            {activeTab === 'Leaderboard' && (
                                leaderboardLoading ? (
                                     <ActivityIndicator color={AppColors.primary} style={{ marginVertical: 20 }}/>
                                ) : (
                                    <View style={styles.leaderboardContainer}>
                                        {/* TOP PERFORMERS Section */}
                                        <View style={styles.topPerformersSection}>
                                            {/* Animated Background Elements */}
                                            <View style={styles.topPerformersBg}>
                                                <View style={styles.bgCircle1} />
                                                <View style={styles.bgCircle2} />
                                                <View style={styles.bgCircle3} />
                                                <View style={styles.bgDots} />
                                                <View style={styles.bgWave} />
                                            </View>
                                            
                                            <Text style={styles.sectionTitle}>TOP PERFORMERS</Text>
                                            <View style={styles.topPerformersGrid}>
                                                {/* 2nd Place - Left */}
                                                {leaderboard.length > 1 && (
                                                    <View style={styles.secondPlaceCard}>
                                                        <View style={styles.topPerformerBadge}>
                                                            <Text style={styles.topPerformerBadgeText}>2</Text>
                                                        </View>
                                                        <View style={styles.topPerformerAvatar}>
                                                            <Text style={styles.topPerformerAvatarText}>
                                                                {leaderboard[1].name?.charAt(0) || 'U'}
                                                            </Text>
                                                        </View>
                                                        <Text style={styles.topPerformerName}>{leaderboard[1].name}</Text>
                                                        <View style={styles.topPerformerScore}>
                                                            <Ionicons name="trophy" size={14} color="#9CA3AF" />
                                                            <Text style={[styles.topPerformerScoreText, { color: '#9CA3AF' }]}>
                                                                {leaderboard[1].score}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                )}
                                                
                                                {/* 1st Place - Center (Larger) */}
                                                {leaderboard.length > 0 && (
                                                    <View style={styles.firstPlaceCard}>
                                                        <View style={[styles.topPerformerBadge, { backgroundColor: '#FFD700' }]}>
                                                            <Text style={styles.topPerformerBadgeText}>1</Text>
                                                        </View>
                                                        <View style={styles.firstPlaceAvatar}>
                                                            <Text style={styles.firstPlaceAvatarText}>
                                                                {leaderboard[0].name?.charAt(0) || 'U'}
                                                            </Text>
                                                            <View style={styles.crownIcon}>
                                                                <Ionicons name="star" size={20} color="#FFD700" />
                                                            </View>
                                                        </View>
                                                        <Text style={styles.firstPlaceName}>{leaderboard[0].name}</Text>
                                                        <View style={styles.topPerformerScore}>
                                                            <Ionicons name="trophy" size={16} color="#FFD700" />
                                                            <Text style={[styles.firstPlaceScoreText, { color: '#FFD700' }]}>
                                                                {leaderboard[0].score}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                )}
                                                
                                                {/* 3rd Place - Right */}
                                                {leaderboard.length > 2 && (
                                                    <View style={styles.thirdPlaceCard}>
                                                        <View style={styles.topPerformerBadge}>
                                                            <Text style={styles.topPerformerBadgeText}>3</Text>
                                                        </View>
                                                        <View style={styles.topPerformerAvatar}>
                                                            <Text style={styles.topPerformerAvatarText}>
                                                                {leaderboard[2].name?.charAt(0) || 'U'}
                                                            </Text>
                                                        </View>
                                                        <Text style={styles.topPerformerName}>{leaderboard[2].name}</Text>
                                                        <View style={styles.topPerformerScore}>
                                                            <Ionicons name="trophy" size={14} color="#9CA3AF" />
                                                            <Text style={[styles.topPerformerScoreText, { color: '#9CA3AF' }]}>
                                                                {leaderboard[2].score}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                )}
                                            </View>
                                        </View>

                                        {/* ALL PLAYERS Section */}
                                        <View style={styles.allPlayersSection}>
                                            <View style={styles.allPlayersHeader}>
                                                <Text style={styles.sectionTitle}>TOP 10 PLAYERS</Text>
                                                <TouchableOpacity style={styles.filterButton}>
                                                    <Text style={styles.filterButtonText}>This Week</Text>
                                                    <Ionicons name="chevron-down" size={14} color="#3B82F6" />
                                                </TouchableOpacity>
                                            </View>
                                            
                                            <FlatList
                                                data={leaderboard.slice(3, Math.min(13, leaderboard.length))}
                                                keyExtractor={(item) => item.userId}
                                                renderItem={({ item, index }) => {
                                                    // Different faint colors for each player
                                                    const playerColors = [
                                                        'rgba(139, 92, 246, 0.08)',   // Purple
                                                        'rgba(245, 158, 11, 0.08)',   // Orange
                                                        'rgba(34, 197, 94, 0.08)',    // Green
                                                        'rgba(236, 72, 153, 0.08)',   // Pink
                                                        'rgba(59, 130, 246, 0.08)',   // Blue
                                                        'rgba(168, 85, 247, 0.08)',   // Violet
                                                        'rgba(16, 185, 129, 0.08)',   // Emerald
                                                        'rgba(239, 68, 68, 0.08)',    // Red
                                                        'rgba(14, 165, 233, 0.08)',   // Sky
                                                        'rgba(251, 146, 60, 0.08)',   // Amber
                                                    ];
                                                    
                                                    return (
                                                        <View style={[
                                                            styles.playerRow,
                                                            { backgroundColor: playerColors[index % playerColors.length] },
                                                            item.userId === user?.id && styles.currentUserRowHighlight
                                                        ]}>
                                                            <View style={[
                                                                styles.playerRankBadge,
                                                                item.userId === user?.id && styles.currentUserRankBadge
                                                            ]}>
                                                                <Text style={styles.playerRankText}>{index + 4}</Text>
                                                            </View>
                                                            <View style={styles.playerAvatar}>
                                                                <Text style={styles.playerAvatarText}>
                                                                    {item.name?.charAt(0) || 'U'}
                                                                </Text>
                                                            </View>
                                                            <View style={styles.playerInfo}>
                                                                <Text style={styles.playerName}>{item.name}</Text>
                                                                <Text style={styles.playerLevel}>Level {Math.floor(Math.random() * 30) + 1}</Text>
                                                            </View>
                                                            <View style={styles.playerScore}>
                                                                <Ionicons name="trophy" size={16} color="#8B5CF6" />
                                                                <Text style={styles.playerScoreText}>{item.score}</Text>
                                                            </View>
                                                        </View>
                                                    );
                                                }}
                                                ListEmptyComponent={() => (
                                                    <View style={styles.emptyState}>
                                                        <Text style={styles.emptyText}>No players found</Text>
                                                    </View>
                                                )}
                                            />
                                        </View>
                                    </View>
                                )
                            )}
                            {activeTab === 'Winnings' && (
                                winningsLoading ? (
                                    <ActivityIndicator color={AppColors.primary} style={{ marginVertical: 20 }}/>
                                ) : (
                                    <View style={styles.winningsContainer}>
                                        <View style={styles.winningsHeader}>
                                            <Text style={styles.winningsHeaderText}>Rank</Text>
                                            <Text style={styles.winningsHeaderText}>Prize</Text>
                                        </View>
                                        
                                        <FlatList
                                            data={(() => {
                                                // Group consecutive ranks with same prize
                                                const groupedWinnings = [];
                                                let currentGroup = null;
                                                
                                                for (let i = 0; i < winnings.length; i++) {
                                                    const item = winnings[i];
                                                    
                                                    if (!currentGroup) {
                                                        currentGroup = {
                                                            startRank: item.rank,
                                                            endRank: item.rank,
                                                            prize: item.prize
                                                        };
                                                    } else if (item.prize === currentGroup.prize) {
                                                        // Same prize, extend the range
                                                        currentGroup.endRank = item.rank;
                                                    } else {
                                                        // Different prize, save current group and start new
                                                        groupedWinnings.push(currentGroup);
                                                        currentGroup = {
                                                            startRank: item.rank,
                                                            endRank: item.rank,
                                                            prize: item.prize
                                                        };
                                                    }
                                                }
                                                
                                                // Add the last group
                                                if (currentGroup) {
                                                    groupedWinnings.push(currentGroup);
                                                }
                                                
                                                return groupedWinnings;
                                            })()}
                                            keyExtractor={(item, index) => `${item.startRank}-${item.endRank}-${index}`}
                                            renderItem={({ item }) => (
                                                <View style={styles.winningRow}>
                                                    <Text style={styles.rankText}>
                                                        {item.startRank === item.endRank ? `#${item.startRank}` : `${item.startRank}-${item.endRank}`}
                                                    </Text>
                                                    <View style={styles.prizeContainer}>
                                                        <Text style={styles.rupeeSymbol}>₹</Text>
                                                        <Text style={styles.prizeText}>{item.prize}</Text>
                                                    </View>
                                                </View>
                                            )}
                                            ListEmptyComponent={() => (
                                                <View style={styles.emptyState}>
                                                    <Text style={styles.emptyText}>No prize distribution information available.</Text>
                                                </View>
                                            )}
                                        />
                                    </View>
                                )
                            )}
                        </View>
                    </>
                )}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const LeaderboardRow = ({ rank, name, score, prizeAmount, isCurrentUser, isTopThree }: any) => {
    // Convert rank to number and ensure it's displayed properly
    const numericRank = typeof rank === 'string' ? parseInt(rank, 10) : rank;
    const displayRank = numericRank !== undefined && numericRank !== null && !isNaN(numericRank) ? numericRank : 'N/A';
    const rankColor = isTopThree && numericRank && numericRank <= 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][numericRank - 1] : '#6c757d';
    
    console.log('LeaderboardRow render:', { 
        originalRank: rank, 
        numericRank, 
        displayRank, 
        name, 
        score, 
        isTopThree,
        rankType: typeof rank,
        numericRankType: typeof numericRank
    });
    
    return (
        <View style={[styles.leaderboardRow, isCurrentUser && styles.currentUserRow]}>
            <View style={styles.rankContainer}>
                {isTopThree && numericRank && numericRank <= 3 ? (
                    <Ionicons name="trophy" size={24} color={rankColor} />
                ) : (
                    <Text style={styles.leaderboardRankText}>RANK: {displayRank}</Text>
                )}
            </View>
            <Ionicons name="person-circle-outline" size={40} color={AppColors.grey} style={styles.avatar} />
            <Text style={styles.leaderboardNameText} numberOfLines={1}>{name || 'Unknown User'}</Text>
            <View style={styles.scoreContainer}>
                <Text style={styles.leaderboardScoreText}>{score || 0} PTS</Text>
                {prizeAmount > 0 && (
                    <Text style={styles.prizeAmountText}>₹{prizeAmount}</Text>
                )}
            </View>
        </View>
    );
};

const WinningRow = ({ rank, prize }: { rank: number, prize: number }) => (
    <View style={styles.winningRow}>
        <Text style={styles.rankText}>#{rank}</Text>
        <View style={styles.prizeContainer}>
            <Text style={styles.rupeeSymbol}>₹</Text>
            <Text style={styles.prizeText}>{prize}</Text>
        </View>
    </View>
);

const InfoRow = ({ label, value, isCost = false }: any) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, isCost && styles.infoValueCost]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: 'red', fontSize: 16 },
    container: {
        flex: 1,
        backgroundColor: AppColors.lightGrey,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: AppColors.white,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.lightGrey,
    },
    backButton: {
       marginRight: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
    },
    prizePoolSection: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: AppColors.primary,
        margin: 15,
        borderRadius: 15,
        shadowColor: AppColors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    prizePoolLabel: {
        color: AppColors.white,
        fontSize: 14,
        opacity: 0.9,
    },
    prizePoolAmountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    prizePoolAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: AppColors.white,
        textShadowColor: 'rgba(0,0,0,0.1)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    spotsContainer: {
        paddingHorizontal: 20,
        marginTop: 10,
        backgroundColor: AppColors.white,
        marginHorizontal: 15,
        borderRadius: 12,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    progressBar: {
        height: 10,
        backgroundColor: AppColors.lightGrey,
        borderRadius: 5,
        overflow: 'hidden',
        marginTop: 8,
    },
    progress: {
        height: '100%',
        backgroundColor: '#5DADE2',
        borderRadius: 5,
    },
    spotsTextContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    spotsLeft: {
        color: '#E67E22',
        fontSize: 12,
        fontWeight: '600',
    },
    totalSpots: {
        color: AppColors.grey,
        fontSize: 12,
        fontWeight: '500',
    },
    tagsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 15,
        backgroundColor: AppColors.white,
        marginHorizontal: 15,
        borderRadius: 12,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15,
        backgroundColor: AppColors.lightGrey,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    tagText: {
        marginLeft: 4,
        color: AppColors.darkGrey,
        fontSize: 11,
        fontWeight: '500',
    },
    remainingTime: {
        color: '#E74C3C',
        fontSize: 12,
        marginLeft: 'auto',
        fontWeight: '600',
    },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: AppColors.white,
        margin: 15,
        borderRadius: 12,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    tab: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: AppColors.primary,
        shadowColor: AppColors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    tabText: {
        color: AppColors.grey,
        fontWeight: '600',
        fontSize: 13,
    },
    activeTabText: {
        color: AppColors.white,
        fontWeight: '700',
    },
    tabContent: {
        backgroundColor: AppColors.white,
        marginHorizontal: 15,
        borderRadius: 16,
        padding: 18,
        marginBottom: 100,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.1)',
    },
    infoTable: {
        backgroundColor: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.1)',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(99, 102, 241, 0.08)',
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 8,
        marginBottom: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    infoLabel: {
        color: '#374151',
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.2,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    infoValue: {
        fontWeight: '700',
        color: '#1F2937',
        fontSize: 14,
        textAlign: 'right',
        letterSpacing: 0.2,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    infoValueCost: {
        color: '#059669',
        fontWeight: '800',
        fontSize: 15,
        textAlign: 'right',
        letterSpacing: 0.3,
        textShadowColor: 'rgba(5, 150, 105, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    winningsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 2,
        borderBottomColor: 'rgba(99, 102, 241, 0.1)',
        backgroundColor: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
    },
    winningsHeaderText: {
        color: '#374151',
        fontWeight: '700',
        fontSize: 16,
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    winningRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(99, 102, 241, 0.05)',
        marginBottom: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    rankText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        letterSpacing: 0.3,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    prizeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'linear-gradient(135deg, #E8F5E9 0%, #D1FAE5 100%)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(5, 150, 105, 0.2)',
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    rupeeSymbol: {
        color: '#059669',
        fontSize: 18,
        fontWeight: '800',
        marginRight: 4,
        textShadowColor: 'rgba(5, 150, 105, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    prizeText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#047857',
        letterSpacing: 0.3,
        textShadowColor: 'rgba(5, 150, 105, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    leaderboardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    currentUserRow: {
        backgroundColor: '#E9E7FD',
        borderColor: AppColors.primary,
        borderWidth: 1.5,
    },
    rankContainer: {
        width: 50,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0', // Temporary background to see the container
    },
    leaderboardRankText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
        backgroundColor: '#e0e0e0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    avatar: {
        marginHorizontal: 10,
    },
    leaderboardNameText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: AppColors.darkGrey,
    },
    leaderboardScoreText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: AppColors.primary,
    },
    placeholderText: {
        color: AppColors.grey,
        fontSize: 14,
        textAlign: 'center',
    },
    currentUserSection: {
        padding: 20,
        backgroundColor: AppColors.white,
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    currentUserTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
        marginBottom: 10,
    },
    leaderboardSection: {
        padding: 20,
        backgroundColor: AppColors.white,
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    leaderboardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
        marginBottom: 10,
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    prizeAmountText: {
        color: AppColors.primary,
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    startExamContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    startExamButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: AppColors.primary,
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 10,
        shadowColor: AppColors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    startExamButtonText: {
        color: AppColors.white,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    leaderboardContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 10,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
    leaderboardHeader: {
        backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 20,
        marginBottom: 0,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
    },
    leaderboardHeaderTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    headerIcons: {
        flexDirection: 'row',
        gap: 10,
    },
    headerIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    yourRankCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        padding: 18,
        marginBottom: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        backdropFilter: 'blur(10px)',
    },
    yourRankLabel: {
        color: '#374151',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    yourRankContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    yourRankAvatar: {
        position: 'relative',
        marginRight: 14,
    },
    avatarImage: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#667eea',
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 3,
    },
    avatarText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#667eea',
    },
    rankBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#667eea',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    rankBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    yourRankInfo: {
        flex: 1,
    },
    yourRankName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 5,
    },
    yourRankScore: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    yourRankScoreText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#F59E0B',
        marginLeft: 5,
    },
    weeklyChange: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    weeklyChangeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#059669',
        marginLeft: 3,
    },
    topPerformersSection: {
        padding: 0,
        backgroundColor: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
        marginBottom: 0,
        marginTop: 0,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
        marginTop: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    topPerformersGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 8,
        paddingBottom: 8,
    },
    firstPlaceCard: {
        width: '42%',
        backgroundColor: 'linear-gradient(135deg, #FFFFFF 0%, #FEF3C7 100%)',
        borderRadius: 12,
        padding: 10,
        alignItems: 'center',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        position: 'relative',
        marginBottom: 0,
        borderWidth: 2,
        borderColor: '#F59E0B',
    },
    firstPlaceAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
        position: 'relative',
        borderWidth: 3,
        borderColor: '#F59E0B',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    firstPlaceAvatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#92400E',
    },
    firstPlaceName: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 2,
        textAlign: 'center',
    },
    firstPlaceScoreText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#D97706',
        marginLeft: 5,
    },
    secondPlaceCard: {
        width: '27%',
        backgroundColor: 'linear-gradient(135deg, #FFFFFF 0%, #FEF3C7 100%)',
        borderRadius: 12,
        padding: 8,
        alignItems: 'center',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        position: 'relative',
        marginBottom: 0,
        borderWidth: 2,
        borderColor: '#F59E0B',
    },
    thirdPlaceCard: {
        width: '27%',
        backgroundColor: 'linear-gradient(135deg, #FFFFFF 0%, #FCE7F3 100%)',
        borderRadius: 12,
        padding: 8,
        alignItems: 'center',
        shadowColor: '#EC4899',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        position: 'relative',
        marginBottom: 0,
        borderWidth: 2,
        borderColor: '#EC4899',
    },
    topPerformerBadge: {
        position: 'absolute',
        top: -8,
        left: -8,
        backgroundColor: '#6B7280',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    topPerformerBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    topPerformerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
        position: 'relative',
        borderWidth: 2,
        borderColor: '#F59E0B',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 3,
    },
    topPerformerAvatarText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#374151',
    },
    topPerformerName: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#92400E',
        marginBottom: 2,
        textAlign: 'center',
    },
    topPerformerScore: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    topPerformerScoreText: {
        fontSize: 11,
        fontWeight: 'bold',
        marginLeft: 3,
        color: '#D97706',
    },
    allPlayersSection: {
        padding: 20,
        backgroundColor: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    allPlayersHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#BFDBFE',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    filterButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E40AF',
        marginRight: 5,
    },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
        borderRadius: 10,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    currentUserRowHighlight: {
        backgroundColor: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
        borderColor: '#667eea',
        borderWidth: 2,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    playerRankBadge: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        shadowColor: '#5B21B6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    currentUserRankBadge: {
        backgroundColor: 'linear-gradient(135deg, #667eea 0%, #5B21B6 100%)',
        borderColor: '#FFFFFF',
        borderWidth: 3,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    playerRankText: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        letterSpacing: 0.5,
    },
    playerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 2,
        borderColor: '#9CA3AF',
    },
    playerAvatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
    },
    playerInfo: {
        flex: 1,
        marginRight: 12,
    },
    playerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 3,
    },
    playerLevel: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    playerScore: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    playerScoreText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#7C3AED',
        marginLeft: 5,
    },
    emptyState: {
        padding: 32,
        alignItems: 'center',
    },
    emptyText: {
        color: '#374151',
        fontSize: 16,
        fontWeight: '500',
    },
    crownIcon: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        backgroundColor: '#FFD700',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
    },
    topPerformersBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        zIndex: -1,
    },
    bgCircle1: {
        position: 'absolute',
        top: -20,
        right: -30,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(139, 92, 246, 0.08)',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    bgCircle2: {
        position: 'absolute',
        bottom: -40,
        left: -20,
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(245, 158, 11, 0.06)',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    bgCircle3: {
        position: 'absolute',
        top: 50,
        left: 50,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(34, 197, 94, 0.07)',
        shadowColor: '#22C55E',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 2,
    },
    bgDots: {
        position: 'absolute',
        top: 120,
        right: 60,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(236, 72, 153, 0.05)',
        shadowColor: '#EC4899',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 1,
    },
    bgWave: {
        position: 'absolute',
        bottom: -10,
        left: 0,
        right: 0,
        height: 60,
        backgroundColor: 'rgba(99, 102, 241, 0.04)',
        borderRadius: 30,
        transform: [{ scaleX: 1.2 }],
    },
    winningsContainer: {
        backgroundColor: AppColors.white,
        borderRadius: 16,
        marginBottom: 10,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
});

export default ExamDetailScreen;