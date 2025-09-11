import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, Linking, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

const statusColors = {
    active: {
        border: '#10B981',
        badge: '#10B981',
        gradient: ['#10B981', '#059669'],
    },
    urgent: {
        border: '#F59E0B',
        badge: '#F59E0B',
        gradient: ['#F59E0B', '#D97706'],
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
    const [filteredNotifications, setFilteredNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all'); // all, active, urgent, expired
    const [selectedNotification, setSelectedNotification] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const fetchNotifications = async () => {
        if (!user?.token) { setLoading(false); return; }
        try {
            setLoading(true);
            const response = await apiFetchAuth('/student/exam-notifications', user.token);
            if (response.ok) {
                setNotifications(response.data);
                setFilteredNotifications(response.data);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [user]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchNotifications();
        setRefreshing(false);
    };

    const filterNotifications = (query: string, filter: string) => {
        let filtered = notifications;

        // Apply search filter
        if (query) {
            filtered = filtered.filter(item => 
                item.title.toLowerCase().includes(query.toLowerCase()) ||
                item.description.toLowerCase().includes(query.toLowerCase())
            );
        }

        // Apply status filter
        if (filter !== 'all') {
            filtered = filtered.filter(item => {
                const daysRemaining = getDaysRemaining(item.applyLastDate);
                const isUrgent = daysRemaining <= 7 && daysRemaining >= 0;
                const isExpired = daysRemaining < 0;
                
                switch (filter) {
                    case 'active': return !isUrgent && !isExpired;
                    case 'urgent': return isUrgent;
                    case 'expired': return isExpired;
                    default: return true;
                }
            });
        }

        setFilteredNotifications(filtered);
    };

    useEffect(() => {
        filterNotifications(searchQuery, selectedFilter);
    }, [searchQuery, selectedFilter, notifications]);

    const openNotificationModal = (notification: any) => {
        setSelectedNotification(notification);
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setSelectedNotification(null);
    };
    const renderCard = ({ item }: { item: any }) => {
        const daysRemaining = getDaysRemaining(item.applyLastDate);
        const isUrgent = daysRemaining <= 7 && daysRemaining >= 0;
        const isExpired = daysRemaining < 0;
        const status = isExpired ? 'expired' : isUrgent ? 'urgent' : 'active';
        const color = statusColors[status];
        
        return (
            <TouchableOpacity
                style={styles.cardTouchable}
                onPress={() => openNotificationModal(item)}
                activeOpacity={0.85}
            >
                <View style={[styles.card, { borderLeftColor: color.border }]}>
                    {/* Status Badge */}
                    <LinearGradient
                        colors={color.gradient as [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.statusBadge}
                    >
                        <Ionicons 
                            name={status === 'active' ? 'checkmark-circle' : status === 'urgent' ? 'warning' : 'close-circle'} 
                            size={14} 
                            color="#fff" 
                        />
                        <Text style={styles.statusText}>
                            {status === 'active' ? 'Active' : status === 'urgent' ? 'Urgent' : 'Expired'}
                        </Text>
                    </LinearGradient>

                    {/* Card Content */}
                    <View style={styles.cardContent}>
                        <View style={styles.logoContainer}>
                            {item.logoUrl ? (
                                <Image source={{ uri: item.logoUrl }} style={styles.logo} />
                            ) : (
                                <LinearGradient colors={["#4F46E5", "#7C3AED"] as [string, string]} style={styles.logo}>
                                    <Ionicons name="school-outline" size={24} color="#fff" />
                                </LinearGradient>
                            )}
                        </View>
                        
                        <View style={styles.cardInfo}>
                            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                            
                            <View style={styles.dateContainer}>
                                <Ionicons name="calendar-outline" size={16} color={color.border} />
                                <Text style={styles.cardDate}>{formatDate(item.applyLastDate)}</Text>
                            </View>
                            
                            {!isExpired && (
                                <View style={styles.daysContainer}>
                                    <Ionicons 
                                        name={isUrgent ? 'time' : 'clock-outline'} 
                                        size={14} 
                                        color={isUrgent ? '#F59E0B' : '#64748B'} 
                                    />
                                    <Text style={[styles.daysText, isUrgent && styles.urgentDaysText]}>
                                        {daysRemaining === 0 ? 'Last Day!' : daysRemaining === 1 ? '1 day left' : `${daysRemaining} days left`}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity style={styles.actionButton}>
                        <LinearGradient
                            colors={["#4F46E5", "#7C3AED"] as [string, string]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.actionButtonGradient}
                        >
                            <Text style={styles.actionButtonText}>View Details</Text>
                            <Ionicons name="arrow-forward" size={16} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };
    return (
        <>
            <Stack.Screen 
                options={{
                    title: '',
                    headerShown: true,
                    headerTransparent: true,
                    headerStyle: {
                        backgroundColor: 'transparent',
                    },
                    headerTintColor: 'transparent',
                }}
            />
            <View style={styles.container}>
                {/* Enhanced Header */}
                <LinearGradient
                colors={["#4F46E5", "#7C3AED", "#8B5CF6"] as [string, string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerText}>Exam Notifications</Text>
                        <Text style={styles.headerSubtext}>{filteredNotifications.length} notifications found</Text>
                    </View>
                    <View style={{ width: 32 }} />
                </View>
            </LinearGradient>

            {/* Search and Filter Section */}
            <View style={styles.searchSection}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search notifications..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                            <Ionicons name="close-circle" size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Filter Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
                    {[
                        { key: 'all', label: 'All', icon: 'apps' },
                        { key: 'active', label: 'Active', icon: 'checkmark-circle' },
                        { key: 'urgent', label: 'Urgent', icon: 'warning' },
                        { key: 'expired', label: 'Expired', icon: 'close-circle' }
                    ].map((filter) => (
                        <TouchableOpacity
                            key={filter.key}
                            style={[
                                styles.filterChip,
                                selectedFilter === filter.key && styles.filterChipActive
                            ]}
                            onPress={() => setSelectedFilter(filter.key)}
                        >
                            <Ionicons 
                                name={filter.icon as any} 
                                size={16} 
                                color={selectedFilter === filter.key ? '#fff' : '#64748B'} 
                            />
                            <Text style={[
                                styles.filterChipText,
                                selectedFilter === filter.key && styles.filterChipTextActive
                            ]}>
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                    <Text style={styles.loadingText}>Loading notifications...</Text>
                </View>
            ) : filteredNotifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="notifications-off" size={64} color="#94A3B8" />
                    <Text style={styles.emptyTitle}>No Notifications Found</Text>
                    <Text style={styles.emptySubtext}>
                        {searchQuery ? 'Try adjusting your search terms' : 'No exam notifications available'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredNotifications}
                    renderItem={renderCard}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#4F46E5']}
                            tintColor="#4F46E5"
                        />
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}
            </View>

            {/* Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeModal}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity 
                        style={styles.modalBackdrop} 
                        activeOpacity={1} 
                        onPress={closeModal}
                    />
                    <View style={styles.modalContainer}>
                        {selectedNotification && (
                            <>
                                {/* Modal Header */}
                                <LinearGradient
                                    colors={["#4F46E5", "#7C3AED", "#8B5CF6"] as [string, string, string]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.modalHeader}
                                >
                                    <View style={styles.modalHeaderContent}>
                                        <View style={styles.modalIconContainer}>
                                            <Ionicons name="document-text" size={24} color="#FFFFFF" />
                                        </View>
                                        <Text style={styles.modalHeaderTitle}>Exam Details</Text>
                                        <TouchableOpacity onPress={closeModal} style={styles.modalCloseBtn}>
                                            <Ionicons name="close-circle" size={28} color="rgba(255, 255, 255, 0.9)" />
                                        </TouchableOpacity>
                                    </View>
                                </LinearGradient>
                                
                                {/* Modal Content */}
                                <View style={styles.modalContent}>
                                    {/* Title Section */}
                                    <View style={styles.modalTitleSection}>
                                        <Text style={styles.modalExamTitle}>{selectedNotification.title}</Text>
                                    </View>
                                    
                                    {/* Status and Date Row */}
                                    <View style={styles.modalStatusRow}>
                                        <LinearGradient
                                            colors={statusColors[getDaysRemaining(selectedNotification.applyLastDate) < 0 ? 'expired' : getDaysRemaining(selectedNotification.applyLastDate) <= 7 ? 'urgent' : 'active'].gradient as [string, string]}
                                            style={styles.modalStatusBadge}
                                        >
                                            <Ionicons 
                                                name={getDaysRemaining(selectedNotification.applyLastDate) < 0 ? 'close-circle' : 
                                                     getDaysRemaining(selectedNotification.applyLastDate) <= 7 ? 'warning' : 'checkmark-circle'} 
                                                size={16} 
                                                color="#FFFFFF" 
                                                style={{ marginRight: 6 }} 
                                            />
                                            <Text style={styles.modalStatusText}>
                                                {getDaysRemaining(selectedNotification.applyLastDate) < 0 ? 'Expired' :
                                                getDaysRemaining(selectedNotification.applyLastDate) <= 7 ? 'Urgent' : 'Active'}
                                            </Text>
                                        </LinearGradient>
                                        
                                        <View style={styles.modalDateBox}>
                                            <LinearGradient
                                                colors={['rgba(139, 92, 246, 0.1)', 'rgba(124, 58, 237, 0.05)']}
                                                style={styles.modalDateGradient}
                                            >
                                                <Ionicons name="calendar" size={18} color="#8B5CF6" />
                                                <Text style={styles.modalDateText}>
                                                    {formatDate(selectedNotification.applyLastDate)}
                                                </Text>
                                            </LinearGradient>
                                        </View>
                                    </View>
                                    
                                    {/* Description Section */}
                                    <View style={styles.modalDescriptionSection}>
                                        <View style={styles.modalDescriptionHeader}>
                                            <Ionicons name="information-circle" size={20} color="#8B5CF6" />
                                            <Text style={styles.modalDescriptionLabel}>Description</Text>
                                        </View>
                                        <ScrollView style={styles.modalDescriptionScroll} showsVerticalScrollIndicator={false}>
                                            <Text style={styles.modalDescriptionText}>{selectedNotification.description}</Text>
                                        </ScrollView>
                                    </View>
                                    
                                    {/* Apply Button */}
                                    {getDaysRemaining(selectedNotification.applyLastDate) >= 0 && (
                                        <TouchableOpacity
                                            style={styles.modalApplyButtonContainer}
                                            onPress={() => selectedNotification.applyLink && Linking.openURL(selectedNotification.applyLink)}
                                            activeOpacity={0.8}
                                        >
                                            <LinearGradient
                                                colors={['#10B981', '#059669', '#047857']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={styles.modalApplyButton}
                                            >
                                                <Ionicons name="rocket" size={22} color="#FFFFFF" />
                                                <Text style={styles.modalApplyButtonText}>
                                                    {getDaysRemaining(selectedNotification.applyLastDate) <= 7 ? 'Apply Now!' : 'Apply Online'}
                                                </Text>
                                                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    headerGradient: {
        paddingTop: 100,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        padding: 12,
        marginRight: 16,
    },
    headerTextContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    headerSubtext: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
        fontWeight: '500',
    },
    refreshButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        padding: 12,
        marginLeft: 16,
    },
    searchSection: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1E293B',
        fontWeight: '500',
    },
    clearButton: {
        marginLeft: 8,
    },
    filterContainer: {
        marginTop: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    filterChipActive: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5',
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        marginLeft: 6,
    },
    filterChipTextActive: {
        color: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        fontSize: 16,
        color: '#64748B',
        marginTop: 16,
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#374151',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 16,
        color: '#64748B',
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 24,
    },
    listContainer: {
        padding: 16,
        paddingBottom: 30,
    },
    cardTouchable: {
        marginBottom: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        minHeight: 120,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 16,
    },
    statusText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
        marginLeft: 6,
        letterSpacing: 0.5,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    logoContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 16,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardInfo: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 6,
        lineHeight: 24,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    cardDate: {
        marginLeft: 8,
        color: '#64748B',
        fontSize: 14,
        fontWeight: '600',
    },
    daysContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    daysText: {
        fontSize: 13,
        color: '#64748B',
        marginLeft: 6,
        fontWeight: '500',
    },
    urgentDaysText: {
        color: '#F59E0B',
        fontWeight: '700',
    },
    actionButton: {
        position: 'absolute',
        right: 16,
        bottom: 16,
    },
    actionButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    actionButtonText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '600',
        marginRight: 4,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalContainer: {
        width: '90%',
        maxWidth: 400,
        alignSelf: 'center',
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.3,
        shadowRadius: 25,
        elevation: 15,
    },
    modalHeader: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
    },
    modalHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    modalIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    modalHeaderTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.6,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        flex: 1,
    },
    modalCloseBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
        padding: 8,
        marginLeft: 10,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        padding: 24,
    },
    modalTitleSection: {
        marginBottom: 20,
        alignItems: 'center',
    },
    modalExamTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1F2937',
        textAlign: 'center',
        letterSpacing: 0.5,
        lineHeight: 28,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    modalStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    modalStatusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    modalStatusText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
        letterSpacing: 0.5,
    },
    modalDateBox: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    modalDateGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    modalDateText: {
        color: '#7C3AED',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 8,
    },
    modalDescriptionSection: {
        marginBottom: 24,
    },
    modalDescriptionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    modalDescriptionLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
        marginLeft: 8,
        letterSpacing: 0.3,
    },
    modalDescriptionScroll: {
        maxHeight: 120,
        backgroundColor: 'rgba(139, 92, 246, 0.05)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.1)',
    },
    modalDescriptionText: {
        color: '#374151',
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '500',
        letterSpacing: 0.2,
    },
    modalApplyButtonContainer: {
        marginTop: 8,
    },
    modalApplyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    modalApplyButtonText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 16,
        marginHorizontal: 8,
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
}); 