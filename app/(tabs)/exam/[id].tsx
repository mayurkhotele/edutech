import { apiFetchAuth } from '@/constants/api';
import { AppColors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ExamCard from '../../../components/ExamCard';

const ExamDetailScreen = () => {
    const { id } = useLocalSearchParams();
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

    useEffect(() => {
        const fetchLeaderboardData = async () => {
            if (!user?.token || !id) return;
            try {
                setLeaderboardLoading(true);
                const response = await apiFetchAuth(`/student/live-exams/${id}/leaderboard`, user.token);
                if (response.ok) {
                    setCurrentUser(response.data.currentUser);
                    setLeaderboard(response.data.leaderboard || []);
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
            // Reset all data when the ID changes to force a full reload
            setExam(null);
            setWinnings([]);
            setLeaderboard([]);
            setActiveTab('Info');
            setError(null);

            if (!user?.token || !id) return;
            
            setLoading(true);
            try {
                const response = await apiFetchAuth('/student/exams', user.token);
                if (response.ok) {
                    const examData = response.data.find((e: any) => e.id === id);
                    if (examData) {
                        setExam(examData);
                    } else {
                        setError('Exam not found.');
                    }
                } else {
                    setError('Failed to load exam details.');
                }
            } catch (e: any) {
                setError(e.data?.message || 'An error occurred.');
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
                        <ExamCard exam={exam} />
                        <View style={styles.header}>
                            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                                <Ionicons name="chevron-back" size={28} color={AppColors.primary} />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>{exam.title}</Text>
                        </View>
                        
                        <View style={styles.prizePoolSection}>
                            <Text style={styles.prizePoolLabel}>Prize Pool</Text>
                            <View style={styles.prizePoolAmountContainer}>
                                <Text style={styles.prizePoolAmount}>₹ {exam.prizePool.toFixed(1)}*</Text>
                                <Ionicons name="information-circle-outline" size={24} color={AppColors.white} />
                            </View>
                        </View>

                        <View style={styles.spotsContainer}>
                            <View style={styles.progressBar}>
                                <View style={[styles.progress, { width: `${progress}%` }]} />
                            </View>
                            <View style={styles.spotsTextContainer}>
                                <Text style={styles.spotsLeft}>{exam.spotsLeft} Spots left</Text>
                                <Text style={styles.totalSpots}>{exam.spots} Spots</Text>
                            </View>
                        </View>

                        <View style={styles.tagsContainer}>
                            <View style={styles.tag}><Ionicons name="gift-outline" size={16} color="#E67E22" /><Text style={styles.tagText}>145</Text></View>
                            <View style={styles.tag}><Ionicons name="trophy-outline" size={16} color="#9B59B6" /><Text style={styles.tagText}>50%</Text></View>
                            <Text style={styles.remainingTime}>Remaining time: 22:03:45</Text>
                        </View>

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
                            )}
                            {activeTab === 'Leaderboard' && (
                                leaderboardLoading ? (
                                     <ActivityIndicator color={AppColors.primary} style={{ marginVertical: 20 }}/>
                                ) : (
                                    <View>
                                        {/* Current User Section */}
                                        {currentUser && (
                                            <View style={styles.currentUserSection}>
                                                <Text style={styles.currentUserTitle}>Your Position</Text>
                                                <LeaderboardRow
                                                    rank={currentUser.rank}
                                                    name={currentUser.name}
                                                    score={currentUser.score}
                                                    prizeAmount={currentUser.prizeAmount}
                                                    isCurrentUser={true}
                                                    isTopThree={currentUser.rank <= 3}
                                                />
                                            </View>
                                        )}
                                        
                                        {/* Leaderboard Section */}
                                        <View style={styles.leaderboardSection}>
                                            <Text style={styles.leaderboardTitle}>Top 25</Text>
                                            <FlatList
                                                data={leaderboard || []}
                                                keyExtractor={(item) => item.userId}
                                                renderItem={({ item, index }) => (
                                                    <LeaderboardRow
                                                        rank={item.rank}
                                                        name={item.name}
                                                        score={item.score}
                                                        prizeAmount={item.prizeAmount}
                                                        isCurrentUser={item.userId === user?.id}
                                                        isTopThree={item.rank <= 3}
                                                    />
                                                )}
                                                ListEmptyComponent={() => (
                                                     <View style={{padding: 20, alignItems: 'center'}}>
                                                        <Text style={styles.placeholderText}>Leaderboard is not available yet.</Text>
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
                                    <FlatList
                                        data={winnings || []}
                                        keyExtractor={(item) => item.rank.toString()}
                                        renderItem={({ item }) => <WinningRow rank={item.rank} prize={item.prize} />}
                                        ListHeaderComponent={() => (
                                            <View style={styles.winningsHeader}>
                                                <Text style={styles.winningsHeaderText}>Rank</Text>
                                                <Text style={styles.winningsHeaderText}>Prize</Text>
                                            </View>
                                        )}
                                        ListEmptyComponent={() => (
                                            <View style={{padding: 20, alignItems: 'center'}}>
                                                <Text style={styles.placeholderText}>No prize distribution information available.</Text>
                                            </View>
                                        )}
                                    />
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
    const rankColor = isTopThree ? ['#FFD700', '#C0C0C0', '#CD7F32'][rank - 1] : '#6c757d';
    return (
        <View style={[styles.leaderboardRow, isCurrentUser && styles.currentUserRow]}>
            <View style={styles.rankContainer}>
                {isTopThree ? (
                    <Ionicons name="trophy" size={24} color={rankColor} />
                ) : (
                    <Text style={styles.leaderboardRankText}>{rank}</Text>
                )}
            </View>
            <Ionicons name="person-circle-outline" size={40} color={AppColors.grey} style={styles.avatar} />
            <Text style={styles.leaderboardNameText} numberOfLines={1}>{name}</Text>
            <View style={styles.scoreContainer}>
                <Text style={styles.leaderboardScoreText}>{score} PTS</Text>
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
        borderRadius: 12,
        padding: 20,
        marginBottom: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    infoTable: {},
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.lightGrey,
    },
    infoLabel: {
        color: AppColors.grey,
        fontSize: 14,
        fontWeight: '500',
    },
    infoValue: {
        fontWeight: '600',
        color: AppColors.darkGrey,
        fontSize: 14,
    },
    infoValueCost: {
        color: 'green',
        fontWeight: '700',
        fontSize: 14,
    },
    winningsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.lightGrey,
    },
    winningsHeaderText: {
        color: AppColors.grey,
        fontWeight: 'bold',
        fontSize: 14,
    },
    winningRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 10,
        backgroundColor: AppColors.white,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.lightGrey,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
    },
    rankText: {
        fontSize: 16,
        fontWeight: '600',
        color: AppColors.darkGrey,
    },
    prizeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    rupeeSymbol: {
        color: '#4CAF50',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 4,
    },
    prizeText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2E7D32',
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
        width: 35,
        alignItems: 'center',
        justifyContent: 'center',
    },
    leaderboardRankText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
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
});

export default ExamDetailScreen;