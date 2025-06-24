import { AppColors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ExamCard = ({ exam, navigation }: any) => {
    const router = useRouter();
    const [remainingTime, setRemainingTime] = useState('');

    useEffect(() => {
        const calculateRemainingTime = () => {
            const now = new Date();
            const startTime = new Date(exam.startTime);
            const diff = startTime.getTime() - now.getTime();

            if (diff <= 0) {
                setRemainingTime('00:00:00');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            setRemainingTime(
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
            );
        };

        const timer = setInterval(calculateRemainingTime, 1000);
        calculateRemainingTime(); // Initial call
        return () => clearInterval(timer);
    }, [exam.startTime]);

    const progress = exam.spots > 0 ? ((exam.spots - exam.spotsLeft) / exam.spots) * 100 : 0;

    const handleCardPress = () => {
        router.push({
            pathname: "/exam/[id]",
            params: { id: exam.id }
        });
    };

    return (
        <TouchableOpacity style={styles.card} onPress={handleCardPress} activeOpacity={0.8}>
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={1}>{exam.title}</Text>
                    <Text style={styles.subtitle} numberOfLines={1}>Daily GK & Current Affairs • GK • 5Qs</Text>
                </View>
                <Image source={require('../assets/images/trophy.jpg')} style={styles.trophyIcon} />
            </View>

            <View style={styles.spotsContainer}>
                <View style={styles.spotsTextContainer}>
                    <Text style={styles.spotsLeft}>{exam.spotsLeft} Spots left</Text>
                    <Text style={styles.totalSpots}>{exam.spots} Spots</Text>
                </View>
                <View style={styles.progressBar}>
                    <View style={[styles.progress, { width: `${progress}%` }]} />
                </View>
            </View>

            <View style={styles.detailsContainer}>
                <View style={styles.tags}>
                    <View style={styles.tag}>
                        <Ionicons name="gift-outline" size={16} color="#E67E22" />
                        <Text style={styles.tagText}>{exam.entryFee}</Text>
                    </View>
                    <View style={styles.tag}>
                        <Ionicons name="trophy-outline" size={16} color="#9B59B6" />
                        <Text style={styles.tagText}>50%</Text>
                    </View>
                </View>
                <Text style={styles.remainingTime}>Remaining time: {remainingTime}</Text>
            </View>

            <View style={styles.footer}>
                <View>
                    <Text style={styles.prizePoolText}>Prize pool of up to</Text>
                    <Text style={styles.prizePoolAmount}>₹{exam.prizePool.toFixed(2)}*</Text>
                </View>
                <TouchableOpacity style={styles.attemptButton}>
                    <Text style={styles.attemptButtonText}>Attempt</Text>
                    <View style={styles.attemptFeeContainer}>
                        <Text style={styles.attemptButtonFee}>₹{exam.entryFee}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: AppColors.white,
        borderRadius: 15,
        padding: 15,
        marginVertical: 10,
        marginHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: AppColors.darkGrey,
    },
    subtitle: {
        fontSize: 12,
        color: AppColors.grey,
        marginTop: 4,
    },
    trophyIcon: {
        width: 50,
        height: 50,
        marginLeft: 10,
    },
    spotsContainer: {
        marginTop: 15,
    },
     progressBar: {
        height: 8,
        backgroundColor: '#EAEAEA',
        borderRadius: 4,
        overflow: 'hidden',
        marginTop: 5,
    },
    progress: {
        height: '100%',
        backgroundColor: '#5DADE2',
    },
    spotsTextContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    spotsLeft: {
        color: '#E67E22',
        fontWeight: 'bold',
        fontSize: 12,
    },
    totalSpots: {
        color: AppColors.grey,
        fontSize: 12,
    },
    detailsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.lightGrey,
    },
    tags: {
        flexDirection: 'row',
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15,
    },
    tagText: {
        marginLeft: 4,
        color: AppColors.darkGrey,
        fontSize: 12,
    },
    remainingTime: {
        color: '#E74C3C',
        fontSize: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 15,
    },
    prizePoolText: {
        color: AppColors.grey,
        fontSize: 12,
    },
    prizePoolAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: AppColors.primary,
    },
    attemptButton: {
        backgroundColor: '#6C3483',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingLeft: 20,
        paddingRight: 10,
        borderRadius: 8,
    },
    attemptButtonText: {
        color: AppColors.white,
        fontWeight: 'bold',
        fontSize: 16,
        marginRight: 10,
    },
    attemptFeeContainer: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 5,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    attemptButtonFee: {
        color: AppColors.white,
        fontWeight: 'bold',
        fontSize: 12,
    },
});

export default ExamCard; 