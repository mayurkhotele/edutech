import { apiFetchAuth } from '@/constants/api';
import { AppColors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    const [leaderboardLoading, setLeaderboardLoading] = useState(false);

    useEffect(() => {
        const fetchLeaderboardData = async () => {
            if (!user?.token || !id || leaderboard.length > 0) return;
            try {
                setLeaderboardLoading(true);
                const response = await apiFetchAuth(`/student/live-exams/${id}/leaderboard`, user.token);
                if (response.ok) {
                    setLeaderboard(response.data);
                } else {
                    console.error("Failed to load leaderboard:", response.data);
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
                    setWinnings(response.data);
                } else {
                    console.error("Failed to load winnings: ", response.data);
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

    const handleAttempt = async () => {
        if (!user?.token || !id) return;
        try {
            const response = await apiFetchAuth('/student/live-exams/join', user.token, {
                method: 'POST',
                body: { examId: id }
            });

            if (response.ok) {
                Alert.alert('Success', 'You have successfully joined the exam!');
                router.push('/quiz');
            } else {
                 Alert.alert('Error', response.data?.message || 'Could not join the exam.');
            }
        } catch (e: any) {
            Alert.alert('Error', e.data?.message || 'An error occurred while joining the exam.');
        }
    };

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
            <ScrollView>
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
                            <FlatList
                                data={leaderboard}
                                keyExtractor={(item) => item.userId}
                                renderItem={({ item, index }) => (
                                    <LeaderboardRow
                                        rank={item.rank}
                                        name={item.name}
                                        score={item.score}
                                        isCurrentUser={item.userId === user?.id}
                                        isTopThree={index < 3}
                                    />
                                )}
                                ListEmptyComponent={() => (
                                     <View style={{padding: 20, alignItems: 'center'}}>
                                        <Text style={styles.placeholderText}>Leaderboard is not available yet.</Text>
                                    </View>
                                )}
                            />
                        )
                    )}
                    {activeTab === 'Winnings' && (
                        winningsLoading ? (
                            <ActivityIndicator color={AppColors.primary} style={{ marginVertical: 20 }}/>
                        ) : (
                            <FlatList
                                data={winnings}
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
            </ScrollView>
            
            <View style={styles.footer}>
                <TouchableOpacity style={styles.shareButton}>
                    <Ionicons name="share-social-outline" size={24} color={AppColors.primary} />
                    <Text style={styles.shareButtonText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.attemptButton} onPress={handleAttempt}>
                    <Text style={styles.attemptButtonText}>Attempt</Text>
                     <View style={styles.attemptFeeContainer}>
                        <Text style={styles.attemptButtonFee}>₹{exam.entryFee}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const LeaderboardRow = ({ rank, name, score, isCurrentUser, isTopThree }: any) => {
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
            <Text style={styles.leaderboardScoreText}>{score} PTS</Text>
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
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: 20,
        backgroundColor: AppColors.white,
        borderTopWidth: 1,
        borderTopColor: AppColors.lightGrey,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 8,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: AppColors.primary,
        backgroundColor: AppColors.lightGrey,
    },
    shareButtonText: {
        marginLeft: 8,
        color: AppColors.primary,
        fontWeight: '600',
        fontSize: 14,
    },
    attemptButton: {
        backgroundColor: '#E91E63', // Vibrant pink/magenta
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingLeft: 25,
        paddingRight: 15,
        borderRadius: 10,
        flex: 0.65,
        justifyContent: 'center',
        shadowColor: '#E91E63',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    attemptButtonText: {
        color: AppColors.white,
        fontWeight: '700',
        fontSize: 16,
        marginRight: 10,
    },
    attemptFeeContainer: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    attemptButtonFee: {
        color: AppColors.white,
        fontWeight: '700',
        fontSize: 12,
    },
});

export default ExamDetailScreen;