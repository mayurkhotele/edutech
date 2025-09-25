import { AppColors } from '@/constants/Colors';
import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    Modal,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface MyExam {
    id: string;
    examId: string;
    examName: string;
    examType: 'LIVE' | 'PRACTICE';
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    timeTaken: number;
    status: string;
    completedAt?: string;
}

const MyExamsScreen = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [exams, setExams] = useState<MyExam[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'LIVE' | 'PRACTICE'>('ALL');
    const [showOnlyCompleted, setShowOnlyCompleted] = useState(true);
    const [compactView, setCompactView] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(0));
    const [showDetails, setShowDetails] = useState(false);
    const [selectedExam, setSelectedExam] = useState<MyExam | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchMyExams = async () => {
        if (!user?.token) return;

        try {
            setLoading(true);
            setError(null);
            const response = await apiFetchAuth('/student/my-exams', user.token);
            if (response.ok) {
                setExams(response.data || []);
                // Animate in the content
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }).start();
            } else {
                setError('Failed to load exams');
            }
        } catch (error) {
            console.error('Error fetching my exams:', error);
            setError('Failed to load exams');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchMyExams();
        setRefreshing(false);
    };

    useFocusEffect(
        useCallback(() => {
            fetchMyExams();
        }, [user?.token])
    );

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

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return '#10B981';
            case 'IN_PROGRESS':
                return '#F59E0B';
            case 'PENDING':
                return '#3B82F6';
            default:
                return AppColors.grey;
        }
    };

    const getExamTypeColor = (type: string) => {
        switch (type) {
            case 'LIVE':
                return '#FF4444';
            case 'PRACTICE':
                return '#4F46E5';
            default:
                return AppColors.grey;
        }
    };

    const getScorePercentage = (score: number, totalQuestions: number) => {
        if (totalQuestions === 0) return 0;
        return Math.round((score / totalQuestions) * 100);
    };

    const getPerformanceLevel = (percentage: number) => {
        if (percentage >= 90) return { level: 'Excellent', color: '#10B981', icon: 'star' };
        if (percentage >= 80) return { level: 'Good', color: '#059669', icon: 'thumbs-up' };
        if (percentage >= 70) return { level: 'Average', color: '#F59E0B', icon: 'checkmark' };
        if (percentage >= 60) return { level: 'Below Average', color: '#EF4444', icon: 'alert' };
        return { level: 'Needs Improvement', color: '#DC2626', icon: 'warning' };
    };

    const getFilteredExams = () => {
        let filtered = exams;
        
        // Apply search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(exam =>
                exam.examName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        // Apply type filter
        if (selectedFilter !== 'ALL') {
            filtered = filtered.filter(exam => exam.examType === selectedFilter);
        }

        // Show only completed attempts by default
        if (showOnlyCompleted) {
            filtered = filtered.filter(exam => exam.status === 'COMPLETED');
        }
        
        // Sort by completion date - most recent first
        filtered = filtered.sort((a, b) => {
            const dateA = new Date(a.completedAt || 0);
            const dateB = new Date(b.completedAt || 0);
            return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
        });
        
        return filtered;
    };

    const filteredExams = getFilteredExams();

    const renderFilterButton = (filter: 'ALL' | 'LIVE' | 'PRACTICE', label: string, icon: string) => (
        <TouchableOpacity
            style={[
                styles.filterButton,
                selectedFilter === filter && styles.filterButtonActive
            ]}
            onPress={() => setSelectedFilter(filter)}
            activeOpacity={0.8}
        >
            {selectedFilter === filter ? (
                <LinearGradient
                    colors={['#4F46E5', '#7C3AED', '#8B5CF6', '#A855F7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.filterButtonGradient}
                >
                    <Ionicons 
                        name={icon as any} 
                        size={14} 
                        color={AppColors.white} 
                    />
                    <Text style={styles.filterButtonTextActive}>
                        {label}
                    </Text>
                </LinearGradient>
            ) : (
                <>
                    <Ionicons 
                        name={icon as any} 
                        size={14} 
                        color={AppColors.grey} 
                    />
                    <Text style={styles.filterButtonText}>
                        {label}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );

    const renderExamRow = ({ item }: { item: MyExam }) => {
        const percentage = getScorePercentage(item.score, item.totalQuestions);
        const statusColor = getStatusColor(item.status);
        return (
            <TouchableOpacity activeOpacity={0.9} style={styles.rowItem} onPress={() => handleViewDetails(item)}>
                <View style={[styles.rowThumb, { backgroundColor: getExamTypeColor(item.examType) }]}>
                    <Ionicons name={item.examType === 'LIVE' ? 'radio' : 'school'} size={16} color={AppColors.white} />
                </View>
                <View style={styles.rowCenter}>
                    <Text style={styles.rowTitle} numberOfLines={1}>{item.examName}</Text>
                    <View style={styles.rowMeta}>
                        <View style={[styles.rowBadge, { backgroundColor: getExamTypeColor(item.examType) }]}>
                            <Text style={styles.rowBadgeText}>{item.examType}</Text>
                        </View>
                        <View style={[styles.rowBadge, { backgroundColor: statusColor }]}>
                            <Text style={styles.rowBadgeText}>{item.status}</Text>
                        </View>
                        {item.completedAt ? (
                            <Text style={styles.rowDate}>{formatDate(item.completedAt)}</Text>
                        ) : null}
                    </View>
                </View>
                <View style={styles.rowRight}>
                    <View style={styles.rowScorePill}>
                        <Text style={styles.rowScoreText}>{percentage}%</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#6c757d" />
                </View>
            </TouchableOpacity>
        );
    };

    const renderExamCard = ({ item, index }: { item: MyExam; index: number }) => {
        const percentage = getScorePercentage(item.score, item.totalQuestions);
        const performance = getPerformanceLevel(percentage);
        
        return (
            <Animated.View
                style={[
                    styles.examCard,
                    { 
                        opacity: fadeAnim,
                        transform: [{ 
                            translateY: fadeAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [50, 0]
                            })
                        }]
                    }
                ]}
            >
                <TouchableOpacity 
                    style={styles.cardTouchable} 
                    activeOpacity={0.95}
                >
                    <LinearGradient
                        colors={['#FFFFFF', '#F8FAFC', '#F1F5F9']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.cardGradient}
                    >
                        {/* Performance Indicator */}
                        <View style={[styles.performanceIndicator, { backgroundColor: performance.color }]}>
                            <Ionicons name={performance.icon as any} size={12} color={AppColors.white} />
                            <Text style={styles.performanceText}>{performance.level}</Text>
                        </View>

                        {/* Card Header */}
                        <View style={styles.cardHeader}>
                            <View style={styles.examInfo}>
                                <Text style={styles.examName} numberOfLines={2}>
                                    {item.examName}
                                </Text>
                                <View style={styles.examTypeContainer}>
                                    <View style={[styles.examTypeBadge, { backgroundColor: getExamTypeColor(item.examType) }]}>
                                        <Ionicons 
                                            name={item.examType === 'LIVE' ? 'radio-outline' : 'school-outline'} 
                                            size={12} 
                                            color={AppColors.white} 
                                        />
                                        <Text style={styles.examTypeText}>{item.examType}</Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                                        <Ionicons 
                                            name={item.status === 'COMPLETED' ? 'checkmark-circle' : 'time-outline'} 
                                            size={12} 
                                            color={AppColors.white} 
                                        />
                                        <Text style={styles.statusText}>{item.status}</Text>
                                    </View>
                                </View>
                            </View>
                            
                            {/* Score Display */}
                            <View style={styles.scoreContainer}>
                                <LinearGradient
                                    colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.scoreGradient}
                                >
                                    <Text style={styles.scoreText}>{item.score}</Text>
                                    <Text style={styles.scoreLabel}>Score</Text>
                                </LinearGradient>
                            </View>
                        </View>

                        {/* Statistics Grid */}
                        <View style={styles.statsGrid}>
                            <LinearGradient
                                colors={['#F0FDF4', '#DCFCE7', '#BBF7D0']}
                                style={styles.statItem}
                            >
                                <View style={[styles.statIconContainer, { backgroundColor: '#10B981' }]}>
                                    <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                                </View>
                                <View style={styles.statContent}>
                                    <Text style={styles.statValue}>{item.correctAnswers}</Text>
                                    <Text style={styles.statLabel}>Correct</Text>
                                </View>
                            </LinearGradient>
                            
                            <LinearGradient
                                colors={['#FEF3C7', '#FDE68A', '#FCD34D']}
                                style={styles.statItem}
                            >
                                <View style={[styles.statIconContainer, { backgroundColor: '#F59E0B' }]}>
                                    <Ionicons name="help-circle" size={16} color="#FFFFFF" />
                                </View>
                                <View style={styles.statContent}>
                                    <Text style={styles.statValue}>{item.totalQuestions}</Text>
                                    <Text style={styles.statLabel}>Total</Text>
                                </View>
                            </LinearGradient>
                            
                            <LinearGradient
                                colors={['#DBEAFE', '#BFDBFE', '#93C5FD']}
                                style={styles.statItem}
                            >
                                <View style={[styles.statIconContainer, { backgroundColor: '#3B82F6' }]}>
                                    <Ionicons name="time" size={16} color="#FFFFFF" />
                                </View>
                                <View style={styles.statContent}>
                                    <Text style={styles.statValue}>{formatTime(item.timeTaken)}</Text>
                                    <Text style={styles.statLabel}>Time</Text>
                                </View>
                            </LinearGradient>
                            
                            <LinearGradient
                                colors={['#F3E8FF', '#E9D5FF', '#DDD6FE']}
                                style={styles.statItem}
                            >
                                <View style={[styles.statIconContainer, { backgroundColor: '#8B5CF6' }]}>
                                    <Ionicons name="trophy" size={16} color="#FFFFFF" />
                                </View>
                                <View style={styles.statContent}>
                                    <Text style={styles.statValue}>{percentage}%</Text>
                                    <Text style={styles.statLabel}>Accuracy</Text>
                                </View>
                            </LinearGradient>
                        </View>

                        {/* Completion Date */}
                        {item.completedAt && (
                            <View style={styles.completedAtContainer}>
                                <View style={styles.completedAtIconContainer}>
                                    <Ionicons name="calendar" size={14} color="#6c757d" />
                                </View>
                                <Text style={styles.completedAtText}>
                                    Completed: {formatDate(item.completedAt)}
                                </Text>
                            </View>
                        )}

                        {/* View Details Button */}
                        <TouchableOpacity 
                            style={styles.viewDetailsButton}
                            onPress={() => handleViewDetails(item)}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['rgba(79, 70, 229, 0.1)', 'rgba(124, 58, 237, 0.1)', 'rgba(139, 92, 246, 0.1)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.viewDetailsGradient}
                            >
                                <Ionicons name="information-circle-outline" size={16} color="#4F46E5" />
                                <Text style={styles.viewDetailsText}>View Details</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const handleViewDetails = (exam: MyExam) => {
        try {
            const targetId = exam.examId || exam.id;
            router.push({ pathname: '/(tabs)/exam/[id]' as any, params: { id: String(targetId), from: 'my-exams', status: exam.status } });
        } catch {
            setSelectedExam(exam);
            setShowDetails(true);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient
                    colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
                    style={styles.header}
                >
                    <Text style={styles.headerTitle}>My Exams</Text>
                    <Text style={styles.headerSubtitle}>Track your progress</Text>
                </LinearGradient>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#667eea" />
                    <Text style={styles.loadingText}>Loading your exam history...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient
                    colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
                    style={styles.header}
                >
                    <Text style={styles.headerTitle}>My Exams</Text>
                    <Text style={styles.headerSubtitle}>Track your progress</Text>
                </LinearGradient>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchMyExams}>
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>My Exams</Text>
                <Text style={styles.headerSubtitle}>
                    {filteredExams.length} of {exams.length} exams completed
                </Text>
            </LinearGradient>

            {/* Search Bar */}
            <LinearGradient
                colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']}
                style={styles.searchContainer}
            >
                <View style={styles.searchInputContainer}>
                    <Ionicons name="search" size={20} color="#4F46E5" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search exams..."
                        placeholderTextColor="#6c757d"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={() => setSearchQuery('')}
                        >
                            <Ionicons name="close-circle" size={20} color="#4F46E5" />
                        </TouchableOpacity>
                    )}
                </View>
            </LinearGradient>

            {/* Filter Controls */}
            <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.filterContainer}
            >
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    {renderFilterButton('ALL', 'All', 'list')}
                    {renderFilterButton('LIVE', 'Live', 'radio')}
                    {renderFilterButton('PRACTICE', 'Practice', 'school')}
                </View>
            </LinearGradient>

            {filteredExams.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <LinearGradient
                        colors={['#ffffff', '#f8f9fa']}
                        style={styles.emptyGradient}
                    >
                        <View style={styles.emptyIconContainer}>
                            <Ionicons name="document-text-outline" size={80} color="#667eea" />
                        </View>
                        <Text style={styles.emptyTitle}>
                            {searchQuery.trim() 
                                ? 'No Matching Exams' 
                                : selectedFilter === 'ALL' 
                                    ? 'No Exams Yet' 
                                    : `No ${selectedFilter} Exams`
                            }
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {searchQuery.trim()
                                ? `No exams found matching "${searchQuery}". Try a different search term.`
                                : selectedFilter === 'ALL' 
                                    ? "You haven't taken any exams yet. Start practicing to see your results here!"
                                    : `You haven't taken any ${selectedFilter.toLowerCase()} exams yet.`
                            }
                        </Text>
                    </LinearGradient>
                </View>
            ) : (
                <FlatList
                    data={filteredExams}
                    keyExtractor={(item) => item.id}
                    renderItem={compactView ? renderExamRow : renderExamCard}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#667eea']}
                            tintColor="#667eea"
                        />
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}

            {showDetails && selectedExam && (
                <Modal
                    visible={showDetails}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowDetails(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{selectedExam.examName}</Text>
                                <TouchableOpacity 
                                    style={styles.closeIconButton}
                                    onPress={() => setShowDetails(false)}
                                >
                                    <Ionicons name="close" size={24} color="#6c757d" />
                                </TouchableOpacity>
                            </View>
                            
                            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                                {/* Exam Type & Status */}
                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>Exam Information</Text>
                                    <View style={styles.modalInfoRow}>
                                        <View style={styles.modalInfoItem}>
                                            <Ionicons name="school-outline" size={20} color="#667eea" />
                                            <Text style={styles.modalInfoLabel}>Type</Text>
                                            <Text style={styles.modalInfoValue}>{selectedExam.examType}</Text>
                                        </View>
                                        <View style={styles.modalInfoItem}>
                                            <Ionicons name="checkmark-circle-outline" size={20} color="#28a745" />
                                            <Text style={styles.modalInfoLabel}>Status</Text>
                                            <Text style={styles.modalInfoValue}>{selectedExam.status}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Score Details */}
                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>Performance</Text>
                                    <View style={styles.modalScoreContainer}>
                                        <View style={styles.modalScoreItem}>
                                            <Text style={styles.modalScoreValue}>{selectedExam.score}</Text>
                                            <Text style={styles.modalScoreLabel}>Total Score</Text>
                                        </View>
                                        <View style={styles.modalScoreItem}>
                                            <Text style={styles.modalScoreValue}>{getScorePercentage(selectedExam.score, selectedExam.totalQuestions)}%</Text>
                                            <Text style={styles.modalScoreLabel}>Percentage</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Statistics */}
                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>Statistics</Text>
                                    <View style={styles.modalStatsGrid}>
                                        <View style={styles.modalStatItem}>
                                            <Ionicons name="checkmark-circle" size={24} color="#28a745" />
                                            <Text style={styles.modalStatValue}>{selectedExam.correctAnswers}</Text>
                                            <Text style={styles.modalStatLabel}>Correct</Text>
                                        </View>
                                        <View style={styles.modalStatItem}>
                                            <Ionicons name="help-circle" size={24} color="#ffc107" />
                                            <Text style={styles.modalStatValue}>{selectedExam.totalQuestions - selectedExam.correctAnswers}</Text>
                                            <Text style={styles.modalStatLabel}>Incorrect</Text>
                                        </View>
                                        <View style={styles.modalStatItem}>
                                            <Ionicons name="time" size={24} color="#17a2b8" />
                                            <Text style={styles.modalStatValue}>{formatTime(selectedExam.timeTaken)}</Text>
                                            <Text style={styles.modalStatLabel}>Time Taken</Text>
                                        </View>
                                        <View style={styles.modalStatItem}>
                                            <Ionicons name="analytics" size={24} color="#6f42c1" />
                                            <Text style={styles.modalStatValue}>{selectedExam.totalQuestions}</Text>
                                            <Text style={styles.modalStatLabel}>Total Questions</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Completion Date */}
                                {selectedExam.completedAt && (
                                    <View style={styles.modalSection}>
                                        <Text style={styles.modalSectionTitle}>Completion Details</Text>
                                        <View style={styles.modalCompletionInfo}>
                                            <Ionicons name="calendar" size={20} color="#6c757d" />
                                            <Text style={styles.modalCompletionText}>
                                                Completed on {formatDate(selectedExam.completedAt)}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        padding: 16,
        paddingTop: 8,
        paddingBottom: 12,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
    },
    headerBackgroundPattern: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.5,
    },
    headerPatternCircle1: {
        position: 'absolute',
        top: 6,
        right: 18,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: 'rgba(255,255,255,0.25)'
    },
    headerPatternCircle2: {
        position: 'absolute',
        bottom: 8,
        left: 20,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.2)'
    },
    headerPatternDots: {
        position: 'absolute',
        top: 12,
        left: 60,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(255,255,255,0.18)'
    },
    headerShimmerBar: {
        position: 'absolute',
        top: 0,
        left: -80,
        width: 120,
        height: '100%',
        backgroundColor: 'rgba(255,255,255,0.15)',
        transform: [{ skewX: '-20deg' }],
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: AppColors.white,
        marginBottom: 4,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#495057',
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: '#f8f9fa',
    },
    errorText: {
        fontSize: 18,
        color: '#ff6b6b',
        marginTop: 16,
        textAlign: 'center',
        fontWeight: '500',
    },
    retryButton: {
        marginTop: 20,
        backgroundColor: '#667eea',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    retryButtonText: {
        color: AppColors.white,
        fontSize: 16,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f8f9fa',
    },
    emptyGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 24,
        padding: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
    },
    emptyTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#495057',
        marginTop: 24,
        marginBottom: 12,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#6c757d',
        textAlign: 'center',
        lineHeight: 24,
        fontWeight: '400',
    },
    listContainer: {
        padding: 8,
        paddingTop: 4,
    },
    examCard: {
        marginBottom: 8,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 3,
        transform: [{ scale: 1 }],
    },
    cardGradient: {
        borderRadius: 16,
        padding: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(79, 70, 229, 0.1)',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
        marginTop: 8,
    },
    examInfo: {
        flex: 1,
        marginRight: 12,
    },
    examNameContainer: {
        marginBottom: 12,
    },
    examName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 4,
        lineHeight: 20,
    },
    examTypeContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    examTypeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    examTypeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#ffffff',
        textTransform: 'uppercase',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#ffffff',
        textTransform: 'uppercase',
    },
    scoreContainer: {
        alignItems: 'center',
        minWidth: 68,
    },
    scoreGradient: {
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        minWidth: 65,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    scoreText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    scoreLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 2,
        fontWeight: '500',
    },
    scorePercentageContainer: {
        marginTop: 3,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    scorePercentage: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    cardDetails: {
        gap: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 10,
        gap: 8,
    },
    detailIconContainer: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailTextContainer: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 9,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '500',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    detailText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.95)',
        fontWeight: '600',
    },
    completedAtContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
        gap: 6,
    },
    completedAtIconContainer: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#e9ecef',
        justifyContent: 'center',
        alignItems: 'center',
    },
    completedAtText: {
        fontSize: 11,
        color: '#6c757d',
        marginLeft: 6,
    },
    cornerDecoration: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 0,
        height: 0,
        borderStyle: 'solid',
        borderLeftWidth: 40,
        borderBottomWidth: 40,
        borderLeftColor: 'transparent',
        borderBottomColor: '#e9ecef',
        borderTopRightRadius: 20,
    },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1.5,
        borderColor: '#e9ecef',
        borderRadius: 16,
        gap: 4,
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    filterButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
    },
    filterButtonActive: {
        borderColor: '#4F46E5',
        backgroundColor: 'transparent',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    filterButtonText: {
        fontSize: 12,
        color: '#6c757d',
        fontWeight: '600',
    },
    filterButtonTextActive: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '700',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    viewToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#e9ecef',
        backgroundColor: '#ffffff',
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    viewToggleActive: {
        borderColor: '#667eea',
        backgroundColor: '#667eea',
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    viewToggleText: {
        fontSize: 12,
        color: '#6c757d',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    viewToggleTextActive: {
        color: '#ffffff',
    },
    rowItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#e9ecef',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    rowThumb: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    rowCenter: {
        flex: 1,
    },
    rowTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2c3e50',
        marginBottom: 4,
    },
    rowMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
    },
    rowBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    rowBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#ffffff',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    rowDate: {
        fontSize: 11,
        color: '#6c757d',
        marginLeft: 4,
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginLeft: 10,
    },
    rowScorePill: {
        backgroundColor: '#e9ecef',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    rowScoreText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#2c3e50',
    },
    completedToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#e9ecef',
        backgroundColor: '#ffffff',
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    completedToggleActive: {
        borderColor: '#28a745',
        backgroundColor: '#28a745',
        shadowColor: '#28a745',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    completedToggleText: {
        fontSize: 12,
        color: '#6c757d',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    completedToggleTextActive: {
        color: '#ffffff',
    },
    performanceIndicator: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
        zIndex: 1,
    },
    performanceText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: AppColors.white,
        textTransform: 'uppercase',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 8,
        marginTop: 8,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        minWidth: '45%',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 10,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(79, 70, 229, 0.1)',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 1,
    },
    statIconContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    statContent: {
        flex: 1,
    },
    statValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 1,
    },
    statLabel: {
        fontSize: 10,
        color: '#6c757d',
        fontWeight: '500',
        textTransform: 'uppercase',
    },
    cardTouchable: {
        flex: 1,
    },
    emptyIconContainer: {
        marginBottom: 20,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        width: '90%',
        maxHeight: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2c3e50',
        flex: 1,
        marginRight: 16,
    },
    closeIconButton: {
        padding: 4,
    },
    modalScrollView: {
        padding: 20,
    },
    modalSection: {
        marginBottom: 24,
    },
    modalSectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 16,
    },
    modalInfoRow: {
        flexDirection: 'row',
        gap: 16,
    },
    modalInfoItem: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    modalInfoLabel: {
        fontSize: 12,
        color: '#6c757d',
        marginTop: 8,
        marginBottom: 4,
        fontWeight: '500',
        textTransform: 'uppercase',
    },
    modalInfoValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    modalScoreContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    modalScoreItem: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#667eea',
        padding: 20,
        borderRadius: 16,
    },
    modalScoreValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 4,
    },
    modalScoreLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    modalStatsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    modalStatItem: {
        flex: 1,
        minWidth: '45%',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    modalStatValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginTop: 8,
        marginBottom: 4,
    },
    modalStatLabel: {
        fontSize: 12,
        color: '#6c757d',
        fontWeight: '500',
        textTransform: 'uppercase',
    },
    modalCompletionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e9ecef',
        gap: 12,
    },
    modalCompletionText: {
        fontSize: 16,
        color: '#2c3e50',
        fontWeight: '500',
    },
    viewDetailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        marginTop: 8,
        borderWidth: 1,
        borderColor: 'rgba(79, 70, 229, 0.2)',
        gap: 6,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 1,
    },
    viewDetailsGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        gap: 6,
    },
    viewDetailsText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4F46E5',
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#2c3e50',
        paddingVertical: 12,
    },
    clearButton: {
        padding: 4,
    },
});

export default MyExamsScreen; 