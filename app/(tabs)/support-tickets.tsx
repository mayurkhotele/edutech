import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface SupportTicket {
    id: string;
    ticketId: string;
    title: string;
    description: string;
    issueType: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    createdAt: string;
    updatedAt: string;
    resolvedAt: string | null;
    userId: string;
    assignedToId: string | null;
    user: {
        id: string;
        name: string;
        email: string;
    };
    assignedTo: any;
    replies: Array<{
        id: string;
        content: string;
        isInternal: boolean;
        createdAt: string;
        updatedAt: string;
        ticketId: string;
        userId: string;
        user: {
            id: string;
            name: string;
            email: string;
        };
    }>;
    _count: {
        replies: number;
    };
}

interface SupportTicketsResponse {
    tickets: SupportTicket[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

const SupportTicketsScreen = () => {
    const router = useRouter();
    const { user } = useAuth();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('ALL');

    useFocusEffect(
        useCallback(() => {
            if (user?.token) {
                fetchTickets();
            }
        }, [user?.token, selectedStatus])
    );

    const fetchTickets = async () => {
        if (!user?.token) return;

        try {
            setLoading(true);
            const response = await apiFetchAuth(`/student/support-tickets?status=${selectedStatus}`, user.token);
            
            if (response.ok) {
                const data: SupportTicketsResponse = response.data;
                setTickets(data.tickets || []);
            } else {
                Alert.alert('Error', 'Failed to load support tickets.');
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
            Alert.alert('Error', 'Failed to load support tickets. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchTickets();
        setRefreshing(false);
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN':
                return '#ff6b6b';
            case 'IN_PROGRESS':
                return '#4ecdc4';
            case 'RESOLVED':
                return '#45b7d1';
            case 'CLOSED':
                return '#96ceb4';
            default:
                return '#95a5a6';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT':
                return '#e74c3c';
            case 'HIGH':
                return '#f39c12';
            case 'MEDIUM':
                return '#3498db';
            case 'LOW':
                return '#27ae60';
            default:
                return '#95a5a6';
        }
    };

    const getIssueTypeIcon = (issueType: string) => {
        switch (issueType) {
            case 'EXAM_ACCESS':
                return 'school-outline';
            case 'PAYMENT_PROBLEM':
                return 'card-outline';
            case 'TECHNICAL_ISSUE':
                return 'construct-outline';
            case 'ACCOUNT_ISSUE':
                return 'person-outline';
            default:
                return 'help-circle-outline';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'OPEN':
                return 'Open';
            case 'IN_PROGRESS':
                return 'In Progress';
            case 'RESOLVED':
                return 'Resolved';
            case 'CLOSED':
                return 'Closed';
            default:
                return status;
        }
    };

    const getPriorityText = (priority: string) => {
        switch (priority) {
            case 'URGENT':
                return 'Urgent';
            case 'HIGH':
                return 'High';
            case 'MEDIUM':
                return 'Medium';
            case 'LOW':
                return 'Low';
            default:
                return priority;
        }
    };

    const renderTicketCard = ({ item }: { item: SupportTicket }) => (
        <TouchableOpacity
            style={styles.ticketCard}
            onPress={() => router.push({ pathname: '/(tabs)/ticket-details', params: { id: item.id } })}
        >
            <View style={styles.ticketHeader}>
                <View style={styles.ticketIdContainer}>
                    <Ionicons name="ticket-outline" size={16} color="#667eea" />
                    <Text style={styles.ticketId}>{item.ticketId}</Text>
                </View>
                <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                        <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.ticketContent}>
                <View style={styles.titleContainer}>
                    <Ionicons 
                        name={getIssueTypeIcon(item.issueType) as any} 
                        size={20} 
                        color="#667eea" 
                        style={styles.issueIcon}
                    />
                    <Text style={styles.ticketTitle} numberOfLines={2}>
                        {item.title}
                    </Text>
                </View>

                <Text style={styles.ticketDescription} numberOfLines={2}>
                    {item.description}
                </Text>

                <View style={styles.ticketMeta}>
                    <View style={styles.priorityContainer}>
                        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                            <Text style={styles.priorityText}>{getPriorityText(item.priority)}</Text>
                        </View>
                    </View>

                    <View style={styles.repliesContainer}>
                        <Ionicons name="chatbubble-outline" size={14} color="#95a5a6" />
                        <Text style={styles.repliesText}>{item._count.replies} replies</Text>
                    </View>
                </View>

                <View style={styles.ticketFooter}>
                    <View style={styles.dateContainer}>
                        <Ionicons name="time-outline" size={14} color="#95a5a6" />
                        <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                    </View>
                    
                    <View style={styles.arrowContainer}>
                        <Ionicons name="chevron-forward" size={16} color="#95a5a6" />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.emptyGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Ionicons name="ticket-outline" size={64} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.emptyTitle}>No Support Tickets</Text>
                <Text style={styles.emptySubtitle}>
                    You haven't created any support tickets yet.
                </Text>
            </LinearGradient>
        </View>
    );

    const renderStatusFilter = () => (
        <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((status) => (
                    <TouchableOpacity
                        key={status}
                        style={[
                            styles.filterButton,
                            selectedStatus === status && styles.filterButtonActive
                        ]}
                        onPress={() => setSelectedStatus(status)}
                    >
                        <Text style={[
                            styles.filterButtonText,
                            selectedStatus === status && styles.filterButtonTextActive
                        ]}>
                            {status === 'ALL' ? 'All' : getStatusText(status)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#667eea" />
                    <Text style={styles.loadingText}>Loading support tickets...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerText}>
                        <Text style={styles.headerTitle}>Support Tickets</Text>
                        <Text style={styles.headerSubtitle}>24/7 Customer Support</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.newTicketButton}
                        onPress={() => router.push('/new-ticket')}
                    >
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Status Filter */}
            {renderStatusFilter()}

            {/* Tickets List */}
            <FlatList
                data={tickets}
                renderItem={renderTicketCard}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={renderEmptyState}
            />

            {/* Floating Create Ticket Button */}
            <TouchableOpacity
                style={styles.floatingButton}
                onPress={() => router.push('/new-ticket')}
            >
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.floatingButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                    <Text style={styles.floatingButtonText}>New Ticket</Text>
                </LinearGradient>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingTop: 20,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    newTicketButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterContainer: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f8f9fa',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    filterButtonActive: {
        backgroundColor: '#667eea',
        borderColor: '#667eea',
    },
    filterButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6c757d',
    },
    filterButtonTextActive: {
        color: '#fff',
    },
    listContainer: {
        padding: 20,
    },
    ticketCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
        overflow: 'hidden',
    },
    ticketHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f8f9fa',
    },
    ticketIdContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ticketId: {
        fontSize: 14,
        fontWeight: '600',
        color: '#667eea',
        marginLeft: 6,
    },
    statusContainer: {
        alignItems: 'flex-end',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
    },
    ticketContent: {
        padding: 20,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    issueIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    ticketTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        lineHeight: 22,
    },
    ticketDescription: {
        fontSize: 14,
        color: '#6c757d',
        lineHeight: 20,
        marginBottom: 16,
    },
    ticketMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    priorityContainer: {
        alignItems: 'flex-start',
    },
    priorityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    priorityText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#fff',
    },
    repliesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    repliesText: {
        fontSize: 12,
        color: '#95a5a6',
        marginLeft: 4,
    },
    ticketFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f8f9fa',
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 12,
        color: '#95a5a6',
        marginLeft: 4,
    },
    arrowContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyGradient: {
        width: '100%',
        padding: 40,
        borderRadius: 20,
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        lineHeight: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6c757d',
    },
    floatingButton: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        borderRadius: 25,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    floatingButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
    },
    floatingButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 8,
    },
});

export default SupportTicketsScreen; 