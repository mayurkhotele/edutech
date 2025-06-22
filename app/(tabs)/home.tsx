import { apiFetchAuth } from '@/constants/api';
import { AppColors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ExamCard from '../../components/ExamCard';

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
    
    // Refs for sliders
    const examSliderRef = useRef<FlatList<any>>(null);
    const bannerSliderRef = useRef<FlatList<any>>(null);

    // Data for sliders
    const featuredExams = exams.slice(0, 5);

    // Fetch Exams Effect
    useEffect(() => {
        const fetchExams = async () => {
            if (!user?.token) { setLoading(false); return; }
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
        <ScrollView style={styles.container}>
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
        width: screenWidth,
        height: 60,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 20,
        paddingBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
    },
    viewAll: {
        fontSize: 14,
        color: AppColors.primary,
        fontWeight: 'bold',
    },
    listContainer: {
        paddingHorizontal: 15,
    },
}); 