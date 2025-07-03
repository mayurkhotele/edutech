import { AppColors } from '@/constants/Colors';
import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Modal,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
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
        if (activeTab === 'Results' && exam?.attempted && id && user?.token) {
            setResultLoading(true);
            apiFetchAuth(`/student/practice-exams/${id}/result`, user.token)
                .then(res => {
                    if (res.ok) setResult(res.data);
                    else setResult(null);
                })
                .catch(() => setResult(null))
                .finally(() => setResultLoading(false));
        }
    }, [activeTab, exam?.attempted, id, user?.token]);

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
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={AppColors.white} />
                </TouchableOpacity>
                
                <Text style={styles.headerTitle}>{exam.title}</Text>
                
                <View style={styles.placeholder} />
            </LinearGradient>

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
                      <View style={styles.metaRow}>
                        <Text style={styles.metaText}>Duration: <Text style={styles.metaValue}>{examMeta?.duration || exam.duration || '-'}</Text></Text>
                        <Text style={styles.metaText}>Maximum Marks: <Text style={styles.metaValue}>{examMeta?.maxMarks || '-'}</Text></Text>
                      </View>
                      
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
                          <Ionicons name="time-outline" size={20} color={AppColors.primary} />
                          <Text style={styles.overviewText}>Duration: {examMeta?.duration || exam.duration || '-'} minutes</Text>
                        </View>
                        <View style={styles.overviewRow}>
                          <Ionicons name="document-text-outline" size={20} color={AppColors.primary} />
                          <Text style={styles.overviewText}>Questions: -</Text>
                        </View>
                        <View style={styles.overviewRow}>
                          <Ionicons name="trophy-outline" size={20} color={AppColors.primary} />
                          <Text style={styles.overviewText}>Max Marks: {examMeta?.maxMarks || '-'}</Text>
                        </View>
                        {exam.category && (
                          <View style={styles.overviewRow}>
                            <Ionicons name="folder-outline" size={20} color={AppColors.primary} />
                            <Text style={styles.overviewText}>Category: {exam.category}</Text>
                          </View>
                        )}
                        {exam.subcategory && (
                          <View style={styles.overviewRow}>
                            <Ionicons name="folder-open-outline" size={20} color={AppColors.primary} />
                            <Text style={styles.overviewText}>Subcategory: {exam.subcategory}</Text>
                          </View>
                        )}
                      </View>

                      {/* Exam Schedule */}
                      <View style={styles.overviewCard}>
                        <Text style={styles.overviewTitle}>Schedule</Text>
                        <View style={styles.overviewRow}>
                          <Ionicons name="calendar-outline" size={20} color={AppColors.primary} />
                          <Text style={styles.overviewText}>Start Date: {formatDate(exam.startTime)}</Text>
                        </View>
                        <View style={styles.overviewRow}>
                          <Ionicons name="calendar-outline" size={20} color={AppColors.primary} />
                          <Text style={styles.overviewText}>End Date: {formatDate(exam.endTime)}</Text>
                        </View>
                      </View>

                      <View style={styles.spotsCard}>
                        <Text style={styles.spotsTitle}>Available Spots</Text>
                        <View style={styles.spotsInfo}>
                          <View style={styles.spotsLeft}>
                            <Text style={styles.spotsNumber}>{exam.spotsLeft}</Text>
                            <Text style={styles.spotsLabel}>Available</Text>
                          </View>
                          <View style={styles.spotsTotal}>
                            <Text style={styles.spotsNumber}>{exam.spots}</Text>
                            <Text style={styles.spotsLabel}>Total</Text>
                          </View>
                        </View>
                        <View style={styles.progressBar}>
                          <View 
                            style={[
                              styles.progressFill,
                              { width: `${(exam.spots - exam.spotsLeft) / exam.spots * 100}%` }
                            ]} 
                          />
                        </View>
                        <Text style={styles.progressText}>
                          {Math.round((exam.spots - exam.spotsLeft) / exam.spots * 100)}% Filled
                        </Text>
                      </View>

                      <TouchableOpacity 
                        style={[
                          styles.actionButton,
                          exam.attempted ? styles.reviewButton : styles.startButton
                        ]}
                        onPress={exam.attempted ? handleReviewExam : handleStartExam}
                      >
                        <Text style={styles.actionButtonText}>
                          {exam.attempted ? 'Review Results' : 'Start Practice Exam'}
                        </Text>
                        <Ionicons 
                          name={exam.attempted ? "eye" : "play"} 
                          size={20} 
                          color={AppColors.white} 
                        />
                      </TouchableOpacity>
                    </View>
                  )}

                  {activeTab === 'Leaderboard' && (
                    <View style={styles.leaderboardContainer}>
                      {(() => {
                        console.log('Rendering leaderboard tab');
                        console.log('Current user:', currentUser);
                        console.log('Leaderboard value:', leaderboard);
                        console.log('Leaderboard type:', typeof leaderboard);
                        console.log('Is Array:', Array.isArray(leaderboard));
                        console.log('Leaderboard length:', leaderboard?.length);
                        
                        return (
                          <View style={styles.leaderboardFullScreen}>
                            {/* Header Section */}
                            <View style={styles.leaderboardHeader}>
                              <View style={styles.leaderboardHeaderContent}>
                                <Ionicons name="trophy" size={28} color="#FFD700" />
                                <Text style={styles.leaderboardHeaderTitle}>Practice Exam Leaderboard</Text>
                              </View>
                            </View>

                            {/* Current User Section */}
                            {currentUser && (
                              <View style={styles.currentUserSection}>
                                <View style={styles.currentUserCard}>
                                  <LinearGradient
                                    colors={['#667eea', '#764ba2']}
                                    style={styles.currentUserGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                  >
                                    <View style={styles.currentUserContent}>
                                      <View style={styles.currentUserLeft}>
                                        <View style={styles.currentUserRankBadge}>
                                          <Text style={styles.currentUserRankNumber}>#{currentUser.rank}</Text>
                                        </View>
                                        <View style={styles.currentUserInfo}>
                                          <Text style={styles.currentUserLabel}>Your Rank</Text>
                                          <Text style={styles.currentUserName}>{currentUser.name}</Text>
                                        </View>
                                      </View>
                                                                             <View style={styles.currentUserRight}>
                                         <Text style={styles.currentUserScore}>{currentUser.score}</Text>
                                       </View>
                                    </View>
                                  </LinearGradient>
                                </View>
                              </View>
                            )}
                            
                            {/* Top 3 Podium */}
                            {leaderboard.length >= 3 && (
                              <View style={styles.podiumSection}>
                                <Text style={styles.sectionTitle}>🏆 Top Performers</Text>
                                <View style={styles.podiumContainer}>
                                  {/* 2nd Place */}
                                  <View style={[styles.podiumItem, styles.podiumSecond]}>
                                    <View style={styles.podiumMedalContainer}>
                                      <Ionicons name="trophy" size={24} color="#C0C0C0" />
                                    </View>
                                    <View style={styles.podiumAvatar}>
                                      <Ionicons name="person-circle" size={44} color="#C0C0C0" />
                                    </View>
                                    <Text style={styles.podiumName} numberOfLines={1}>
                                      {leaderboard[1]?.name || 'Anonymous'}
                                    </Text>
                                    <Text style={styles.podiumScore}>{leaderboard[1]?.score || 0}</Text>
                                    <Text style={styles.podiumRank}>2nd</Text>
                                  </View>
                                  
                                  {/* 1st Place */}
                                  <View style={[styles.podiumItem, styles.podiumFirst]}>
                                    <View style={styles.podiumCrown}>
                                      <Ionicons name="star" size={32} color="#FFD700" />
                                    </View>
                                    <View style={styles.podiumMedalContainer}>
                                      <Ionicons name="trophy" size={28} color="#FFD700" />
                                    </View>
                                    <View style={styles.podiumAvatar}>
                                      <Ionicons name="person-circle" size={52} color="#FFD700" />
                                    </View>
                                    <Text style={styles.podiumName} numberOfLines={1}>
                                      {leaderboard[0]?.name || 'Anonymous'}
                                    </Text>
                                    <Text style={styles.podiumScore}>{leaderboard[0]?.score || 0}</Text>
                                    <Text style={styles.podiumRank}>1st</Text>
                                  </View>
                                  
                                  {/* 3rd Place */}
                                  <View style={[styles.podiumItem, styles.podiumThird]}>
                                    <View style={styles.podiumMedalContainer}>
                                      <Ionicons name="trophy" size={20} color="#CD7F32" />
                                    </View>
                                    <View style={styles.podiumAvatar}>
                                      <Ionicons name="person-circle" size={44} color="#CD7F32" />
                                    </View>
                                    <Text style={styles.podiumName} numberOfLines={1}>
                                      {leaderboard[2]?.name || 'Anonymous'}
                                    </Text>
                                    <Text style={styles.podiumScore}>{leaderboard[2]?.score || 0}</Text>
                                    <Text style={styles.podiumRank}>3rd</Text>
                                  </View>
                                </View>
                              </View>
                            )}
                            
                            {/* Leaderboard List */}
                            <View style={styles.leaderboardListSection}>
                              <View style={styles.leaderboardListHeader}>
                                <Text style={styles.leaderboardListTitle}>📊 All Participants</Text>
                                <Text style={styles.leaderboardListSubtitle}>Complete ranking</Text>
                              </View>
                              <View style={styles.leaderboardListContainer}>
                                <FlatList
                                  data={leaderboard}
                                  keyExtractor={item => item.userId}
                                  renderItem={({ item }) => (
                                    <PracticeLeaderboardRow
                                      rank={item.rank}
                                      name={item.name}
                                      score={item.score}
                                      isCurrentUser={currentUser && item.userId === currentUser.userId}
                                    />
                                  )}
                                  ListEmptyComponent={() => (
                                    <View style={styles.emptyLeaderboard}>
                                      <Ionicons name="people-outline" size={64} color="#ddd" />
                                      <Text style={styles.emptyLeaderboardText}>No participants yet</Text>
                                      <Text style={styles.emptyLeaderboardSubtext}>Be the first to attempt this exam!</Text>
                                    </View>
                                  )}
                                  showsVerticalScrollIndicator={false}
                                  contentContainerStyle={styles.leaderboardList}
                                />
                              </View>
                            </View>
                          </View>
                        );
                      })()}
                    </View>
                  )}

                  {activeTab === 'Results' && (
                    <View style={styles.resultsContainer}>
                        {exam?.attempted ? (
                            resultLoading ? (
                                <ActivityIndicator size="large" color="#6C63FF" style={{ marginTop: 40 }} />
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
                                <Text style={styles.placeholderText}>Could not load result.</Text>
                            )
                        ) : (
                            <Text style={styles.placeholderText}>You haven't attempted this exam yet.</Text>
                        )}
                    </View>
                  )}
                </>
              )}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              showsVerticalScrollIndicator={false}
            />

            <Modal
                visible={showInstructionsModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowInstructionsModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Instructions</Text>
                        </View>
                        <ScrollView style={styles.modalContent}>
                            <View style={styles.metaRow}>
                                <Text style={styles.metaText}>Duration: <Text style={styles.metaValue}>{examMeta?.duration || '-'}</Text></Text>
                                <Text style={styles.metaText}>Maximum Marks: <Text style={styles.metaValue}>{examMeta?.maxMarks || '-'}</Text></Text>
                            </View>
                            <Text style={styles.instructionsHeading}>Read the following instructions carefully.</Text>
                            <View style={styles.instructionsList}>
                                {instructions.length > 0 ? instructions.map((item, idx) => (
                                    <View key={idx} style={styles.instructionItem}>
                                        <Text style={styles.instructionIndex}>{idx + 1}.</Text>
                                        <Text style={styles.instructionText}>{item}</Text>
                                    </View>
                                )) : (
                                    <Text style={styles.instructionText}>No instructions available.</Text>
                                )}
                            </View>
                            <Text style={styles.declarationHeading}>Declaration:</Text>
                            <TouchableOpacity
                                style={styles.declarationRow}
                                onPress={() => setDeclarationChecked(!declarationChecked)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.checkbox, declarationChecked && styles.checkboxChecked]}>
                                    {declarationChecked && <Ionicons name="checkmark" size={16} color={AppColors.white} />}
                                </View>
                                <Text style={styles.declarationText}>
                                    I have read all the instructions carefully and have understood them. I agree not to cheat or use unfair means in this examination. I understand that using unfair means of any sort for my own or someone else's advantage will lead to my immediate disqualification.
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalButtonSecondary}
                                onPress={() => setShowInstructionsModal(false)}
                            >
                                <Text style={styles.modalButtonSecondaryText}>Previous</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButtonPrimary, (!declarationChecked || joiningExam) && styles.modalButtonDisabled]}
                                onPress={handleBeginExam}
                                disabled={!declarationChecked || joiningExam}
                            >
                                {joiningExam ? (
                                    <ActivityIndicator size="small" color={AppColors.white} />
                                ) : (
                                    <Text style={styles.modalButtonPrimaryText}>I am ready to begin</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f6f8fb',
        padding: 12,
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
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
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
        padding: 15,
    },
    infoContainer: {
        gap: 20,
    },
    overviewCard: {
        backgroundColor: AppColors.white,
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    overviewTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
        marginBottom: 15,
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
    currentUserInfo: {
        flex: 1,
    },
    currentUserLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '600',
        marginBottom: 2,
    },
    currentUserName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    currentUserRight: {
        alignItems: 'flex-end',
    },
    currentUserScore: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
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
    podiumSection: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginVertical: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    podiumContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        paddingTop: 20,
    },
    podiumItem: {
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 8,
    },
    podiumFirst: {
        transform: [{ translateY: -30 }],
        zIndex: 3,
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
    podiumName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
        textAlign: 'center',
        marginBottom: 4,
    },
    podiumScore: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#667eea',
        marginBottom: 2,
    },
    podiumRank: {
        fontSize: 12,
        color: '#6c757d',
        fontWeight: '600',
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
    leaderboardListTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 4,
    },
    leaderboardListSubtitle: {
        fontSize: 14,
        color: '#6c757d',
    },
    leaderboardListContainer: {
        flex: 1,
    },
    leaderboardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f8f9fa',
    },
    currentUserRow: {
        backgroundColor: '#f8f9ff',
        borderLeftWidth: 4,
        borderLeftColor: '#667eea',
    },
    currentUserRankContainer: {
        backgroundColor: '#667eea',
    },
    rankContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
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
    userSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        marginRight: 12,
    },
    userInfo: {
        flex: 1,
    },
    nameText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 2,
    },
    currentUserNameText: {
        color: '#667eea',
        fontWeight: 'bold',
    },
    currentUserBadge: {
        backgroundColor: '#667eea',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
        alignSelf: 'flex-start',
        marginTop: 2,
    },
    currentUserBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    scoreSection: {
        alignItems: 'flex-end',
    },
    scoreText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#667eea',
    },
    currentUserScoreText: {
        color: '#667eea',
    },
    scoreLabel: {
        fontSize: 12,
        color: '#6c757d',
        fontWeight: '500',
        marginTop: 2,
    },
    emptyLeaderboard: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyLeaderboardText: {
        fontSize: 18,
        color: '#6c757d',
        marginTop: 16,
        fontWeight: '600',
    },
    emptyLeaderboardSubtext: {
        fontSize: 14,
        color: '#adb5bd',
        marginTop: 8,
        textAlign: 'center',
    },
    leaderboardList: {
        paddingBottom: 20,
    },
});

export default PracticeExamDetailsScreen; 