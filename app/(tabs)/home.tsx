import { apiFetchAuth } from '@/constants/api';
import { AppColors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { filterActiveExams } from '@/utils/examFilter';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CommonHeader from '../../components/CommonHeader';
import CustomBannerSlider from '../../components/CustomBannerSlider';
import ExamCard from '../../components/ExamCard';
import ExamNotificationsSection from '../../components/ExamNotificationsSection';
import OurFeaturesSection from '../../components/OurFeaturesSection';
import QuestionOfTheDayPreview from '../../components/QuestionOfTheDayPreview';
import TopPerformersSection from '../../components/TopPerformersSection';

const { width: screenWidth } = Dimensions.get('window');



export default function HomeScreen() {
    const { user } = useAuth();
    const { walletAmount, refreshWalletAmount } = useWallet();
    const router = useRouter();
    const navigation = useNavigation();

    // Force re-render when user state changes
    React.useEffect(() => {
        console.log('🏠 Home screen re-rendered, user state:', {
            hasUser: !!user,
            userId: user?.id,
            hasToken: !!user?.token,
            tokenLength: user?.token?.length,
            userName: user?.name
        });

        if (user?.token) {

        } else {

        }
    }, [user]);
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Refs for sliders and components
    const examSliderRef = useRef<FlatList<any>>(null);
    const [currentExamIndex, setCurrentExamIndex] = useState(0);
    const autoScrollInterval = useRef<ReturnType<typeof setInterval>>(null);

    // Auto scroll function
    const startAutoScroll = () => {
        autoScrollInterval.current = setInterval(() => {
            if (featuredExams.length > 1) {
                const nextIndex = (currentExamIndex + 1) % featuredExams.length;
                examSliderRef.current?.scrollToIndex({
                    index: nextIndex,
                    animated: true,
                    viewPosition: 0
                });
                setCurrentExamIndex(nextIndex);
            }
        }, 3000); // Scroll every 3 seconds
    };

    // Stop auto scroll
    const stopAutoScroll = () => {
        if (autoScrollInterval.current) {
            clearInterval(autoScrollInterval.current);
        }
    };

    // Data for sliders - filter out expired exams
    const activeExams = filterActiveExams(exams);
    const featuredExams = activeExams.slice(0, 5);

    // Fetch Exams Function
    const fetchExams = async () => {
        console.log('🏠 Home screen - User data:', {
            hasUser: !!user,
            userId: user?.id,
            hasToken: !!user?.token,
            tokenLength: user?.token?.length,
            userName: user?.name
        });

        if (!user?.token) {

            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            const response = await apiFetchAuth('/student/exams', user.token);

            if (response.ok) setExams(response.data);
        } catch (error) {
            console.error('❌ Error fetching exams:', error);
        } finally {
            setLoading(false);
        }
    };

    // Simple Refresh Function
    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchExams();
        } catch (error) {
            console.error('Error refreshing home page:', error);
        } finally {
            setRefreshing(false);
        }
    };

    // Fetch Exams Effect and Start Auto Scroll
    useEffect(() => {
        fetchExams();
        if (featuredExams.length > 0) {
            startAutoScroll();
            return () => stopAutoScroll();
        }
    }, [user, featuredExams.length]);

    // Auto-refresh every 30 seconds when screen is active
    useEffect(() => {
        const interval = setInterval(() => {
            if (user?.token) {
                fetchExams();
            }
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [user?.token]);
    


    const renderExamCard = ({ item }: { item: any }) => (
        <View style={{ 
            width: screenWidth - 40,
            marginHorizontal: 10,
        }}>
            <ExamCard exam={item} navigation={router} />
        </View>
    );
    


  return (
    <>
      <CommonHeader showMainOptions={true} />
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#667eea']}
            tintColor="#667eea"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Custom Banner Slider */}
        <CustomBannerSlider onBannerPress={(banner) => {
                        // Handle banner press - navigate to different screens based on banner
                        switch (banner.action) {
                            case 'practice-exam':
                                router.push('/(tabs)/practice-exam');
                                break;
                            case 'exam':
                                router.push('/(tabs)/exam');
                                break;
                            case 'profile':
                                router.push('/(tabs)/profile');
                                break;
                            default:
                                break;
                        }
                    }} />

                    {/* Enhanced Live Exams Header */}
                    <View style={styles.enhancedLiveExamsHeader}>
                        <LinearGradient
                            colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.enhancedHeaderGradient}
                        >
                            <View style={styles.enhancedHeaderContent}>
                                <View style={styles.enhancedHeaderLeft}>
                                    <View style={styles.enhancedIconContainer}>
                                        <Ionicons name="flash" size={20} color="#FFFFFF" />
                                    </View>
                                    <View style={styles.enhancedTextContainer}>
                                        <Text style={styles.enhancedHeaderTitle}>Live Exams</Text>
                                        <Text style={styles.enhancedHeaderSubtitle}>Join now & win rewards</Text>
                                    </View>
                                </View>
                                <TouchableOpacity 
                                    style={styles.enhancedViewAllButton}
                                    onPress={() => router.push('/(tabs)/exam')}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.enhancedViewAllText}>View All</Text>
                                    <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </View>

            {loading ? (
                <ActivityIndicator size="large" color={AppColors.primary} style={{ marginTop: 20 }} />
            ) : featuredExams.length === 0 ? (
                <View style={styles.emptyCard}>
                    <View style={styles.emptyContainer}>
                        <Ionicons name="library-outline" size={48} color={AppColors.grey} />
                        <Text style={styles.emptyTitle}>No Exams Available</Text>
                        <Text style={styles.emptySubtext}>Check back later for new featured exams.</Text>
                    </View>
                </View>
            ) : (
                <>
                    <FlatList
                        ref={examSliderRef}
                        data={featuredExams}
                        renderItem={renderExamCard}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.listContainer}
                        onScrollBeginDrag={stopAutoScroll}
                        onScrollEndDrag={startAutoScroll}
                        onMomentumScrollEnd={(event) => {
                            const offsetX = event.nativeEvent.contentOffset.x;
                            const index = Math.round(offsetX / (screenWidth - 20));
                            setCurrentExamIndex(Math.min(index, featuredExams.length - 1));
                        }}
                        getItemLayout={(data, index) => ({
                            length: screenWidth - 20,
                            offset: (screenWidth - 20) * index,
                            index,
                        })}
                        snapToInterval={screenWidth - 20}
                        snapToAlignment="center"
                        decelerationRate="fast"
                        pagingEnabled
                    />
                    <View style={styles.paginationContainer}>
                        {featuredExams.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.paginationDot,
                                    currentExamIndex === index && styles.paginationDotActive
                                ]}
                            />
                        ))}
                    </View>
                </>
            )}
            
            {/* Question of the Day Section */}
            <QuestionOfTheDayPreview />

            {/* Our Features Section */}
            <OurFeaturesSection />

            {/* Revolutionary Stories that Inspire Section */}
            <View style={styles.revolutionaryStoriesSection}>
                {/* Premium Header */}
                <LinearGradient
                    colors={['#F97316', '#EA580C', '#DC2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.revolutionaryStoriesHeader}
                >
                    <View style={styles.revolutionaryHeaderContent}>
                        <View style={styles.revolutionaryHeaderLeft}>
                            <View style={styles.revolutionaryIconContainer}>
                                <Ionicons name="star" size={24} color="#FFFFFF" />
                            </View>
                            <View style={styles.revolutionaryTextContainer}>
                                <Text style={styles.revolutionaryTitle}>Stories that</Text>
                                <Text style={styles.revolutionaryTitleUnderlined}>inspire</Text>
                            </View>
                        </View>
                        <View style={styles.revolutionaryStatsContainer}>
                            <Text style={styles.revolutionaryStatsText}>500+ Success Stories</Text>
                        </View>
                    </View>
                </LinearGradient>
                
                {/* Featured Success Story */}
                <View style={styles.revolutionaryFeaturedStory}>
                    <View style={styles.featuredStoryVideoSection}>
                        <View style={styles.revolutionaryVideoThumbnail}>
                            <LinearGradient
                                colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)']}
                                style={styles.videoOverlay}
                            >
                                <View style={styles.revolutionaryPlayButton}>
                                    <Ionicons name="play" size={28} color="#FFFFFF" />
                                </View>
                            </LinearGradient>
                        </View>
                        <View style={styles.videoBadge}>
                            <Ionicons name="trophy" size={16} color="#F97316" />
                            <Text style={styles.videoBadgeText}>Success Story</Text>
                        </View>
                    </View>
                    
                    <View style={styles.revolutionaryStoryContent}>
                        <View style={styles.revolutionaryQuoteSection}>
                            <View style={styles.revolutionaryQuoteIcon}>
                                <Ionicons name="chatbubbles" size={36} color="#F97316" />
                            </View>
                            <Text style={styles.revolutionaryQuoteText}>
                                "After joining this platform, I cracked my dream exam and discovered my true potential. The guidance was exceptional!"
                            </Text>
                        </View>
                        
                        <View style={styles.revolutionaryStudentInfo}>
                            <View style={styles.revolutionaryStudentAvatar}>
                                <LinearGradient
                                    colors={['#F97316', '#EA580C']}
                                    style={styles.avatarGradient}
                                >
                                    <Ionicons name="person" size={24} color="#FFFFFF" />
                                </LinearGradient>
                            </View>
                            <View style={styles.revolutionaryStudentDetails}>
                                <Text style={styles.revolutionaryStudentName}>Priya Sharma</Text>
                                <View style={styles.revolutionaryAchievementBadge}>
                                    <Ionicons name="medal" size={14} color="#F97316" />
                                    <Text style={styles.revolutionaryAchievementText}>AIR 2973 | NEET 2024</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Revolutionary Success Stories Carousel */}
                <View style={styles.revolutionaryCarouselContainer}>
                    <View style={styles.carouselHeader}>
                        <Text style={styles.carouselTitle}>More Success Stories</Text>
                        <TouchableOpacity style={styles.revolutionaryViewAllButton}>
                            <Text style={styles.revolutionaryViewAllText}>View All</Text>
                            <Ionicons name="arrow-forward" size={16} color="#F97316" />
                        </TouchableOpacity>
                    </View>
                    
                    <FlatList
                        data={[
                            {
                                id: '1',
                                name: 'Rahul Kumar',
                                achievement: 'NEET Score: 575',
                                testimonial: 'I had an amazing experience. All my concepts were crystal clear and I felt super confident during the exam.',
                                type: 'text',
                                rank: '1'
                            },
                            {
                                id: '2',
                                name: 'Sneha Patel',
                                achievement: '98.4% CBSE XII',
                                testimonial: 'The LIVE Interactive classes with visual explanations helped me learn and retain everything perfectly.',
                                type: 'text',
                                rank: '2'
                            },
                            {
                                id: '3',
                                name: 'Amit Singh',
                                achievement: '98.2% CBSE XII',
                                testimonial: 'The practice tests and mock exams were exactly what I needed to boost my confidence to the next level.',
                                type: 'text',
                                rank: '3'
                            }
                        ]}
                        renderItem={({ item, index }) => (
                            <View style={[
                                styles.revolutionaryStoryCard,
                                index === 0 && styles.firstCard,
                                index === 1 && styles.secondCard,
                                index === 2 && styles.thirdCard
                            ]}>
                                <View style={styles.cardRankBadge}>
                                    <Text style={styles.cardRankText}>#{item.rank}</Text>
                                </View>
                                
                                <View style={styles.revolutionaryCardContent}>
                                    <Text style={styles.revolutionaryCardTestimonial} numberOfLines={4}>
                                        "{item.testimonial}"
                                    </Text>
                                    
                                    <View style={styles.revolutionaryCardStudentSection}>
                                        <View style={styles.revolutionaryCardAvatar}>
                                            <LinearGradient
                                                colors={['#8B5CF6', '#7C3AED']}
                                                style={styles.cardAvatarGradient}
                                            >
                                                <Ionicons name="person" size={18} color="#FFFFFF" />
                                            </LinearGradient>
                                        </View>
                                        <View style={styles.revolutionaryCardStudentInfo}>
                                            <Text style={styles.revolutionaryCardStudentName}>{item.name}</Text>
                                            <View style={styles.revolutionaryCardBadge}>
                                                <Ionicons name="school" size={12} color="#FFFFFF" />
                                                <Text style={styles.revolutionaryCardBadgeText}>Student</Text>
                                            </View>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.revolutionaryCardAchievement}>
                                        <Ionicons name="trophy" size={16} color="#F97316" />
                                        <Text style={styles.revolutionaryCardAchievementText}>{item.achievement}</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.revolutionaryCarouselContent}
                    />
                </View>
            </View>

            {/* Job Competition Banner */}
            {/* <JobCompetitionBanner onPress={() => {
                // router.push('/job-competition');
            }} /> */}

            {/* Top Performers Section */}
            <TopPerformersSection onPress={() => {
                // router.push('/leaderboard'); // Example navigation
            }} />

            {/* Exam Notifications Section */}
            <ExamNotificationsSection />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    
    // Hero Section Styles - Enhanced
    heroSection: {
        paddingTop: 0,
        paddingBottom: 30,
        paddingHorizontal: 20,
        shadowColor: '#55dbdd',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
    },
    
    // Top Header with Side Navigation
    heroTopHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingTop: 60,
    },
    menuButton: {
        padding: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    heroUserInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    heroAvatarContainer: {
        marginRight: 12,
    },
    heroAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    heroAvatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroAvatarInitials: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    heroUserDetails: {
        flex: 1,
    },
    heroUserStatus: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
    },
    heroRightActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    heroActionButton: {
        padding: 12,
        marginLeft: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    heroWalletButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.3)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        marginLeft: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    heroWalletText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        marginLeft: 6,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    
    // Search Section
    heroSearchSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    heroSearchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    heroSearchPlaceholder: {
        fontSize: 16,
        color: '#999',
        marginLeft: 8,
    },
    heroFilterButton: {
        padding: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    
    // 4 Main Options
    heroOptionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
    },
    heroOption: {
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 5,
    },
    heroOptionIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.2)',
    },
    heroOptionText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
        letterSpacing: 0.5,
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 20,
        marginHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1F2937',
        letterSpacing: 0.3,
        textShadowColor: 'rgba(0, 0, 0, 0.08)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
        fontFamily: 'System',
        lineHeight: 20,
    },
    viewAllButton: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#DB2777',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    viewAllGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    viewAllText: {
        fontSize: 13,
        color: '#FFFFFF',
        fontWeight: '700',
        letterSpacing: 0.3,
        marginRight: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
        fontFamily: 'System',
        lineHeight: 16,
    },
    listContainer: {
        paddingHorizontal: 10,
        paddingBottom: 10,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 5,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
        backgroundColor: '#D1D5DB',
    },
    paginationDotActive: {
        backgroundColor: '#047857',
        width: 24,
    },
    quickStatsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#fff',
        margin: 20,
        marginTop: 10,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
        marginTop: 8,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: AppColors.grey,
        fontWeight: '600',
        textAlign: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    emptyCard: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: 10,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: AppColors.darkGrey,
        marginTop: 16,
        textAlign: 'center',
        letterSpacing: 0.3,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
        fontFamily: 'System',
        lineHeight: 24,
    },
    emptySubtext: {
        fontSize: 15,
        color: AppColors.grey,
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '500',
        letterSpacing: 0.2,
        fontFamily: 'System',
    },
    
    // Enhanced Live Exams Header Styles
    enhancedLiveExamsHeader: {
        marginHorizontal: 16,
        marginTop: 0,
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
    },
    enhancedHeaderGradient: {
        paddingVertical: 16,
        paddingHorizontal: 18,
    },
    enhancedHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    enhancedHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    enhancedIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    enhancedTextContainer: {
        flex: 1,
    },
    enhancedHeaderTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 2,
        letterSpacing: 0.4,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    enhancedHeaderSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    enhancedViewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    enhancedViewAllText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
        marginRight: 4,
        letterSpacing: 0.3,
    },
    
    // Revolutionary Stories that Inspire Section Styles
    revolutionaryStoriesSection: {
        marginHorizontal: 16,
        marginTop: 20,
        marginBottom: 20,
    },
    revolutionaryStoriesHeader: {
        borderRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 20,
        marginBottom: 20,
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 15,
    },
    revolutionaryHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    revolutionaryHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    revolutionaryIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    revolutionaryTextContainer: {
        flex: 1,
    },
    revolutionaryTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    revolutionaryTitleUnderlined: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
        textDecorationLine: 'underline',
        textDecorationColor: '#FFFFFF',
        textDecorationStyle: 'solid',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    revolutionaryStatsContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    revolutionaryStatsText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
    
    // Revolutionary Featured Story
    revolutionaryFeaturedStory: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
        borderWidth: 2,
        borderColor: 'rgba(249, 115, 22, 0.1)',
    },
    featuredStoryVideoSection: {
        marginBottom: 20,
        position: 'relative',
    },
    revolutionaryVideoThumbnail: {
        width: '100%',
        height: 180,
        backgroundColor: '#E5E7EB',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    videoOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    revolutionaryPlayButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#F97316',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    videoBadge: {
        position: 'absolute',
        top: 15,
        right: 15,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#F97316',
    },
    videoBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#F97316',
        marginLeft: 4,
    },
    revolutionaryStoryContent: {
        flex: 1,
    },
    revolutionaryQuoteSection: {
        marginBottom: 20,
    },
    revolutionaryQuoteIcon: {
        marginBottom: 15,
    },
    revolutionaryQuoteText: {
        fontSize: 18,
        color: '#1F2937',
        lineHeight: 28,
        fontStyle: 'italic',
        fontWeight: '500',
        letterSpacing: 0.3,
    },
    revolutionaryStudentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    revolutionaryStudentAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 15,
        overflow: 'hidden',
    },
    avatarGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    revolutionaryStudentDetails: {
        flex: 1,
    },
    revolutionaryStudentName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 6,
        letterSpacing: 0.3,
    },
    revolutionaryAchievementBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#F97316',
    },
    revolutionaryAchievementText: {
        fontSize: 14,
        color: '#F97316',
        fontWeight: '700',
        marginLeft: 6,
        letterSpacing: 0.2,
    },
    
    // Revolutionary Carousel
    revolutionaryCarouselContainer: {
        marginTop: 10,
    },
    carouselHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    carouselTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        letterSpacing: 0.3,
    },
    revolutionaryViewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F97316',
    },
    revolutionaryViewAllText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#F97316',
        marginRight: 4,
    },
    revolutionaryCarouselContent: {
        paddingRight: 20,
    },
    revolutionaryStoryCard: {
        width: 300,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginRight: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        position: 'relative',
        overflow: 'hidden',
    },
    firstCard: {
        borderColor: '#F97316',
        borderWidth: 2,
        shadowColor: '#F97316',
        shadowOpacity: 0.3,
    },
    secondCard: {
        borderColor: '#8B5CF6',
        borderWidth: 2,
        shadowColor: '#8B5CF6',
        shadowOpacity: 0.3,
    },
    thirdCard: {
        borderColor: '#10B981',
        borderWidth: 2,
        shadowColor: '#10B981',
        shadowOpacity: 0.3,
    },
    cardRankBadge: {
        position: 'absolute',
        top: 15,
        left: 15,
        backgroundColor: '#F97316',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        zIndex: 1,
    },
    cardRankText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
    revolutionaryCardContent: {
        padding: 20,
        paddingTop: 40,
    },
    revolutionaryCardTestimonial: {
        fontSize: 15,
        color: '#374151',
        lineHeight: 22,
        marginBottom: 20,
        fontStyle: 'italic',
        fontWeight: '500',
    },
    revolutionaryCardStudentSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    revolutionaryCardAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        overflow: 'hidden',
    },
    cardAvatarGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    revolutionaryCardStudentInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    revolutionaryCardStudentName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginRight: 8,
        letterSpacing: 0.2,
    },
    revolutionaryCardBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F97316',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    revolutionaryCardBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
        marginLeft: 4,
    },
    revolutionaryCardAchievement: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F97316',
    },
    revolutionaryCardAchievementText: {
        fontSize: 13,
        color: '#F97316',
        fontWeight: '700',
        marginLeft: 6,
        letterSpacing: 0.2,
    },
}); 
