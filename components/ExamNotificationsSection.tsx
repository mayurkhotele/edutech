import { apiFetchAuth } from '@/constants/api';
import { AppColors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

interface ExamNotification {
    id: string;
    title: string;
    description: string;
    year: number;
    month: number;
    applyLastDate: string;
    applyLink: string;
    createdAt: string;
    updatedAt: string;
    logoUrl?: string; // Optional, for future use
}

const getMonthYear = (notifications: ExamNotification[]) => {
    if (!notifications.length) return '';
    const month = notifications[0].month;
    const year = notifications[0].year;
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[month - 1]} ${year}`;
};

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

const ExamNotificationsSection = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<ExamNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedNotification, setSelectedNotification] = useState<ExamNotification | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user?.token) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const response = await apiFetchAuth('/student/exam-notifications', user.token);
                if (response.ok) {
                    setNotifications(response.data);
                    setError(null);
                } else {
                    setError(response.data.message || 'Failed to fetch notifications');
                }
            } catch (err: any) {
                setError('Failed to fetch exam notifications');
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, [user]);

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

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={AppColors.primary} />
            </View>
        );
    }
    if (error || notifications.length === 0) {
        return null;
    }

    // Show only first 4 notifications
    const displayNotifications = notifications.slice(0, 4);
    const monthYear = getMonthYear(notifications);
    const examCount = notifications.length;

    const renderCard = ({ item }: { item: ExamNotification }) => {
        const daysRemaining = getDaysRemaining(item.applyLastDate);
        const isUrgent = daysRemaining <= 7 && daysRemaining >= 0;
        const isExpired = daysRemaining < 0;
        const status = isExpired ? 'expired' : isUrgent ? 'urgent' : 'active';
        const color = statusColors[status];
        return (
            <TouchableOpacity
                style={styles.cardTouchable}
                onPress={() => {
                    setSelectedNotification(item);
                    setModalVisible(true);
                }}
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
                    <Ionicons name="notifications" size={22} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.headerText}>{monthYear}</Text>
                    <BlurView intensity={40} tint="light" style={styles.headerBadgeGlass}>
                        <Text style={styles.headerBadgeText}>{examCount} EXAMS</Text>
                    </BlurView>
                </View>
            </LinearGradient>
            <FlatList
                data={displayNotifications}
                renderItem={renderCard}
                keyExtractor={item => item.id}
                numColumns={2}
                columnWrapperStyle={styles.gridRow}
                contentContainerStyle={{ paddingBottom: 10 }}
                scrollEnabled={false}
            />
            <TouchableOpacity
                style={styles.viewAllButtonWrap}
                activeOpacity={0.92}
            >
                <LinearGradient
                    colors={["#7C3AED", "#a18cd1"] as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.viewAllButton}
                >
                    <Text style={styles.viewAllButtonText}>View All</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 4 }} />
                </LinearGradient>
            </TouchableOpacity>
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCardWrap}>
                        <LinearGradient
                            colors={["#a18cd1", "#fbc2eb"] as [string, string]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.modalHeaderGradient}
                        >
                            <View style={styles.modalHeaderRow}>
                                <Text style={styles.modalHeaderTitle}>Exam Details</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                                    <Ionicons name="close" size={22} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                        <BlurView intensity={80} tint="light" style={styles.modalContentGlass}>
                            {selectedNotification && (
                                <>
                                    <Text style={styles.modalExamTitle}>{selectedNotification.title}</Text>
                                    <View style={styles.modalStatusRow}>
                                        <LinearGradient
                                            colors={statusColors[getDaysRemaining(selectedNotification.applyLastDate) < 0 ? 'expired' : getDaysRemaining(selectedNotification.applyLastDate) <= 7 ? 'urgent' : 'active'].gradient as [string, string]}
                                            style={styles.modalStatusBadge}
                                        >
                                            <Text style={styles.modalStatusText}>
                                                {getDaysRemaining(selectedNotification.applyLastDate) < 0 ? 'Expired' :
                                                getDaysRemaining(selectedNotification.applyLastDate) <= 7 ? 'Urgent' : 'Active'}
                                            </Text>
                                        </LinearGradient>
                                        <View style={styles.modalDateBox}>
                                            <Ionicons name="calendar-outline" size={16} color="#7C3AED" style={{ marginRight: 4 }} />
                                            <Text style={styles.modalDateText}>
                                                Last Date: {formatDate(selectedNotification.applyLastDate)}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.modalDivider} />
                                    <View style={styles.modalDescriptionBox}>
                                        <ScrollView style={{ maxHeight: 120 }}>
                                            <Text style={styles.modalDescription}>{selectedNotification.description}</Text>
                                        </ScrollView>
                                    </View>
                                    {getDaysRemaining(selectedNotification.applyLastDate) >= 0 && (
                                        <LinearGradient
                                            colors={["#7C3AED", "#a18cd1"] as [string, string]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.modalApplyButton}
                                        >
                                            <TouchableOpacity
                                                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' }}
                                                onPress={() => selectedNotification.applyLink && Linking.openURL(selectedNotification.applyLink)}
                                            >
                                                <Ionicons name="open-outline" size={20} color={AppColors.white} />
                                                <Text style={styles.modalApplyButtonText}>
                                                    {getDaysRemaining(selectedNotification.applyLastDate) <= 7 ? 'Apply Now!' : 'Apply'}
                                                </Text>
                                            </TouchableOpacity>
                                        </LinearGradient>
                                    )}
                                </>
                            )}
                        </BlurView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 18,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 18,
        marginHorizontal: 8,
        elevation: 3,
        shadowColor: '#a18cd1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
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
    headerBadgeGlass: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 4,
        overflow: 'hidden',
    },
    headerBadgeText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
        letterSpacing: 0.5,
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
    viewAllButtonWrap: {
        alignItems: 'flex-end',
        marginRight: 18,
        marginTop: 2,
        marginBottom: 8,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 22,
        shadowColor: '#a18cd1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.13,
        shadowRadius: 8,
    },
    viewAllButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
        letterSpacing: 0.2,
    },
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCardWrap: {
        width: '92%',
        alignSelf: 'center',
        borderRadius: 22,
        overflow: 'hidden',
        backgroundColor: 'transparent',
        shadowColor: '#a18cd1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
        elevation: 8,
    },
    modalHeaderGradient: {
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    modalHeaderRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    modalHeaderTitle: {
        fontSize: 19,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 0.5,
        textAlign: 'center',
        flex: 1,
    },
    modalCloseBtn: {
        backgroundColor: 'rgba(124,58,237,0.18)',
        borderRadius: 20,
        padding: 7,
        marginLeft: 10,
    },
    modalContentGlass: {
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderBottomLeftRadius: 22,
        borderBottomRightRadius: 22,
        padding: 22,
        width: '100%',
        alignSelf: 'center',
    },
    modalExamTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#3b0764',
        marginBottom: 16,
        textAlign: 'center',
        letterSpacing: 0.2,
    },
    modalStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    modalStatusBadge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
    },
    modalStatusText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
        letterSpacing: 0.5,
    },
    modalDateBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ede9fe',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    modalDateText: {
        color: '#7C3AED',
        fontSize: 13,
        fontWeight: '600',
    },
    modalDivider: {
        height: 1,
        backgroundColor: '#ede9fe',
        marginVertical: 16,
        borderRadius: 1,
    },
    modalDescriptionBox: {
        backgroundColor: 'rgba(243,244,246,0.7)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 18,
    },
    modalDescription: {
        color: '#3b0764',
        fontSize: 15,
        lineHeight: 22,
    },
    modalApplyButton: {
        marginTop: 8,
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#a18cd1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
    },
    modalApplyButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 10,
        letterSpacing: 0.2,
    },
});

export default ExamNotificationsSection; 