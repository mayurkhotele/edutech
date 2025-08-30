import { AppColors } from '@/constants/Colors';
import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
                    <View style={styles.enhancedModalContent}>
                        <LinearGradient
                            colors={['#667eea', '#764ba2', '#f093fb']}
                            style={styles.modalHeaderGradient}
                        >
                            <View style={styles.enhancedModalHeader}>
                                <View style={styles.modalTitleContainer}>
                                    <View style={styles.modalIconContainer}>
                                        <Ionicons name="school" size={32} color="#fff" />
                                    </View>
                                    <View style={styles.modalTitleWrapper}>
                                        <Text style={styles.enhancedModalTitle}>Exam Instructions</Text>
                                        <Text style={styles.modalSubtitle}>Please read carefully before starting</Text>
                                    </View>
                                </View>
                                <TouchableOpacity 
                                    style={styles.enhancedCloseButton}
                                    onPress={() => setShowInstructionsModal(false)}
                                >
                                    <Ionicons name="close" size={24} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>

                        <View style={styles.modalBodyContainer}>
                            <ScrollView 
                                style={styles.enhancedInstructionsScroll} 
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.scrollContentContainer}
                            >
                                {/* Instructions List */}
                                <View style={styles.enhancedInstructionsSection}>
                                    <View style={styles.instructionsHeader}>
                                        <Ionicons name="list-circle" size={24} color="#667eea" />
                                        <Text style={styles.enhancedInstructionsTitle}>
                                            Important Instructions
                                        </Text>
                                    </View>
                                    {instructions.length > 0 ? (
                                        instructions.map((instruction, index) => (
                                            <View key={index} style={styles.enhancedInstructionItem}>
                                                <View style={styles.instructionNumberBadge}>
                                                    <Text style={styles.instructionNumberText}>{index + 1}</Text>
                                                </View>
                                                <Text style={styles.enhancedInstructionText}>{instruction}</Text>
                                            </View>
                                        ))
                                    ) : (
                                        <View style={styles.defaultInstructionsContainer}>
                                            <View style={styles.enhancedInstructionItem}>
                                                <View style={styles.instructionNumberBadge}>
                                                    <Text style={styles.instructionNumberText}>1</Text>
                                                </View>
                                                <Text style={styles.enhancedInstructionText}>Read each question carefully and understand the requirements before selecting your answer</Text>
                                            </View>
                                            <View style={styles.enhancedInstructionItem}>
                                                <View style={styles.instructionNumberBadge}>
                                                    <Text style={styles.instructionNumberText}>2</Text>
                                                </View>
                                                <Text style={styles.enhancedInstructionText}>Use the navigation buttons to move between questions and review your answers</Text>
                                            </View>
                                            <View style={styles.enhancedInstructionItem}>
                                                <View style={styles.instructionNumberBadge}>
                                                    <Text style={styles.instructionNumberText}>3</Text>
                                                </View>
                                                <Text style={styles.enhancedInstructionText}>Once you submit an answer, it cannot be changed - choose wisely</Text>
                                            </View>
                                            <View style={styles.enhancedInstructionItem}>
                                                <View style={styles.instructionNumberBadge}>
                                                    <Text style={styles.instructionNumberText}>4</Text>
                                                </View>
                                                <Text style={styles.enhancedInstructionText}>Ensure you have a stable internet connection throughout the exam</Text>
                                            </View>
                                            <View style={styles.enhancedInstructionItem}>
                                                <View style={styles.instructionNumberBadge}>
                                                    <Text style={styles.instructionNumberText}>5</Text>
                                                </View>
                                                <Text style={styles.enhancedInstructionText}>Do not refresh the page or close the browser during the exam</Text>
                                            </View>
                                            <View style={styles.enhancedInstructionItem}>
                                                <View style={styles.instructionNumberBadge}>
                                                    <Text style={styles.instructionNumberText}>6</Text>
                                                </View>
                                                <Text style={styles.enhancedInstructionText}>Complete all questions within the allocated time limit</Text>
                                            </View>
                                        </View>
                                    )}
                                </View>

                                {/* Declaration */}
                                <View style={styles.enhancedDeclarationSection}>
                                    <View style={styles.declarationHeader}>
                                        <Ionicons name="shield-checkmark" size={24} color="#667eea" />
                                        <Text style={styles.enhancedDeclarationTitle}>
                                            Academic Integrity Declaration
                                        </Text>
                                    </View>
                                    <View style={styles.declarationCard}>
                                        <Text style={styles.enhancedDeclarationText}>
                                            I hereby declare that I will attempt this examination honestly and independently. I understand that any form of academic dishonesty, including but not limited to cheating, plagiarism, or unauthorized assistance, will result in immediate disqualification and may have serious academic consequences.
                                        </Text>
                                        
                                        <TouchableOpacity 
                                            style={styles.enhancedCheckboxContainer}
                                            onPress={() => setDeclarationChecked(!declarationChecked)}
                                        >
                                            <View style={[styles.enhancedCheckbox, declarationChecked && styles.enhancedCheckboxChecked]}>
                                                {declarationChecked && (
                                                    <Ionicons name="checkmark" size={18} color="#fff" />
                                                )}
                                            </View>
                                            <Text style={styles.enhancedCheckboxText}>
                                                I acknowledge and agree to abide by all examination rules and academic integrity policies
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </ScrollView>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.enhancedModalActions}>
                            <TouchableOpacity 
                                style={styles.enhancedCancelButton}
                                onPress={() => setShowInstructionsModal(false)}
                            >
                                <Ionicons name="close-circle" size={20} color="#667eea" />
                                <Text style={styles.enhancedCancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[
                                    styles.enhancedBeginButton,
                                    (!declarationChecked || joiningExam) && styles.enhancedBeginButtonDisabled
                                ]}
                                onPress={handleBeginExam}
                                disabled={!declarationChecked || joiningExam}
                            >
                                <LinearGradient
                                    colors={(!declarationChecked || joiningExam) ? ['#ccc', '#999'] : ['#667eea', '#764ba2']}
                                    style={styles.beginButtonGradient}
                                >
                                    {joiningExam ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <>
                                            <Ionicons name="play-circle" size={24} color="#fff" />
                                            <Text style={styles.enhancedBeginButtonText}>Begin Exam</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Enhanced Header Section - Like Live Exam */}
            <LinearGradient
                colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.enhancedMainHeader}
            >
                {/* Background Pattern */}
                <View style={styles.headerPattern}>
                    <View style={styles.patternCircle1} />
                    <View style={styles.patternCircle2} />
                    <View style={styles.patternCircle3} />
                </View>
                
                <View style={styles.enhancedHeaderContent}>
                    <View style={styles.headerTitleSection}>
                        <View style={styles.headerIconWrapper}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']}
                                style={styles.headerIconGradient}
                            >
                                <Ionicons name="document-text" size={28} color="#FFFFFF" />
                            </LinearGradient>
                        </View>
                        <View style={styles.headerTextWrapper}>
                            <Text style={styles.enhancedHeaderTitle}>{exam?.title || 'Practice Exam'}</Text>
                            <Text style={styles.enhancedHeaderSubtitle}>
                                {exam?.category} • {exam?.duration} minutes • {exam?.spotsLeft} spots left
                            </Text>
                        </View>
                    </View>

                    {/* Info Section - Like Live Exam */}
                    <View style={styles.headerInfoSection}>
                        <LinearGradient
                            colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.12)']}
                            style={styles.headerInfoGradient}
                        >
                            <View style={styles.headerInfoContent}>
                                <View style={styles.infoItem}>
                                    <View style={styles.infoIconContainer}>
                                        <LinearGradient
                                            colors={["#FF6CAB", "#7366FF"]}
                                            style={styles.infoIconGradient}
                                        >
                                            <Ionicons name="person" size={18} color="#fff" />
                                        </LinearGradient>
                                    </View>
                                    <Text style={styles.infoLabel}>Status</Text>
                                    <Text style={styles.infoValue}>{exam?.attempted ? 'Completed' : 'Available'}</Text>
                                </View>
                                
                                <View style={styles.vsContainer}>
                                    <LinearGradient
                                        colors={["#FFD452", "#FF6CAB"]}
                                        style={styles.vsGradient}
                                    >
                                        <Text style={styles.vsText}>VS</Text>
                                    </LinearGradient>
                                </View>
                                
                                <View style={styles.infoItem}>
                                    <View style={styles.infoIconContainer}>
                                        <LinearGradient
                                            colors={["#6C63FF", "#FF6CAB"]}
                                            style={styles.infoIconGradient}
                                        >
                                            <Ionicons name="trophy" size={18} color="#fff" />
                                        </LinearGradient>
                                    </View>
                                    <Text style={styles.infoLabel}>Best Score</Text>
                                    <Text style={styles.infoValue}>{result?.score || '0'}</Text>
                                </View>
                                
                                <View style={styles.timerContainer}>
                                    <LinearGradient
                                        colors={["#6C63FF", "#7366FF"]}
                                        style={styles.timerGradient}
                                    >
                                        <Ionicons name="time" size={16} color="#fff" />
                                        <Text style={styles.timerText}>
                                            {exam?.duration}m
                                        </Text>
                                    </LinearGradient>
                                </View>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* Progress Dots - Like Live Exam */}
                    <View style={styles.headerProgressSection}>
                        <LinearGradient
                            colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.12)']}
                            style={styles.progressSectionGradient}
                        >
                            <View style={styles.progressDotsContainer}>
                                <View style={styles.progressDot}>
                                    <LinearGradient
                                        colors={exam?.attempted ? ["#10B981", "#059669"] : ['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)']}
                                        style={styles.progressDotGradient}
                                    >
                                        <Text style={styles.progressText}>1</Text>
                                    </LinearGradient>
                                </View>
                                <View style={styles.progressDot}>
                                    <LinearGradient
                                        colors={exam?.attempted ? ["#10B981", "#059669"] : ['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)']}
                                        style={styles.progressDotGradient}
                                    >
                                        <Text style={styles.progressText}>2</Text>
                                    </LinearGradient>
                                </View>
                                <View style={styles.progressDot}>
                                    <LinearGradient
                                        colors={exam?.attempted ? ["#10B981", "#059669"] : ['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)']}
                                        style={styles.progressDotGradient}
                                    >
                                        <Text style={styles.progressText}>3</Text>
                                    </LinearGradient>
                                </View>
                            </View>
                        </LinearGradient>
                    </View>
                </View>
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
                <View style={styles.contentContainer}>
                  {activeTab === 'Info' && (
                    <View style={styles.infoContainer}>
                      {/* Exam Description */}
                      {exam.description && (
                        <View style={styles.enhancedOverviewCard}>
                          <View style={styles.cardHeader}>
                            <View style={styles.iconContainer}>
                              <Ionicons name="document-text" size={24} color="#667eea" />
                            </View>
                            <Text style={styles.enhancedOverviewTitle}>Description</Text>
                          </View>
                          <Text style={styles.enhancedDescriptionText}>{exam.description}</Text>
                        </View>
                      )}

                      {/* Exam Details */}
                      <View style={styles.enhancedOverviewCard}>
                        <View style={styles.cardHeader}>
                          <View style={styles.iconContainer}>
                            <Ionicons name="information-circle" size={24} color="#667eea" />
                          </View>
                          <Text style={styles.enhancedOverviewTitle}>Exam Details</Text>
                        </View>
                        <View style={styles.enhancedDetailsGrid}>
                          <View style={styles.detailItem}>
                            <Ionicons name="folder-outline" size={20} color="#667eea" />
                            <View>
                              <Text style={styles.detailLabel}>Category</Text>
                              <Text style={styles.detailValue}>{exam.category}</Text>
                            </View>
                          </View>
                          {exam.subcategory && (
                            <View style={styles.detailItem}>
                              <Ionicons name="folder-open-outline" size={20} color="#667eea" />
                              <View>
                                <Text style={styles.detailLabel}>Subcategory</Text>
                                <Text style={styles.detailValue}>{exam.subcategory}</Text>
                              </View>
                            </View>
                          )}
                          <View style={styles.detailItem}>
                            <Ionicons name="time-outline" size={20} color="#667eea" />
                            <View>
                              <Text style={styles.detailLabel}>Duration</Text>
                              <Text style={styles.detailValue}>{exam.duration} minutes</Text>
                            </View>
                          </View>
                          <View style={styles.detailItem}>
                            <Ionicons name="help-circle-outline" size={20} color="#667eea" />
                            <View>
                              <Text style={styles.detailLabel}>Questions</Text>
                              <Text style={styles.detailValue}>{examMeta?.maxMarks || 'Not specified'}</Text>
                            </View>
                          </View>
                          <View style={styles.detailItem}>
                            <Ionicons name="trophy-outline" size={20} color="#667eea" />
                            <View>
                              <Text style={styles.detailLabel}>Max Marks</Text>
                              <Text style={styles.detailValue}>{examMeta?.maxMarks || 'Not specified'}</Text>
                            </View>
                          </View>
                          <View style={styles.detailItem}>
                            <Ionicons name="people-outline" size={20} color="#667eea" />
                            <View>
                              <Text style={styles.detailLabel}>Available Spots</Text>
                              <Text style={styles.detailValue}>{exam.spotsLeft} / {exam.spots}</Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* Action Button */}
                      <TouchableOpacity 
                        style={[
                          styles.enhancedActionButton,
                          exam.attempted ? styles.enhancedReviewButton : styles.enhancedStartButton
                        ]}
                        onPress={exam.attempted ? handleReviewExam : handleStartExam}
                      >
                        <LinearGradient
                          colors={exam.attempted ? ['#ff6b6b', '#ee5a52'] : ['#667eea', '#764ba2']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.actionButtonGradient}
                        >
                          <Ionicons 
                            name={exam.attempted ? "eye" : "play"} 
                            size={24} 
                            color="#fff" 
                          />
                          <Text style={styles.enhancedActionButtonText}>
                            {exam.attempted ? 'Review Results' : 'Start Practice Exam'}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  )}

                  {activeTab === 'Leaderboard' && (
                    <View style={styles.leaderboardContainer}>
                      {leaderboardLoading ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="large" color="#667eea" />
                          <Text style={styles.loadingText}>Loading Leaderboard...</Text>
                        </View>
                      ) : leaderboard.length > 0 ? (
                        <ScrollView 
                          style={styles.leaderboardScrollView}
                          showsVerticalScrollIndicator={false}
                          contentContainerStyle={styles.leaderboardScrollContent}
                        >
                          {/* Enhanced Header Section */}
                          <View style={styles.enhancedLeaderboardHeader}>
                            <LinearGradient
                              colors={['#667eea', '#764ba2']}
                              style={styles.headerGradient}
                            >
                              <View style={styles.headerContent}>
                                <View style={styles.headerLeft}>
                                  <Ionicons name="trophy" size={32} color="#FFD700" />
                                  <View style={styles.headerTextContainer}>
                                    <Text style={styles.enhancedLeaderboardTitle}>🏆 Leaderboard</Text>
                                    <Text style={styles.enhancedLeaderboardSubtitle}>
                                      {leaderboard.length} participant{leaderboard.length !== 1 ? 's' : ''} • Live Rankings
                                    </Text>
                                  </View>
                                </View>
                                <View style={styles.headerRight}>
                                  <View style={styles.statsBadge}>
                                    <Text style={styles.statsNumber}>{leaderboard.length}</Text>
                                    <Text style={styles.statsLabel}>Total</Text>
                                  </View>
                                </View>
                              </View>
                            </LinearGradient>
                          </View>

                          {/* Enhanced Current User Card */}
                          {currentUser && (
                            <View style={styles.enhancedCurrentUserCard}>
                              <LinearGradient
                                colors={['#FFD700', '#FFA500']}
                                style={styles.currentUserGradient}
                              >
                                <View style={styles.currentUserContent}>
                                  <View style={styles.currentUserLeft}>
                                    <View style={styles.currentUserRankBadge}>
                                      <Ionicons name="star" size={24} color="#fff" />
                                      <Text style={styles.currentUserRankNumber}>#{currentUser.rank}</Text>
                                    </View>
                                    <View style={styles.currentUserInfo}>
                                      <Text style={styles.currentUserName}>{currentUser.name}</Text>
                                      <Text style={styles.currentUserScoreLabel}>Your Performance</Text>
                                    </View>
                                  </View>
                                  <View style={styles.currentUserRight}>
                                    <Text style={styles.currentUserScore}>{currentUser.score} pts</Text>
                                    <Text style={styles.currentUserTime}>{currentUser.timeTaken || 0}s</Text>
                                  </View>
                                </View>
                              </LinearGradient>
                            </View>
                          )}

                          {/* Enhanced Participants List */}
                          <View style={styles.enhancedParticipantsList}>
                            <View style={styles.participantsHeader}>
                              <Text style={styles.participantsTitle}>📊 All Participants</Text>
                              <View style={styles.participantsFilter}>
                                <Ionicons name="filter" size={16} color="#667eea" />
                                <Text style={styles.filterText}>Ranked by Score</Text>
                              </View>
                            </View>
                            
                            {leaderboard.map((item, index) => (
                              <View key={item.userId} style={[
                                styles.enhancedParticipantCard,
                                currentUser?.userId === item.userId && styles.currentUserParticipantCard,
                                index === 0 && styles.firstPlaceCard,
                                index === 1 && styles.secondPlaceCard,
                                index === 2 && styles.thirdPlaceCard
                              ]}>
                                <View style={styles.participantLeft}>
                                  <View style={[
                                    styles.enhancedRankBadge,
                                    index === 0 && styles.firstPlaceBadge,
                                    index === 1 && styles.secondPlaceBadge,
                                    index === 2 && styles.thirdPlaceBadge
                                  ]}>
                                    {index < 3 ? (
                                      <Ionicons 
                                        name={index === 0 ? "trophy" : index === 1 ? "medal" : "ribbon"} 
                                        size={20} 
                                        color={index === 0 ? "#FFD700" : index === 1 ? "#C0C0C0" : "#CD7F32"} 
                                      />
                                    ) : (
                                      <Text style={styles.rankNumber}>{item.rank}</Text>
                                    )}
                                  </View>
                                  <View style={styles.enhancedParticipantAvatar}>
                                    <Ionicons name="person-circle" size={44} color="#667eea" />
                                    {currentUser?.userId === item.userId && (
                                      <View style={styles.currentUserIndicator}>
                                        <Ionicons name="star" size={12} color="#FFD700" />
                                      </View>
                                    )}
                                  </View>
                                  <View style={styles.participantInfo}>
                                    <Text style={styles.participantName}>{item.name}</Text>
                                    <View style={styles.participantDetails}>
                                      <Ionicons name="time-outline" size={12} color="#666" />
                                      <Text style={styles.participantTime}>Completed in {item.timeTaken || 0}s</Text>
                                    </View>
                                  </View>
                                </View>
                                <View style={styles.participantRight}>
                                  <Text style={styles.participantScore}>{item.score} pts</Text>
                                  {currentUser?.userId === item.userId && (
                                    <View style={styles.currentUserBadge}>
                                      <Ionicons name="star" size={10} color="#fff" />
                                      <Text style={styles.currentUserBadgeText}>You</Text>
                                    </View>
                                  )}
                                </View>
                              </View>
                            ))}
                          </View>
                        </ScrollView>
                      ) : (
                        <View style={styles.emptyContainer}>
                          <View style={styles.emptyIconContainer}>
                            <Ionicons name="trophy-outline" size={64} color="#667eea" />
                          </View>
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
                          <ActivityIndicator size="large" color="#667eea" />
                          <Text style={styles.loadingText}>Loading Results...</Text>
                        </View>
                      ) : result ? (
                        <View style={styles.enhancedResultCard}>
                          <LinearGradient
                            colors={['#667eea', '#764ba2']}
                            style={styles.resultHeaderGradient}
                          >
                            <View style={styles.resultHeader}>
                              <Ionicons name="trophy" size={48} color="#FFD700" />
                              <Text style={styles.resultTitle}>Practice Exam Results</Text>
                              <Text style={styles.resultScore}>Score: <Text style={{ color: '#FFD700' }}>{result.score}</Text> / {result.totalQuestions}</Text>
                            </View>
                          </LinearGradient>
                          <View style={styles.enhancedSummaryGrid}>
                            <View style={[styles.enhancedSummaryCard, { backgroundColor: '#e8f5e8' }]}> 
                              <Ionicons name="checkmark-circle" size={32} color="#28a745" />
                              <Text style={[styles.enhancedSummaryValue, { color: '#28a745' }]}>{result.correctAnswers}</Text>
                              <Text style={styles.enhancedSummaryLabel}>Correct</Text>
                            </View>
                            <View style={[styles.enhancedSummaryCard, { backgroundColor: '#ffeaea' }]}> 
                              <Ionicons name="close-circle" size={32} color="#dc3545" />
                              <Text style={[styles.enhancedSummaryValue, { color: '#dc3545' }]}>{result.wrongAnswers}</Text>
                              <Text style={styles.enhancedSummaryLabel}>Incorrect</Text>
                            </View>
                            <View style={[styles.enhancedSummaryCard, { backgroundColor: '#f0f0f0' }]}> 
                              <Ionicons name="remove-circle" size={32} color="#6c757d" />
                              <Text style={[styles.enhancedSummaryValue, { color: '#6c757d' }]}>{result.unattempted}</Text>
                              <Text style={styles.enhancedSummaryLabel}>Unattempted</Text>
                            </View>
                          </View>
                          <TouchableOpacity 
                            style={styles.enhancedAnalysisButton}
                            onPress={() => router.push({ pathname: '/(tabs)/practice-exam/result/[id]', params: { id } })}
                          >
                            <LinearGradient
                              colors={['#667eea', '#764ba2']}
                              style={styles.analysisButtonGradient}
                            >
                              <Ionicons name="analytics-outline" size={20} color="#fff" />
                              <Text style={styles.enhancedAnalysisButtonText}>View Detailed Analysis</Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.enhancedNoResultContainer}>
                          <View style={styles.emptyIconContainer}>
                            <Ionicons name="document-text-outline" size={64} color="#667eea" />
                          </View>
                          <Text style={styles.noResultTitle}>No Results Available</Text>
                          <Text style={styles.noResultText}>
                            {exam?.attempted 
                              ? "Could not load your exam results. Please try again later."
                              : "You haven't attempted this exam yet. Start the exam to see your results."
                            }
                          </Text>
                          {!exam?.attempted && (
                            <TouchableOpacity
                              style={styles.enhancedStartExamButton}
                              onPress={handleStartExam}
                            >
                              <LinearGradient
                                colors={['#667eea', '#764ba2']}
                                style={styles.startExamButtonGradient}
                              >
                                <Ionicons name="play" size={20} color="#fff" />
                                <Text style={styles.startExamButtonText}>Start Exam</Text>
                              </LinearGradient>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.lightGrey,
    },
    // Enhanced Header Styles - Like Live Exam
    enhancedMainHeader: {
        paddingTop: 16,
        paddingHorizontal: 16,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        position: 'relative',
        overflow: 'hidden',
    },
    headerPattern: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.15,
    },
    patternCircle1: {
        position: 'absolute',
        top: 15,
        right: 25,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    patternCircle2: {
        position: 'absolute',
        bottom: 30,
        left: 15,
        width: 35,
        height: 35,
        borderRadius: 17.5,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    patternCircle3: {
        position: 'absolute',
        top: 45,
        left: 40,
        width: 25,
        height: 25,
        borderRadius: 12.5,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    enhancedHeaderContent: {
        position: 'relative',
        zIndex: 1,
    },
    headerTitleSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerIconWrapper: {
        marginRight: 12,
    },
    headerIconGradient: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.25)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    headerTextWrapper: {
        flex: 1,
    },
    enhancedHeaderTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    enhancedHeaderSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
    },
    headerInfoSection: {
        marginBottom: 16,
    },
    headerInfoGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 16,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.25)',
    },
    headerInfoContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    infoItem: {
        alignItems: 'center',
        flex: 1,
    },
    infoIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    infoIconGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 10,
        color: '#fff',
        marginBottom: 2,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    vsContainer: {
        alignItems: 'center',
        marginHorizontal: 8,
    },
    vsGradient: {
        borderRadius: 12,
        paddingVertical: 6,
        paddingHorizontal: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    vsText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    timerContainer: {
        alignItems: 'center',
        marginLeft: 8,
    },
    timerGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    timerText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 4,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    headerProgressSection: {
        marginTop: 8,
    },
    progressSectionGradient: {
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.25)',
    },
    progressDotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressDot: {
        marginHorizontal: 6,
    },
    progressDotGradient: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    progressText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
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
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 100,
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
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    podiumContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        paddingVertical: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    podiumItem: {
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 8,
        borderRadius: 20,
        overflow: 'hidden',
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
        marginBottom: 12,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 12,
        marginVertical: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    currentUserRow: {
        backgroundColor: '#f8f9ff',
        borderWidth: 2,
        borderColor: '#667eea',
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
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
    currentUserNameText: {
        color: '#667eea',
        fontWeight: 'bold',
    },
    currentUserBadge: {
        backgroundColor: '#667eea',
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginTop: 4,
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
        color: '#1a73e8',
    },
    currentUserScoreText: {
        color: '#667eea',
        fontSize: 20,
    },
    scoreLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
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
        transform: [{ translateY: -25 }],
        zIndex: 2,
    },
    podiumGradient: {
        width: '100%',
        padding: 16,
        alignItems: 'center',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    crownContainer: {
        marginBottom: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 25,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    podiumAvatar: {
        marginBottom: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 35,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    podiumName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    podiumScore: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    podiumRank: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    podiumRankText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    leaderboardListSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    leaderboardList: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    leaderboardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        marginBottom: 8,
        backgroundColor: '#f8f9fa',
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    rankNumberContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    rankNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    userAvatar: {
        marginRight: 12,
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderRadius: 20,
        padding: 4,
    },
    userName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    scoreContainer: {
        alignItems: 'flex-end',
    },
    userScore: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#667eea',
    },
    scoreLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    podiumTime: {
        fontSize: 12,
        color: '#fff',
        marginBottom: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 16,
        textAlign: 'center',
    },
    currentUserSection: {
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    currentUserGradient: {
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    currentUserContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
        paddingVertical: 8,
        marginRight: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    currentUserRankNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 4,
    },
    currentUserInfo: {
        flex: 1,
    },
    currentUserName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 2,
    },
    currentUserScoreLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    currentUserRight: {
        alignItems: 'flex-end',
    },
    currentUserScore: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 2,
    },
    currentUserTime: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    userInfo: {
        flex: 1,
        marginLeft: 12,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    userTime: {
        fontSize: 12,
        color: '#666',
    },
    currentUserIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    currentUserIndicatorText: {
        fontSize: 10,
        color: '#667eea',
        fontWeight: 'bold',
        marginLeft: 2,
    },
    // Enhanced Leaderboard Styles
    leaderboardScrollView: {
        flex: 1,
    },
    leaderboardScrollContent: {
        paddingBottom: 20,
    },
    enhancedLeaderboardHeader: {
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    headerGradient: {
        padding: 20,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerTextContainer: {
        marginLeft: 12,
    },
    enhancedLeaderboardTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 2,
    },
    enhancedLeaderboardSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
    },
    headerRight: {
        alignItems: 'center',
    },
    statsBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        alignItems: 'center',
    },
    statsNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    statsLabel: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '500',
    },
    enhancedCurrentUserCard: {
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    currentUserGradient: {
        padding: 20,
    },
    currentUserContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    currentUserLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    currentUserRankBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    currentUserRankNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 4,
    },
    currentUserInfo: {
        flex: 1,
    },
    currentUserName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 2,
    },
    currentUserScoreLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    currentUserRight: {
        alignItems: 'flex-end',
    },
    currentUserScore: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 2,
    },
    currentUserTime: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    enhancedParticipantsList: {
        flex: 1,
    },
    participantsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    participantsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    participantsFilter: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    filterText: {
        fontSize: 12,
        color: '#667eea',
        fontWeight: '500',
        marginLeft: 4,
    },
    enhancedParticipantCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        marginBottom: 12,
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(102, 126, 234, 0.1)',
    },
    firstPlaceCard: {
        backgroundColor: '#fff8e1',
        borderColor: '#FFD700',
        borderWidth: 2,
    },
    secondPlaceCard: {
        backgroundColor: '#f5f5f5',
        borderColor: '#C0C0C0',
        borderWidth: 2,
    },
    thirdPlaceCard: {
        backgroundColor: '#fff3e0',
        borderColor: '#CD7F32',
        borderWidth: 2,
    },
    currentUserParticipantCard: {
        backgroundColor: '#f0f4ff',
        borderColor: '#667eea',
        borderWidth: 2,
    },
    participantLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    enhancedRankBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    firstPlaceBadge: {
        backgroundColor: '#fff8e1',
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    secondPlaceBadge: {
        backgroundColor: '#f5f5f5',
        borderWidth: 2,
        borderColor: '#C0C0C0',
    },
    thirdPlaceBadge: {
        backgroundColor: '#fff3e0',
        borderWidth: 2,
        borderColor: '#CD7F32',
    },
    rankNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#6c757d',
    },
    enhancedParticipantAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        position: 'relative',
    },
    currentUserIndicator: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#FFD700',
        borderRadius: 8,
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    participantInfo: {
        flex: 1,
    },
    participantName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    participantDetails: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    participantTime: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    participantRight: {
        alignItems: 'flex-end',
    },
    participantScore: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a73e8',
        marginBottom: 4,
    },
    currentUserBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#667eea',
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    currentUserBadgeText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 2,
    },
    enhancedAnalysisButton: {
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
    enhancedAnalysisButtonText: {
        color: '#6C63FF',
        fontWeight: 'bold',
        fontSize: 15,
        marginLeft: 8,
    },
    enhancedNoResultContainer: {
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
    startExamButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    startExamButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
    enhancedResultCard: {
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
    resultHeaderGradient: {
        width: '100%',
        borderRadius: 18,
        padding: 20,
        alignItems: 'center',
        marginBottom: 18,
    },
    enhancedSummaryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 18,
        width: '100%',
    },
    enhancedSummaryCard: {
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
    enhancedSummaryValue: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 8,
        marginBottom: 4,
    },
    enhancedSummaryLabel: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyIconContainer: {
        marginBottom: 16,
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
    // Modal Styles (for Instructions Modal)
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 120,
    },
    enhancedModalContent: {
        width: '85%',
        maxHeight: '60%',
        backgroundColor: AppColors.white,
        borderRadius: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        flexDirection: 'column',
        paddingBottom: 20,
    },
    modalHeaderGradient: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
    },
    enhancedModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
        minHeight: 40,
    },
    modalTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    enhancedModalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 10,
    },
    enhancedCloseButton: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
    },
    modalBodyContainer: {
        flex: 1,
        paddingHorizontal: 16,
        minHeight: 250,
        backgroundColor: AppColors.white,
    },
    enhancedInstructionsScroll: {
        flex: 1,
    },
    scrollContentContainer: {
        paddingVertical: 16,
        paddingBottom: 20,
    },
    enhancedInstructionsSection: {
        marginBottom: 10,
        backgroundColor: AppColors.white,
        paddingBottom: 30,
        paddingTop: 20,
        minHeight: 300,
    },
    enhancedInstructionsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    enhancedInstructionItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 6,
        backgroundColor: 'transparent',
        borderRadius: 8,
        padding: 8,
        borderLeftWidth: 2,
        borderLeftColor: '#667eea',
    },
    instructionNumberBadge: {
        backgroundColor: '#667eea',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        flexShrink: 0,
    },
    instructionNumberText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#fff',
    },
    enhancedInstructionText: {
        flex: 1,
        fontSize: 13,
        color: '#2c3e50',
        lineHeight: 18,
        fontWeight: '400',
    },
    defaultInstructionsContainer: {
        gap: 8,
    },
    enhancedDeclarationSection: {
        marginBottom: 10,
        backgroundColor: AppColors.white,
        paddingBottom: 5,
    },
    enhancedDeclarationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    declarationCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        padding: 18,
        borderLeftWidth: 4,
        borderLeftColor: '#667eea',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    enhancedDeclarationText: {
        fontSize: 14,
        color: '#34495e',
        lineHeight: 21,
        marginBottom: 14,
        fontWeight: '400',
    },
    enhancedCheckboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    enhancedCheckbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#667eea',
        backgroundColor: '#fff',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    enhancedCheckboxChecked: {
        backgroundColor: '#667eea',
        borderColor: '#667eea',
    },
    enhancedCheckboxText: {
        fontSize: 14,
        color: '#2c3e50',
        flex: 1,
        fontWeight: '500',
    },
    enhancedModalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
        backgroundColor: AppColors.white,
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
    enhancedCancelButton: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#667eea',
        alignItems: 'center',
        marginRight: 10,
    },
    enhancedCancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#667eea',
    },
    enhancedBeginButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: '#667eea',
        gap: 8,
    },
    enhancedBeginButtonDisabled: {
        backgroundColor: '#bdc3c7',
        opacity: 0.6,
    },
    enhancedBeginButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    // Info Tab Styles (keeping original)
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
    iconContainer: {
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderRadius: 12,
        padding: 10,
        marginRight: 12,
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
        marginBottom: 20,
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
    analysisButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    enhancedStartExamButton: {
        backgroundColor: 'transparent',
        borderRadius: 8,
        overflow: 'hidden',
        marginTop: 20,
    },
    modalIconContainer: {
        marginRight: 10,
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderRadius: 12,
        padding: 10,
    },
    modalTitleWrapper: {
        flexDirection: 'column',
    },
    modalSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 4,
    },
    instructionsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    declarationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    beginButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        gap: 8,
    },
});

export default PracticeExamDetailsScreen; 