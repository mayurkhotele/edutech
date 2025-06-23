import { apiFetchAuth } from '@/constants/api';
import { AppColors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const statusColors = {
    active: {
        border: '#7C3AED',
        badge: '#10B981',
        gradient: ['#a18cd1', '#fbc2eb'],
    },
    urgent: {
        border: '#F59E0B',
        badge: '#F59E0B',
        gradient: ['#f7971e', '#ffd200'],
    },
    expired: {
        border: '#EF4444',
        badge: '#EF4444',
        gradient: ['#f85032', '#e73827'],
    },
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
};

const getDaysRemaining = (lastDate: string) => {
    const today = new Date();
    const lastDateObj = new Date(lastDate);
    const diffTime = lastDateObj.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

export default function ExamNotificationsList() {
    const { user } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user?.token) { setLoading(false); return; }
            try {
                setLoading(true);
                const response = await apiFetchAuth('/student/exam-notifications', user.token);
                if (response.ok) setNotifications(response.data);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, [user]);
    const renderCard = ({ item }: { item: any }) => {
        const daysRemaining = getDaysRemaining(item.applyLastDate);
        const isUrgent = daysRemaining <= 7 && daysRemaining >= 0;
        const isExpired = daysRemaining < 0;
        const status = isExpired ? 'expired' : isUrgent ? 'urgent' : 'active';
        const color = statusColors[status];
        return (
            <TouchableOpacity
                style={styles.cardTouchable}
                onPress={() => router.push(`/exam-notification/${item.id}`)}
                activeOpacity={0.92}
            >
                <BlurView intensity={60} tint="light" style={[styles.card, { borderLeftColor: color.border }]}> 
                    <LinearGradient
                        colors={color.gradient as [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.statusFloatingBadge}
                    >
                        <Ionicons name="checkmark-done" size={13} color="#fff" />
                        <Text style={styles.statusFloatingText}>{status === 'active' ? 'Active' : status === 'urgent' ? 'Urgent' : 'Expired'}</Text>
                    </LinearGradient>
                    <View style={styles.cardContent}>
                        <View style={styles.logoWrap}>
                            {item.logoUrl ? (
                                <Image source={{ uri: item.logoUrl }} style={styles.logo} />
                            ) : (
                                <LinearGradient colors={["#a18cd1", "#fbc2eb"] as [string, string]} style={styles.logo}>
                                    <Ionicons name="school-outline" size={20} color="#fff" />
                                </LinearGradient>
                            )}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                            <View style={styles.cardRow}>
                                <Ionicons name="calendar-outline" size={15} color={color.border} style={{ marginRight: 4 }} />
                                <Text style={styles.cardDate}>{formatDate(item.applyLastDate)}</Text>
                            </View>
                            {!isExpired && (
                                <Text style={[styles.daysText, isUrgent && styles.urgentDaysText]}>
                                    {daysRemaining === 0 ? 'Last Day!' : daysRemaining === 1 ? '1 day left' : `${daysRemaining} days left`}
                                </Text>
                            )}
                        </View>
                    </View>
                    <LinearGradient
                        colors={["#7C3AED", "#a18cd1"] as [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.viewDetailsButton}
                    >
                        <Text style={styles.viewDetailsText}>View Details</Text>
                        <Ionicons name="chevron-forward" size={14} color="#fff" />
                    </LinearGradient>
                </BlurView>
            </TouchableOpacity>
        );
    };
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={["#a18cd1", "#fbc2eb"] as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerText}>All Exam Notifications</Text>
                    <View style={{ width: 32 }} />
                </View>
            </LinearGradient>
            {loading ? (
                <ActivityIndicator size="large" color={AppColors.primary} style={{ marginTop: 30 }} />
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderCard}
                    keyExtractor={item => item.id}
                    numColumns={2}
                    columnWrapperStyle={styles.gridRow}
                    contentContainerStyle={{ paddingBottom: 10 }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 18,
        marginHorizontal: 0,
        paddingBottom: 10,
    },
    headerGradient: {
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 0.5,
    },
    backButton: {
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: 8,
        padding: 6,
        marginRight: 8,
    },
    gridRow: {
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingHorizontal: 6,
    },
    cardTouchable: {
        flex: 1,
        marginHorizontal: 6,
        marginBottom: 8,
        minHeight: 140,
    },
    card: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: 16,
        padding: 16,
        borderLeftWidth: 5,
        elevation: 4,
        shadowColor: '#a18cd1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 8,
        overflow: 'visible',
    },
    statusFloatingBadge: {
        position: 'absolute',
        top: -14,
        right: 14,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12,
        zIndex: 2,
        shadowColor: '#a18cd1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 6,
    },
    statusFloatingText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 11,
        marginLeft: 5,
        letterSpacing: 0.5,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        marginTop: 6,
    },
    logoWrap: {
        width: 38,
        height: 38,
        borderRadius: 19,
        marginRight: 12,
        overflow: 'hidden',
        backgroundColor: '#ede9fe',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#3b0764',
        marginBottom: 2,
        letterSpacing: 0.2,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    cardDate: {
        marginLeft: 4,
        color: '#7C3AED',
        fontSize: 13,
        fontWeight: '600',
    },
    daysText: {
        fontSize: 12,
        color: '#64748B',
        fontStyle: 'italic',
        marginTop: 2,
    },
    urgentDaysText: {
        color: '#F59E0B',
        fontWeight: 'bold',
    },
    viewDetailsButton: {
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-end',
        backgroundColor: 'transparent',
        borderRadius: 8,
        paddingVertical: 7,
        paddingHorizontal: 16,
        shadowColor: '#a18cd1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 6,
    },
    viewDetailsText: {
        fontSize: 13,
        color: '#fff',
        fontWeight: 'bold',
        marginRight: 5,
        letterSpacing: 0.2,
    },
}); 