import { AppColors } from '@/constants/Colors';
import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Modal,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface PracticeExamDetails {
    id: string;
    title: string;
    description: string;
    category: string;
    subcategory: string;
    startTime: string;
    endTime: string;
    duration: number;
    spots: number;
    spotsLeft: number;
    attempted: boolean;
}

interface LeaderboardEntry {
    rank: number;
    name: string;
    userId: string;
    score: number;
    timeTaken?: number;
    completedAt?: string;
}

interface LeaderboardResponse {
    currentUser: LeaderboardEntry | null;
    leaderboard: LeaderboardEntry[];
}

const PracticeLeaderboardRow = ({ rank, name, score, isCurrentUser }: any) => {
    const numericRank = typeof rank === 'string' ? parseInt(rank, 10) : rank;
    const displayRank = numericRank !== undefined && numericRank !== null && !isNaN(numericRank) ? numericRank : 'N/A';
    const isTopThree = numericRank && numericRank <= 3;
    const rankColor = isTopThree ? ['#FFD700', '#C0C0C0', '#CD7F32'][numericRank - 1] : '#6c757d';
    
    return (
        <View style={[styles.leaderboardRow, isCurrentUser && styles.currentUserRow]}>
            <View style={[styles.rankContainer, isCurrentUser && styles.currentUserRankContainer]}>
                {isTopThree ? (
                    <Ionicons name="trophy" size={20} color={rankColor} />
                ) : (
                    <Text style={[styles.rankText, { color: rankColor }]}>#{displayRank}</Text>
                )}
            </View>
            <View style={styles.userSection}>
                <View style={styles.avatarContainer}>
                    <Ionicons 
                        name="person-circle" 
                        size={36} 
                        color={isCurrentUser ? '#667eea' : '#ddd'} 
                    />
                </View>
                <View style={styles.userInfo}>
                    <Text style={[styles.nameText, isCurrentUser && styles.currentUserNameText]} numberOfLines={1}>
                        {name || 'Anonymous'}
                    </Text>
                    {isCurrentUser && (
                        <View style={styles.currentUserBadge}>
                            <Text style={styles.currentUserBadgeText}>You</Text>
                        </View>
                    )}
                </View>
            </View>
            <View style={styles.scoreSection}>
                <Text style={[styles.scoreText, isCurrentUser && styles.currentUserScoreText]}>
                    {score || 0}
                </Text>
            </View>
        </View>
    );
};

