import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { apiFetchAuth } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';

interface FollowRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
    profilePhoto: string | null;
    course: string | null;
    year: string | null;
  };
}

export default function FollowRequestsScreen() {
  const { user } = useAuth();
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  useEffect(() => {
    fetchFollowRequests();
  }, []);

  const fetchFollowRequests = async () => {
    setLoading(true);
    try {
      const response = await apiFetchAuth('/student/follow-requests', user?.token || '');
      if (response.ok) {
        setFollowRequests(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching follow requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFollowRequests();
    setRefreshing(false);
  };

  const handleAcceptFollowRequest = async (requestId: string, senderId: string) => {
    setProcessingRequest(requestId);
    try {
      const response = await apiFetchAuth('/student/follow-requests', user?.token || '', {
        method: 'POST',
        body: {
          requestId: requestId,
          action: 'accept'
        }
      });
      
      if (response.ok) {
        // Remove the accepted request from the list
        setFollowRequests(prev => prev.filter(req => req.id !== requestId));
      }
    } catch (error) {
      console.error('Error accepting follow request:', error);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectFollowRequest = async (requestId: string) => {
    setProcessingRequest(requestId);
    try {
      const response = await apiFetchAuth('/student/follow-requests', user?.token || '', {
        method: 'POST',
        body: {
          requestId: requestId,
          action: 'reject'
        }
      });
      
      if (response.ok) {
        // Remove the rejected request from the list
        setFollowRequests(prev => prev.filter(req => req.id !== requestId));
      }
    } catch (error) {
      console.error('Error rejecting follow request:', error);
    } finally {
      setProcessingRequest(null);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const renderFollowRequest = ({ item }: { item: FollowRequest }) => (
    <View style={styles.requestCard}>
      <LinearGradient
        colors={['rgba(255,255,255,0.95)', 'rgba(248,250,252,0.95)']}
        style={styles.requestGradient}
      >
        {/* User Info Section */}
        <View style={styles.userInfoSection}>
          <View style={styles.avatarContainer}>
            {item.sender.profilePhoto ? (
              <Image 
                source={{ uri: item.sender.profilePhoto }} 
                style={styles.avatarImage} 
              />
            ) : (
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.avatarPlaceholder}
              >
                <Text style={styles.avatarInitials}>
                  {item.sender.name ? item.sender.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                </Text>
              </LinearGradient>
            )}
            <View style={styles.onlineIndicator} />
          </View>
          
          <View style={styles.userDetails}>
            <View style={styles.nameContainer}>
              <Text style={styles.userName}>{item.sender.name}</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              </View>
            </View>
            
            <Text style={styles.userEmail}>{item.sender.email}</Text>
            
            {(item.sender.course || item.sender.year) && (
              <View style={styles.courseContainer}>
                <LinearGradient
                  colors={['#F3F4F6', '#E5E7EB']}
                  style={styles.courseTag}
                >
                  <Ionicons name="school-outline" size={12} color="#6B7280" />
                  <Text style={styles.courseText}>
                    {[item.sender.course, item.sender.year].filter(Boolean).join(' • ')}
                  </Text>
                </LinearGradient>
              </View>
            )}
            
            <Text style={styles.timeAgo}>{formatTimeAgo(item.createdAt)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {processingRequest === item.id ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#667eea" />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAcceptFollowRequest(item.id, item.senderId)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.acceptButtonGradient}
                >
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => handleRejectFollowRequest(item.id)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={styles.rejectButtonGradient}
                >
                  <Ionicons name="close" size={18} color="#fff" />
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>
      </LinearGradient>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.loadingCard}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading follow requests...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Enhanced Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb', '#f5576c']}
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
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Follow Requests</Text>
            <Text style={styles.headerSubtitle}>
              {followRequests.length} pending request{followRequests.length !== 1 ? 's' : ''}
            </Text>
          </View>
          
          <View style={styles.headerRight}>
          </View>
        </View>
      </LinearGradient>



      {/* Follow Requests List */}
      <FlatList
        data={followRequests}
        keyExtractor={(item) => item.id}
        renderItem={renderFollowRequest}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#667eea']}
            tintColor="#667eea"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={['#fff', '#f8f9fa']}
              style={styles.emptyCard}
            >
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={64} color="#667eea" />
              </View>
              <Text style={styles.emptyTitle}>No Follow Requests</Text>
              <Text style={styles.emptySubtitle}>
                You're all caught up! No pending follow requests at the moment.
              </Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={fetchFollowRequests}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.refreshButtonGradient}
                >
                  <Ionicons name="refresh" size={16} color="#fff" />
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
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
    color: '#e0e0e0',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  requestCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  requestGradient: {
    padding: 16,
  },
  userInfoSection: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 6,
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  courseContainer: {
    marginBottom: 6,
  },
  courseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  courseText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 4,
  },
  timeAgo: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 12,
  },
  loadingText: {
    marginLeft: 8,
    color: '#667eea',
    fontSize: 14,
    fontWeight: '500',
  },
  acceptButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  acceptButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  rejectButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  rejectButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingCard: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyCard: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  refreshButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  refreshButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});
