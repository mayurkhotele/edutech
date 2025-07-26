import { apiFetchAuth } from '@/constants/api';
import { AppColors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ExamCard from '../../components/ExamCard';
import ExamNotificationsSection from '../../components/ExamNotificationsSection';
import PracticeExamSection from '../../components/PracticeExamSection';
import QuestionOfTheDayPreview from '../../components/QuestionOfTheDayPreview';

const { width: screenWidth } = Dimensions.get('window');

const bannerImages = [
    require('../../assets/images/banner1.jpg'),
    require('../../assets/images/banner2.jpg'),
    require('../../assets/images/banner3.jpg'),
];

export default function HomeScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Refs for sliders and components
    const examSliderRef = useRef<FlatList<any>>(null);
    const bannerSliderRef = useRef<FlatList<any>>(null);
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

    // Exam Auto-scrolling Effect
    useEffect(() => {
        if (featuredExams.length > 0) {
            const timer = setInterval(() => {
                const nextIndex = Math.floor(Math.random() * featuredExams.length);
                examSliderRef.current?.scrollToIndex({ index: nextIndex, animated: true });
            }, 5000);
            return () => clearInterval(timer);
        }
    }, [featuredExams.length]);
    
    // Banner Auto-scrolling Effect
    useEffect(() => {
        let bannerIndex = 0;
        const timer = setInterval(() => {
            bannerIndex = (bannerIndex + 1) % bannerImages.length;
            bannerSliderRef.current?.scrollToIndex({ index: bannerIndex, animated: true });
        }, 10000); // 10 seconds
        return () => clearInterval(timer);
    }, []);

    const renderExamCard = ({ item }: { item: any }) => (
        <View style={{ width: screenWidth - 30 }}>
            <ExamCard exam={item} navigation={router} />
        </View>
    );
    
    const renderBanner = ({ item }: { item: any }) => (
        <Image source={item} style={styles.bannerImage} resizeMode="cover" />
    );

    return (
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
                <TouchableOpacity onPress={() => router.push('/all-exams')}>
                    <Text style={styles.viewAll}>View All</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={AppColors.primary} style={{ marginTop: 20 }} />
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
            
            {/* Advertisement Banner Section */}
            <View style={styles.bannerContainer}>
                 <FlatList
                    ref={bannerSliderRef}
                    data={bannerImages}
                    renderItem={renderBanner}
                    keyExtractor={(_, index) => index.toString()}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                />
            </View>

            {/* Question of the Day Section */}
            <QuestionOfTheDayPreview />

            {/* Practice Exam Section */}
            <PracticeExamSection ref={practiceExamRef} />
            <View style={styles.bannerContainer}>
                 <FlatList
                    ref={bannerSliderRef}
                    data={bannerImages}
                    renderItem={renderBanner}
                    keyExtractor={(_, index) => index.toString()}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                />
            </View>
            {/* Exam Notifications Section */}
            <ExamNotificationsSection />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.lightGrey,
    },
    bannerContainer: {
        height: 60,
        marginTop: 20,
    },
    bannerImage: {
        width: screenWidth - 40,
        height: 60,
        borderRadius: 12,
        marginHorizontal: 10,
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
}); 