const PracticeExamDetailsScreen = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const [exam, setExam] = useState<PracticeExamDetails | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [currentUser, setCurrentUser] = useState<LeaderboardEntry | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Info');
    const [showInstructionsModal, setShowInstructionsModal] = useState(false);
    const [declarationChecked, setDeclarationChecked] = useState(false);
    const [instructions, setInstructions] = useState<string[]>([]);
    const [examMeta, setExamMeta] = useState<{ duration?: string; maxMarks?: string } | null>(null);
    const [instructionsLoading, setInstructionsLoading] = useState(false);
    const [joiningExam, setJoiningExam] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [resultLoading, setResultLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [leaderboardLoading, setLeaderboardLoading] = useState(false);

    // Advanced Animation States
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const shimmerAnim = useRef(new Animated.Value(0)).current;
    const cardAnimations = useRef(Array(3).fill(0).map(() => new Animated.Value(0))).current;
    const tabAnimations = useRef(Array(3).fill(0).map(() => new Animated.Value(0))).current;

    useEffect(() => {
        if (id) {
            fetchExamDetails();
            fetchLeaderboard();
        }
    }, [id]);

    // Fetch leaderboard when tab is clicked
    useEffect(() => {
        if (activeTab === 'Leaderboard' && id && user?.token) {
            console.log('Leaderboard tab clicked, fetching data...');
            fetchLeaderboard();
        }
    }, [activeTab, id, user?.token]);

    // Refresh data when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            if (id && user?.token) {
                fetchExamDetails();
                fetchLeaderboard();
            }
        }, [id, user?.token])
    );

    useEffect(() => {
        if (activeTab === 'Results' && id && user?.token) {
            console.log('Results tab clicked, fetching result data...');
            console.log('Exam attempted:', exam?.attempted);
            setResultLoading(true);
            apiFetchAuth(`/student/practice-exams/${id}/result`, user.token)
                .then(res => {
                    console.log('Result API response:', res);
                    if (res.ok) {
                        setResult(res.data);
                        console.log('Result data set:', res.data);
                    } else {
                        console.log('Result API failed:', res.data);
                        setResult(null);
                    }
                })
                .catch((error) => {
                    console.error('Result API error:', error);
                    setResult(null);
                })
                .finally(() => setResultLoading(false));
        }
    }, [activeTab, id, user?.token]);

    const fetchExamDetails = async () => {
        if (!user?.token || !id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await apiFetchAuth(`/student/practice-exams/${id}`, user.token);
            if (response.ok) {
                setExam(response.data);
                if (response.data.instructions) {
                    setInstructions(response.data.instructions.list || []);
                    setExamMeta({
                        duration: response.data.instructions.duration,
                        maxMarks: response.data.instructions.maxMarks,
                    });
                } else {
                    setInstructions([]);
                    setExamMeta(null);
                }
            } else {
                Alert.alert('Error', 'Failed to load exam details.');
            }
        } catch (error) {
            console.error('Error fetching exam details:', error);
            Alert.alert('Error', 'Failed to load exam details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaderboard = async () => {
        if (!user?.token || !id) return;

        try {
            setLeaderboardLoading(true);
            console.log('Fetching practice exam leaderboard for ID:', id);
            const response = await apiFetchAuth(`/student/practice-exams/${id}/leaderboard`, user.token);
            console.log('Practice exam leaderboard response:', response);
            
            if (response.ok) {
                console.log('Practice exam leaderboard data:', response.data);
                const data: LeaderboardResponse = response.data;
                setCurrentUser(data.currentUser);
                setLeaderboard(data.leaderboard || []);
            } else {
                console.error('Failed to fetch practice exam leaderboard:', response.data);
                setCurrentUser(null);
                setLeaderboard([]);
            }
        } catch (error) {
            console.error('Error fetching practice exam leaderboard:', error);
            setCurrentUser(null);
            setLeaderboard([]);
        } finally {
            setLeaderboardLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await Promise.all([fetchExamDetails(), fetchLeaderboard()]);
        } catch (error) {
            console.error('Error refreshing data:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getSpotsPercentage = (spots: number, spotsLeft: number) => {
        return ((spots - spotsLeft) / spots) * 100;
    };

    const handleStartExam = () => {
        setShowInstructionsModal(true);
        setDeclarationChecked(false);
    };

    const handleBeginExam = async () => {
        if (!id || !user?.token || !exam) return;
        console.log('Starting exam with user ID:', user.id, 'Exam ID:', id);
        setJoiningExam(true);
        try {
            const joinRes = await apiFetchAuth('/student/practice-exams/join', user.token, {
                method: 'POST',
                body: { examId: id },
                headers: { 'Content-Type': 'application/json' },
            });
            if (joinRes.ok) {
                console.log('Successfully joined exam');
                setShowInstructionsModal(false);
                setJoiningExam(false);
                router.push({ pathname: '/(tabs)/practice-exam/questions', params: { id, duration: String(exam.duration) } });
            } else {
                setJoiningExam(false);
                Alert.alert('Error', 'Could not join the exam.');
            }
        } catch (e) {
            console.error('Error joining exam:', e);
            setJoiningExam(false);
            Alert.alert('Error', 'Could not join the exam.');
        }
    };

    const handleReviewExam = () => {
        Alert.alert(
            'Review Practice Exam',
            `Would you like to review your attempt for "${exam?.title}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Review', 
                    onPress: () => {
                        console.log('Reviewing practice exam:', exam?.id);
                        Alert.alert('Success', 'Opening review...');
                    }
                }
            ]
        );
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return '1🏆';
            case 2:
                return '2🥈';
            case 3:
                return '3🥉';
            default:
                return `${rank}`;
        }
    };

    const getRankColor = (rank: number) => {
        switch (rank) {
            case 1:
                return '#FFD700';
            case 2:
                return '#C0C0C0';
            case 3:
                return '#CD7F32';
            default:
                return AppColors.grey;
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={AppColors.primary} />
                    <Text style={styles.loadingText}>Loading Exam Details...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!exam) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color={AppColors.error} />
                    <Text style={styles.errorText}>Exam not found</Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const progress = getSpotsPercentage(exam.spots, exam.spotsLeft);

    return (
        <SafeAreaView style={styles.container}>
            {/* Instructions Modal */}
            <Modal
                visible={showInstructionsModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowInstructionsModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Exam Instructions</Text>
                            <TouchableOpacity 
                                style={styles.closeButton}
                                onPress={() => setShowInstructionsModal(false)}
                            >
                                <Ionicons name="close" size={24} color={AppColors.grey} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.instructionsScroll} showsVerticalScrollIndicator={false}>
                            {/* Exam Meta Info */}
                            {examMeta && (
                                <View style={styles.examMetaSection}>
                                    <View style={styles.metaRow}>
                                        <Ionicons name="time-outline" size={20} color={AppColors.primary} />
                                        <Text style={styles.metaText}>Duration: {examMeta.duration} minutes</Text>
                                    </View>
                                    <View style={styles.metaRow}>
                                        <Ionicons name="help-circle-outline" size={20} color={AppColors.primary} />
                                        <Text style={styles.metaText}>Total Questions: {examMeta.maxMarks}</Text>
                                    </View>
                                    <View style={styles.metaRow}>
                                        <Ionicons name="trophy-outline" size={20} color={AppColors.primary} />
                                        <Text style={styles.metaText}>Maximum Marks: {examMeta.maxMarks}</Text>
                                    </View>
                                </View>
                            )}

                            {/* Instructions List */}
                            <View style={styles.instructionsSection}>
                                <Text style={styles.instructionsTitle}>Instructions:</Text>
                                {instructions.length > 0 ? (
                                    instructions.map((instruction, index) => (
                                        <View key={index} style={styles.instructionItem}>
                                            <Text style={styles.instructionNumber}>{index + 1}.</Text>
                                            <Text style={styles.instructionText}>{instruction}</Text>
                                        </View>
                                    ))
                                ) : (
                                    <View style={styles.defaultInstructions}>
                                        <Text style={styles.instructionText}>• Read each question carefully before answering</Text>
                                        <Text style={styles.instructionText}>• You can navigate between questions using the navigation buttons</Text>
                                        <Text style={styles.instructionText}>• Once you submit an answer, you cannot change it</Text>
                                        <Text style={styles.instructionText}>• Ensure you have a stable internet connection</Text>
                                        <Text style={styles.instructionText}>• Do not refresh the page during the exam</Text>
                                    </View>
                                )}
                            </View>

                            {/* Declaration */}
                            <View style={styles.declarationSection}>
                                <Text style={styles.declarationTitle}>Declaration:</Text>
                                <Text style={styles.declarationText}>
                                    I hereby declare that I will attempt this exam honestly and follow all the instructions provided. 
                                    I understand that any form of cheating or malpractice will result in disqualification.
                                </Text>
                                
                                <TouchableOpacity 
                                    style={styles.checkboxContainer}
                                    onPress={() => setDeclarationChecked(!declarationChecked)}
                                >
                                    <View style={[styles.checkbox, declarationChecked && styles.checkboxChecked]}>
                                        {declarationChecked && (
                                            <Ionicons name="checkmark" size={16} color={AppColors.white} />
                                        )}
                                    </View>
                                    <Text style={styles.checkboxText}>
                                        I agree to the terms and conditions
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>

                        {/* Action Buttons */}
                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={styles.cancelButton}
                                onPress={() => setShowInstructionsModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[
                                    styles.beginButton,
                                    (!declarationChecked || joiningExam) && styles.beginButtonDisabled
                                ]}
                                onPress={handleBeginExam}
                                disabled={!declarationChecked || joiningExam}
                            >
                                {joiningExam ? (
                                    <ActivityIndicator size="small" color={AppColors.white} />
                                ) : (
                                    <>
                                        <Ionicons name="play" size={20} color={AppColors.white} />
                                        <Text style={styles.beginButtonText}>Begin Exam</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <View style={styles.tabContainer}>
                {['Info', 'Leaderboard', 'Results'].map(tabName => (
                    <TouchableOpacity 
                        key={tabName} 
                        style={[styles.tab, activeTab === tabName && styles.activeTab]}
                        onPress={() => setActiveTab(tabName)}
                    >
                        <Text style={[styles.tabText, activeTab === tabName && styles.activeTabText]}>
                            {tabName}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList 
              style={styles.content} 
              data={[{ key: 'content' }]}
              renderItem={() => (
                <>
                  {activeTab === 'Info' && (
                    <View style={styles.infoContainer}>
                      {/* Exam Description */}
                      {exam.description && (
                        <View style={styles.overviewCard}>
                          <Text style={styles.overviewTitle}>Description</Text>
                          <Text style={styles.descriptionText}>{exam.description}</Text>
                        </View>
                      )}

                      {/* Exam Details */}
                      <View style={styles.overviewCard}>
                        <Text style={styles.overviewTitle}>Exam Details</Text>
                        <View style={styles.overviewRow}>
                          <Ionicons name="folder-outline" size={18} color={AppColors.primary} />
                          <Text style={styles.overviewText}>Category: {exam.category}</Text>
                        </View>
                        {exam.subcategory && (
                          <View style={styles.overviewRow}>
                            <Ionicons name="folder-open-outline" size={18} color={AppColors.primary} />
                            <Text style={styles.overviewText}>Subcategory: {exam.subcategory}</Text>
                          </View>
                        )}
                        <View style={styles.overviewRow}>
                          <Ionicons name="time-outline" size={18} color={AppColors.primary} />
                          <Text style={styles.overviewText}>Duration: {exam.duration} minutes</Text>
                        </View>
                        <View style={styles.overviewRow}>
                          <Ionicons name="help-circle-outline" size={18} color={AppColors.primary} />
                          <Text style={styles.overviewText}>Total Questions: {examMeta?.maxMarks || 'Not specified'}</Text>
                        </View>
                        <View style={styles.overviewRow}>
                          <Ionicons name="trophy-outline" size={18} color={AppColors.primary} />
                          <Text style={styles.overviewText}>Maximum Marks: {examMeta?.maxMarks || 'Not specified'}</Text>
                        </View>
                        <View style={styles.overviewRow}>
                          <Ionicons name="people-outline" size={18} color={AppColors.primary} />
                          <Text style={styles.overviewText}>Available Spots: {exam.spotsLeft} / {exam.spots}</Text>
                        </View>
                        <View style={styles.overviewRow}>
                          <Ionicons name="calendar-outline" size={18} color={AppColors.primary} />
                          <Text style={styles.overviewText}>Start Time: {formatDate(exam.startTime)}</Text>
                        </View>
                        <View style={styles.overviewRow}>
                          <Ionicons name="calendar-outline" size={18} color={AppColors.primary} />
                          <Text style={styles.overviewText}>End Time: {formatDate(exam.endTime)}</Text>
                        </View>
                      </View>

                      {/* Action Button */}
                      <TouchableOpacity 
                        style={[
                          styles.actionButton,
                          exam.attempted ? styles.reviewButton : styles.startButton
                        ]}
                        onPress={exam.attempted ? handleReviewExam : handleStartExam}
                      >
                        <Ionicons 
                          name={exam.attempted ? "eye" : "play"} 
                          size={20} 
                          color={AppColors.white} 
                        />
                        <Text style={styles.actionButtonText}>
                          {exam.attempted ? 'Review Results' : 'Start Practice Exam'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {activeTab === 'Leaderboard' && (
                    <View style={styles.leaderboardContainer}>
                      {leaderboardLoading ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="large" color={AppColors.primary} />
                          <Text style={styles.loadingText}>Loading Leaderboard...</Text>
                        </View>
                      ) : leaderboard.length > 0 ? (
                        <>
                          {/* Current User Section */}
                          {currentUser && (
                            <View style={styles.currentUserSection}>
                              <Text style={styles.sectionTitle}>Your Performance</Text>
                              <View style={styles.currentUserCard}>
                                <View style={styles.currentUserRank}>
                                  <Text style={styles.currentUserRankText}>#{currentUser.rank}</Text>
                                </View>
                                <View style={styles.currentUserInfo}>
                                  <Text style={styles.currentUserName}>{currentUser.name}</Text>
                                  <Text style={styles.currentUserScore}>Score: {currentUser.score}</Text>
                                </View>
                              </View>
                            </View>
                          )}

                          {/* Leaderboard List */}
                          <View style={styles.leaderboardSection}>
                            <Text style={styles.sectionTitle}>Top Performers</Text>
                            <FlatList
                              data={leaderboard}
                              keyExtractor={(item) => item.userId}
                              renderItem={({ item }) => (
                                <PracticeLeaderboardRow
                                  rank={item.rank}
                                  name={item.name}
                                  score={item.score}
                                  isCurrentUser={currentUser?.userId === item.userId}
                                />
                              )}
                              showsVerticalScrollIndicator={false}
                              scrollEnabled={false}
                            />
                          </View>
                        </>
                      ) : (
                        <View style={styles.emptyContainer}>
                          <Ionicons name="trophy-outline" size={64} color="#ccc" />
                          <Text style={styles.emptyTitle}>No Leaderboard Data</Text>
                          <Text style={styles.emptySubtext}>
                            Be the first to attempt this exam and see your ranking!
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {activeTab === 'Results' && (
                    <View style={styles.resultsContainer}>
                      {resultLoading ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="large" color={AppColors.primary} />
                          <Text style={styles.loadingText}>Loading Results...</Text>
                        </View>
                      ) : result ? (
                        <View style={styles.resultCard}>
                          <View style={styles.resultHeader}>
                            <Ionicons name="trophy" size={40} color="#FFD700" style={{ marginBottom: 8 }} />
                            <Text style={styles.resultTitle}>Practice Exam Results</Text>
                            <Text style={styles.resultScore}>Score: <Text style={{ color: '#FFD700' }}>{result.score}</Text> / {result.totalQuestions}</Text>
                          </View>
                          <View style={styles.summaryGrid}>
                            <View style={[styles.summaryCard, { backgroundColor: '#d4edda' }]}> 
                              <Ionicons name="checkmark-circle" size={24} color="#28a745" />
                              <Text style={[styles.summaryCardValue, { color: '#28a745' }]}>{result.correctAnswers}</Text>
                              <Text style={styles.summaryCardLabel}>Correct</Text>
                            </View>
                            <View style={[styles.summaryCard, { backgroundColor: '#f8d7da' }]}> 
                              <Ionicons name="close-circle" size={24} color="#dc3545" />
                              <Text style={[styles.summaryCardValue, { color: '#dc3545' }]}>{result.wrongAnswers}</Text>
                              <Text style={styles.summaryCardLabel}>Incorrect</Text>
                            </View>
                            <View style={[styles.summaryCard, { backgroundColor: '#e2e3e5' }]}> 
                              <Ionicons name="remove-circle" size={24} color="#6c757d" />
                              <Text style={[styles.summaryCardValue, { color: '#6c757d' }]}>{result.unattempted}</Text>
                              <Text style={styles.summaryCardLabel}>Unattempted</Text>
                            </View>
                          </View>
                          <TouchableOpacity 
                            style={styles.analysisButton}
                            onPress={() => router.push({ pathname: '/(tabs)/practice-exam/result/[id]', params: { id } })}
                          >
                            <Ionicons name="analytics-outline" size={20} color="#6C63FF" />
                            <Text style={styles.analysisButtonText}>View Detailed Analysis</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.noResultContainer}>
                          <Ionicons name="document-text-outline" size={64} color="#ccc" />
                          <Text style={styles.noResultTitle}>No Results Available</Text>
                          <Text style={styles.noResultText}>
                            {exam?.attempted 
                              ? "Could not load your exam results. Please try again later."
                              : "You haven't attempted this exam yet. Start the exam to see your results."
                            }
                          </Text>
                          {!exam?.attempted && (
                            <TouchableOpacity
                              style={styles.startExamButton}
                              onPress={handleStartExam}
                            >
                              <Ionicons name="play" size={20} color="#fff" />
                              <Text style={styles.startExamButtonText}>Start Exam</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </>
              )}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.lightGrey,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        fontWeight: '600',
        color: AppColors.darkGrey,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    errorText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.error,
        marginTop: 16,
    },
    header: {
        paddingTop: 20,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    backButton: {
        marginRight: 15,
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: AppColors.white,
        flex: 1,
    },
    placeholder: {
        flex: 1,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: AppColors.white,
        paddingHorizontal: 15,
        paddingTop: 10,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: AppColors.primary,
    },
    tabText: {
        fontSize: 16,
        color: AppColors.grey,
        fontWeight: '500',
    },
    activeTabText: {
        color: AppColors.primary,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    infoContainer: {
        gap: 20,
    },
    overviewCard: {
        backgroundColor: AppColors.white,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    overviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    overviewTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
        marginLeft: 10,
    },
    overviewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    overviewText: {
        fontSize: 16,
        color: AppColors.darkGrey,
        flex: 1,
    },
    spotsCard: {
        backgroundColor: AppColors.white,
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    spotsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
        marginBottom: 15,
    },
    spotsInfo: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    spotsLeft: {
        alignItems: 'center',
    },
    spotsTotal: {
        alignItems: 'center',
    },
    spotsNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: AppColors.primary,
    },
    spotsLabel: {
        fontSize: 14,
        color: AppColors.grey,
        marginTop: 4,
    },
    progressBar: {
        height: 8,
        backgroundColor: AppColors.lightGrey,
        borderRadius: 4,
        marginBottom: 8,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: AppColors.primary,
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        color: AppColors.grey,
        textAlign: 'center',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 12,
        gap: 10,
    },
    startButton: {
        backgroundColor: '#10B981',
    },
    reviewButton: {
        backgroundColor: AppColors.success,
    },
    actionButtonText: {
        color: AppColors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    leaderboardContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    leaderboardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
        marginBottom: 15,
    },
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },

    resultsContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    resultCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        width: '100%',
        maxWidth: 400,
    },
    resultHeader: {
        alignItems: 'center',
        marginBottom: 18,
    },
    resultTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 6,
    },
    resultScore: {
        fontSize: 18,
        color: '#333',
        fontWeight: '600',
        marginBottom: 10,
    },
    summaryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 18,
        width: '100%',
    },
    summaryCard: {
        flex: 1,
        marginHorizontal: 4,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    summaryCardValue: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 8,
        marginBottom: 4,
    },
    summaryCardLabel: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    analysisButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 18,
        backgroundColor: '#f6f8fb',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
        elevation: 1,
    },
    analysisButtonText: {
        color: '#6C63FF',
        fontWeight: 'bold',
        fontSize: 15,
        marginLeft: 8,
    },
    backButtonText: {
        color: AppColors.primary,
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '92%',
        maxHeight: '90%',
        backgroundColor: AppColors.white,
        borderRadius: 18,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: AppColors.primary,
    },
    modalContent: {
        marginBottom: 16,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    metaText: {
        fontSize: 15,
        color: AppColors.darkGrey,
    },
    metaValue: {
        fontWeight: 'bold',
        color: AppColors.primary,
    },
    instructionsHeading: {
        fontSize: 16,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
        marginBottom: 8,
    },
    instructionsList: {
        marginBottom: 16,
    },
    instructionItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    instructionIndex: {
        fontWeight: 'bold',
        color: AppColors.primary,
        marginRight: 6,
    },
    instructionText: {
        flex: 1,
        color: AppColors.darkGrey,
        fontSize: 15,
    },
    declarationHeading: {
        fontWeight: 'bold',
        color: AppColors.darkGrey,
        marginBottom: 6,
        fontSize: 16,
    },
    declarationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: AppColors.primary,
        backgroundColor: AppColors.white,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: AppColors.primary,
        borderColor: AppColors.primary,
    },
    declarationText: {
        flex: 1,
        color: AppColors.darkGrey,
        fontSize: 14,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    modalButtonPrimary: {
        backgroundColor: AppColors.primary,
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 8,
        minWidth: 140,
        alignItems: 'center',
    },
    modalButtonPrimaryText: {
        color: AppColors.white,
        fontWeight: 'bold',
        fontSize: 15,
    },
    modalButtonSecondary: {
        backgroundColor: AppColors.lightGrey,
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
    },
    modalButtonSecondaryText: {
        color: AppColors.primary,
        fontWeight: 'bold',
        fontSize: 15,
    },
    modalButtonDisabled: {
        backgroundColor: AppColors.grey,
    },
    modalLoadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 120,
    },
    descriptionText: {
        color: AppColors.darkGrey,
        fontSize: 15,
    },
    currentUserCard: {
        backgroundColor: '#fffbe6',
        borderRadius: 16,
        padding: 18,
        marginBottom: 18,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    currentUserHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    currentUserLabel: {
        color: '#bfa100',
        fontWeight: 'bold',
        fontSize: 15,
        marginLeft: 8,
    },
    currentUserInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    currentUserRankContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    currentUserRank: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#bfa100',
    },
    currentUserRankLabel: {
        fontSize: 14,
        color: '#bfa100',
        fontWeight: 'bold',
        marginLeft: 4,
    },
    currentUserAvatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    currentUserDetails: {
        flexDirection: 'column',
        marginLeft: 10,
    },
    currentUserName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#222',
    },
    currentUserScore: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a73e8',
    },
    currentUserBadge: {
        backgroundColor: '#1a73e8',
        borderRadius: 12,
        paddingHorizontal: 4,
        paddingVertical: 2,
        marginLeft: 8,
        color: AppColors.white,
        fontWeight: 'bold',
        fontSize: 12,
    },
    currentUserNameText: {
        color: '#222',
    },
    currentUserScoreText: {
        color: '#1a73e8',
    },
    podiumSection: {
        marginBottom: 20,
    },
    podiumTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
        marginBottom: 10,
    },
    podiumContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    podiumItem: {
        flexDirection: 'column',
        alignItems: 'center',
    },
    podiumMedal: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    podiumName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
        marginBottom: 4,
    },
    podiumScore: {
        fontSize: 14,
        color: AppColors.grey,
    },
    podiumRank: {
        fontSize: 14,
        color: AppColors.grey,
        fontWeight: 'bold',
    },
    leaderboardCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 4,
        paddingHorizontal: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    leaderboardListTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
        marginBottom: 10,
    },
    leaderboardList: {
        padding: 10,
    },
    leaderboardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    currentUserRow: {
        backgroundColor: '#e3f2fd',
    },
    avatar: {
        marginHorizontal: 8,
    },
    userInfo: {
        flex: 1,
    },
    rankContainer: {
        width: 50,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rankText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#6c757d',
    },
    nameText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    scoreText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a73e8',
    },
    scoreContainer: {
        minWidth: 80,
        alignItems: 'flex-end',
    },
    emptyLeaderboard: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyLeaderboardText: {
        fontSize: 16,
        color: '#666',
        marginTop: 12,
        fontWeight: '600',
    },
    emptyLeaderboardSubtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 4,
    },
    podiumFirst: {
        transform: [{ translateY: -20 }],
        zIndex: 2,
    },
    placeholderText: {
        color: '#888',
        fontSize: 15,
        textAlign: 'center',
        marginVertical: 30,
    },
    // New Professional Leaderboard Styles
    leaderboardFullScreen: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    leaderboardHeader: {
        backgroundColor: '#fff',
        paddingVertical: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    leaderboardHeaderContent: {
        alignItems: 'center',
    },
    leaderboardHeaderTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginTop: 8,
        marginBottom: 4,
    },
    leaderboardHeaderSubtitle: {
        fontSize: 14,
        color: '#6c757d',
        fontWeight: '500',
    },
    currentUserSection: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    currentUserGradient: {
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    currentUserContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    currentUserLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    currentUserRankBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 12,
    },
    currentUserRankNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
   
    
    currentUserRight: {
        alignItems: 'flex-end',
    },
   
    currentUserScoreLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 16,
        textAlign: 'center',
    },
  
    podiumSecond: {
        transform: [{ translateY: -15 }],
        zIndex: 2,
    },
    podiumThird: {
        transform: [{ translateY: 0 }],
        zIndex: 1,
    },
    podiumCrown: {
        marginBottom: 8,
    },
    podiumMedalContainer: {
        marginBottom: 8,
    },
    podiumAvatar: {
        marginBottom: 8,
    },
    
    leaderboardListSection: {
        flex: 1,
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
        overflow: 'hidden',
    },
    leaderboardListHeader: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
   
    leaderboardListSubtitle: {
        fontSize: 14,
        color: '#6c757d',
    },
    leaderboardListContainer: {
        flex: 1,
    },
  
    userSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        marginRight: 12,
    },
   
    currentUserBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    scoreSection: {
        alignItems: 'flex-end',
    },
   
    // Advanced Enhanced Styles
    enhancedOverviewCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(102, 126, 234, 0.1)',
    },
    enhancedOverviewTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginLeft: 12,
    },
    enhancedDescriptionText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#34495e',
        textAlign: 'justify',
    },
    enhancedDetailsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(102, 126, 234, 0.05)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flex: 1,
        marginHorizontal: 4,
        minWidth: '45%',
    },
    detailLabel: {
        fontSize: 12,
        color: '#7f8c8d',
        fontWeight: '600',
        marginLeft: 8,
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 14,
        color: '#2c3e50',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    enhancedActionButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
        marginTop: 20,
    },
    enhancedStartButton: {
        backgroundColor: 'transparent',
    },
    enhancedReviewButton: {
        backgroundColor: 'transparent',
    },
    actionButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 16,
    },
    enhancedActionButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
        marginLeft: 12,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    // Results Tab Styles
    noResultContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#fff',
        borderRadius: 12,
        margin: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    noResultTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    noResultText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 20,
    },
    startExamButton: {
        backgroundColor: AppColors.primary,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
    },
    startExamButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
 
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    examIconContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
        padding: 8,
        marginRight: 10,
    },
    examInfo: {
        flex: 1,
    },
    examTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: AppColors.white,
        marginBottom: 4,
    },
    examCategory: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 10,
        paddingVertical: 4,
        paddingHorizontal: 10,
    },
    timeText: {
        fontSize: 14,
        color: AppColors.white,
        fontWeight: 'bold',
    },
    overviewGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginTop: 10,
    },
    overviewItem: {
        width: '48%', // Two items per row
        marginBottom: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    overviewIconContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 15,
        padding: 8,
        marginBottom: 8,
    },
    overviewLabel: {
        fontSize: 14,
        color: AppColors.darkGrey,
        fontWeight: '600',
        marginBottom: 5,
    },
    overviewValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.primary,
    },
    descriptionCard: {
        backgroundColor: AppColors.white,
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginTop: 15,
    },
    descriptionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    descriptionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
        marginLeft: 10,
    },
    actionContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 16,
    },
    tabContent: {
        marginTop: 15,
    },
    detailsCard: {
        backgroundColor: AppColors.white,
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    detailsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    detailsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
        marginLeft: 10,
    },
    detailsList: {
        marginTop: 10,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailText: {
        fontSize: 16,
        color: AppColors.darkGrey,
        flex: 1,
    },
   
    currentUserRankText: {
        color: AppColors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
   
    leaderboardSection: {
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
    },
    // Modal Styles
  

    closeButton: {
        padding: 5,
    },
    instructionsScroll: {
        flex: 1,
        padding: 20,
    },
    examMetaSection: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
 
    instructionsSection: {
        marginBottom: 20,
    },
    instructionsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
        marginBottom: 12,
    },
   
    instructionNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: AppColors.primary,
        marginRight: 8,
        minWidth: 20,
    },
  
    defaultInstructions: {
        gap: 8,
    },
    declarationSection: {
        marginBottom: 20,
    },
    declarationTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
        marginBottom: 12,
    },
  
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
   
    checkboxText: {
        fontSize: 16,
        color: AppColors.darkGrey,
        flex: 1,
    },

    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: AppColors.grey,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: AppColors.grey,
    },
    beginButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: AppColors.primary,
        gap: 8,
    },
    beginButtonDisabled: {
        backgroundColor: AppColors.grey,
        opacity: 0.6,
    },
    beginButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: AppColors.white,
    },
});

export default PracticeExamDetailsScreen; 