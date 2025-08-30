import { apiFetchAuth } from '@/constants/api';
import { AppColors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AdvertisementBanner from '../../components/AdvertisementBanner';
import ExamCard from '../../components/ExamCard';
import ExamNotificationsSection from '../../components/ExamNotificationsSection';
import JobCompetitionBanner from '../../components/JobCompetitionBanner';
import PracticeExamSection from '../../components/PracticeExamSection';
import QuestionOfTheDayPreview from '../../components/QuestionOfTheDayPreview';
import TopPerformersSection from '../../components/TopPerformersSection';

const { width: screenWidth } = Dimensions.get('window');



export default function HomeScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const navigation = useNavigation();
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Refs for sliders and components
    const examSliderRef = useRef<FlatList<any>>(null);
    const practiceExamRef = useRef<any>(null);

    // Data for sliders
    const featuredExams = exams.slice(0, 5);

    // Fetch Exams Function
    const fetchExams = async () => {
        if (!user?.token) { 
            setLoading(false); 
            return; 
        }
        try {
            setLoading(true);
            const response = await apiFetchAuth('/student/exams', user.token);
            if (response.ok) setExams(response.data);
        } catch (error) {
            console.error('Error fetching exams:', error);
        } finally {
            setLoading(false);
        }
    };

    // Refresh Function - Now refreshes all sections
    const onRefresh = async () => {
        setRefreshing(true);
        
        // Refresh all sections in parallel
        await Promise.all([
            fetchExams(),
            // Trigger practice exam refresh if ref exists
            practiceExamRef.current?.handleRefresh?.()
        ]);
        
        setRefreshing(false);
    };

    // Fetch Exams Effect
    useEffect(() => {
        fetchExams();
    }, [user]);

    // Auto-refresh every 30 seconds when screen is active
    useEffect(() => {
        const interval = setInterval(() => {
            if (user?.token) {
                console.log('🔄 Auto-refreshing Home data');
                fetchExams();
            }
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [user?.token]);
    


    const renderExamCard = ({ item }: { item: any }) => (
        <View style={{ width: screenWidth - 30 }}>
            <ExamCard exam={item} navigation={router} />
        </View>
    );
    


    return (
        <>
            <ScrollView 
                style={styles.container}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[AppColors.primary]}
                        tintColor={AppColors.primary}
                        title="Pull to refresh"
                        titleColor={AppColors.primary}
                    />
                }
            >


            {/* Featured Exams Section */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Featured Exams</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/exam')}>
                    <Text style={styles.viewAll}>View All</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={AppColors.primary} style={{ marginTop: 20 }} />
            ) : featuredExams.length === 0 ? (
                <View style={styles.emptyCard}>
                    <View style={styles.emptyContainer}>
                        <Ionicons name="library-outline" size={48} color={AppColors.grey} />
                        <Text style={styles.emptyTitle}>No Exams Available Right Now</Text>
                        <Text style={styles.emptySubtext}>Check back later for new featured exams.</Text>
                    </View>
                </View>
            ) : (
                <FlatList
                    ref={examSliderRef}
                    data={featuredExams}
                    renderItem={renderExamCard}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.listContainer}
                />
            )}
            
            {/* Question of the Day Section */}
            <QuestionOfTheDayPreview />

            {/* Job Competition Banner */}
            <JobCompetitionBanner onPress={() => {
                console.log('Navigate to job competition');
                // router.push('/job-competition');
            }} />

            {/* Top Performers Section */}
            <TopPerformersSection onPress={() => {
                console.log('Navigate to leaderboard');
                // router.push('/leaderboard'); // Example navigation
            }} />

            {/* Premium Advertisement Banner */}
            <AdvertisementBanner onPress={() => {
                // You can navigate to premium page or open a link
                console.log('Navigate to premium features');
                // router.push('/premium'); // Example navigation
            }} />

            {/* Practice Exam Section */}
            <PracticeExamSection ref={practiceExamRef} />

            {/* Exam Notifications Section */}
            <ExamNotificationsSection />
        </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.lightGrey,
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 20,
        marginHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
    },
    viewAll: {
        fontSize: 14,
        color: AppColors.primary,
        fontWeight: '600',
    },
    listContainer: {
        paddingHorizontal: 15,
        paddingBottom: 10,
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
        fontSize: 18,
        fontWeight: '600',
        color: AppColors.darkGrey,
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: AppColors.grey,
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 20,
    },
}); 