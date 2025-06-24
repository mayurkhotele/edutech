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
    Modal,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import LeaderboardPodium from '../../../components/LeaderboardPodium';

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
}

const PracticeExamDetailsScreen = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const [exam, setExam] = useState<PracticeExamDetails | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Info');
    const [showInstructionsModal, setShowInstructionsModal] = useState(false);
    const [declarationChecked, setDeclarationChecked] = useState(false);
    const [instructions, setInstructions] = useState<string[]>([]);
    const [examMeta, setExamMeta] = useState<{ duration?: string; maxMarks?: string } | null>(null);
    const [instructionsLoading, setInstructionsLoading] = useState(false);
    const [joiningExam, setJoiningExam] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (id) {
            fetchExamDetails();
            fetchLeaderboard();
        }
    }, [id]);

    // Refresh data when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            if (id && user?.token) {
                fetchExamDetails();
                fetchLeaderboard();
            }
        }, [id, user?.token])
    );

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
            const response = await apiFetchAuth(`/student/practice-exams/${id}/leaderboard`, user.token);
            if (response.ok) {
                setLeaderboard(response.data);
            }
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
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
        if (!id || !user?.token) return;
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
                router.push({ pathname: '/(tabs)/practice-exam/questions', params: { id } });
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

            <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                {activeTab === 'Info' && (
                    <View style={styles.infoContainer}>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaText}>Duration: <Text style={styles.metaValue}>{examMeta?.duration || '-'}</Text></Text>
                            <Text style={styles.metaText}>Maximum Marks: <Text style={styles.metaValue}>{examMeta?.maxMarks || '-'}</Text></Text>
                        </View>
                        <View style={styles.overviewCard}>
                            <Text style={styles.overviewTitle}>Exam Overview</Text>
                            <View style={styles.overviewRow}>
                                <Ionicons name="book-outline" size={20} color={AppColors.primary} />
                                <Text style={styles.overviewText}>{exam.description}</Text>
                            </View>
                            <View style={styles.overviewRow}>
                                <Ionicons name="time-outline" size={20} color={AppColors.primary} />
                                <Text style={styles.overviewText}>{exam.duration} minutes</Text>
                            </View>
                            <View style={styles.overviewRow}>
                                <Ionicons name="calendar-outline" size={20} color={AppColors.primary} />
                                <Text style={styles.overviewText}>
                                    {formatDate(exam.startTime)} - {formatDate(exam.endTime)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.spotsCard}>
                            <Text style={styles.spotsTitle}>Available Spots</Text>
                            <View style={styles.spotsInfo}>
                                <View style={styles.spotsLeft}>
                                    <Text style={styles.spotsNumber}>{exam.spotsLeft}</Text>
                                    <Text style={styles.spotsLabel}>Spots Left</Text>
                                </View>
                                <View style={styles.spotsTotal}>
                                    <Text style={styles.spotsNumber}>{exam.spots}</Text>
                                    <Text style={styles.spotsLabel}>Total Spots</Text>
                                </View>
                            </View>
                            <View style={styles.progressBar}>
                                <View 
                                    style={[
                                        styles.progressFill,
                                        { width: `${progress}%` }
                                    ]} 
                                />
                            </View>
                            <Text style={styles.progressText}>
                                {Math.round(progress)}% filled
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
                        <LeaderboardPodium
                          data={leaderboard.map((entry) => ({
                            name: entry.name,
                            points: entry.score,
                            subtitle: entry.userId, // or any other subtitle you want
                            rank: entry.rank,
                          }))}
                        />
                    </View>
                )}

                {activeTab === 'Results' && (
                    <View style={styles.resultsContainer}>
                        <Text style={styles.comingSoonText}>Results Coming Soon</Text>
                        <Ionicons name="analytics-outline" size={48} color={AppColors.grey} />
                    </View>
                )}
            </ScrollView>

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
    rankContainer: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: AppColors.lightGrey,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    rankText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: AppColors.primary,
    },
    playerInfo: {
        flex: 1,
    },
    playerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
    },
    playerScore: {
        fontSize: 14,
        color: AppColors.grey,
    },
    scoreContainer: {
        width: 50,
        height: 30,
        backgroundColor: AppColors.lightGrey,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: AppColors.primary,
    },
    emptyLeaderboard: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyLeaderboardText: {
        fontSize: 16,
        color: AppColors.grey,
        marginBottom: 10,
    },
    emptyLeaderboardSubtext: {
        fontSize: 14,
        color: AppColors.grey,
    },
    resultsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    comingSoonText: {
        fontSize: 16,
        color: AppColors.grey,
        marginBottom: 10,
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
});

export default PracticeExamDetailsScreen; 