import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { apiFetchAuth } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
}

export default function UserProfileScreen() {
  const { user } = useAuth();
  const route = useRoute();
  const { userId, originalUserData } = route.params as { userId: string; originalUserData?: any };
  const navigation = useNavigation<any>();
  
  console.log('🔍 User Profile - Received params:', { userId, originalUserData });
  
  const [profile, setProfile] = useState<any>(originalUserData || null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFollowRequests, setShowFollowRequests] = useState(false);
  const [followRequests, setFollowRequests] = useState<any[]>([]);
  const [followRequestsLoading, setFollowRequestsLoading] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageType, setMessageType] = useState('TEXT');
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [chatId, setChatId] = useState<string>('');

  const fetchUserProfile = async () => {
    // If we have original user data, use it instead of fetching
    if (originalUserData) {
      console.log('🔍 Using original user data:', originalUserData);
      setProfile(originalUserData);
      setIsFollowing(originalUserData.isFollowing || false);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      console.log('🔍 Fetching profile for userId:', userId);
      const res = await apiFetchAuth(`/student/profile?userId=${userId}`, user?.token || '');
      if (res.ok) {
        console.log('🔍 Profile data received:', res.data);
        setProfile(res.data);
        setIsFollowing(res.data.isFollowing || false);
      } else {
        console.log('❌ Failed to load profile:', res);
        setError('Failed to load profile');
      }
    } catch (e) {
      console.log('❌ Error fetching profile:', e);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    setPostsLoading(true);
    try {
      const res = await apiFetchAuth(`/student/posts?authorId=${userId}&limit=20`, user?.token || '');
      if (res.ok) {
        // Posts are already filtered by authorId on the backend
        setUserPosts(res.data);
      }
    } catch (e) {
      console.error('Error fetching user posts:', e);
    } finally {
      setPostsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUserProfile(), fetchUserPosts()]);
    setRefreshing(false);
  };

  // Refresh profile data every time the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchUserProfile();
      fetchUserPosts();
    }, [userId, user?.token])
  );

  // Generate chat ID for the conversation
  useEffect(() => {
    if (user && profile) {
      const sortedIds = [user.id, profile.id].sort();
      setChatId(sortedIds.join('-'));
    }
  }, [user, profile]);

  // Fetch chat messages
  const fetchChatMessages = async () => {
    if (!chatId || !user?.token) return;
    
    setLoadingMessages(true);
    try {
      const response = await apiFetchAuth(`/student/messages?chatId=${chatId}`, user.token);
      if (response.ok) {
        setMessages(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleFollow = async () => {
    // If already following, show confirmation dialog for unfollowing
    if (isFollowing) {
      Alert.alert(
        'Unfollow User',
        `Are you sure you want to unfollow ${profile.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Unfollow', 
            style: 'destructive',
            onPress: async () => {
              try {
                const res = await apiFetchAuth(`/student/follow?userId=${profile.id}`, user?.token || '', {
                  method: 'DELETE',
                });
                
                if (res.ok) {
                  setIsFollowing(false);
                  // Refresh profile data to update follower count
                  fetchUserProfile();
                }
              } catch (error) {
                console.error('Error unfollowing user:', error);
              }
            }
          }
        ]
      );
    } else {
      // Follow the user
      try {
        const res = await apiFetchAuth('/student/follow', user?.token || '', {
          method: 'POST',
          body: { targetUserId: profile.id },
        });
        
        if (res.ok) {
          setIsFollowing(true);
          // Refresh profile data to update follower count
          fetchUserProfile();
        }
      } catch (error) {
        console.error('Error following user:', error);
      }
    }
  };

  // Fetch follow requests
  const fetchFollowRequests = async () => {
    setFollowRequestsLoading(true);
    try {
      const response = await apiFetchAuth('/student/follow-requests', user?.token || '');
      if (response.ok) {
        setFollowRequests(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching follow requests:', error);
    } finally {
      setFollowRequestsLoading(false);
    }
  };

  // Accept follow request
  const handleAcceptFollowRequest = async (requestId: string, senderId: string) => {
    try {
      const response = await apiFetchAuth('/student/follow-requests', user?.token || '', {
        method: 'POST',
        body: {
          action: 'accept',
          requestId: requestId
        }
      });
      
      if (response.ok) {
        // Remove the accepted request from the list
        setFollowRequests(prev => prev.filter(req => req.id !== requestId));
        // Refresh profile data
        fetchUserProfile();
      }
    } catch (error) {
      console.error('Error accepting follow request:', error);
    }
  };

  // Reject follow request
  const handleRejectFollowRequest = async (requestId: string) => {
    try {
      const response = await apiFetchAuth('/student/follow-requests', user?.token || '', {
        method: 'POST',
        body: {
          action: 'reject',
          requestId: requestId
        }
      });
      
      if (response.ok) {
        // Remove the rejected request from the list
        setFollowRequests(prev => prev.filter(req => req.id !== requestId));
      }
    } catch (error) {
      console.error('Error rejecting follow request:', error);
    }
  };

  // Check if current user can message this profile user
  const canMessageUser = () => {
    if (!user || !profile) return false;
    
    // If following, can message directly
    if (isFollowing) return true;
    
    // If not following, check follow request status
    if (profile.followRequestStatus === 'PENDING') return false;
    if (profile.followRequestStatus === 'DECLINED') return false;
    
    return true;
  };

  // Send message (direct or request based on follow status)
  const handleSendMessage = async () => {
    if (!messageContent.trim() || !user || !profile) return;
    
    setSendingMessage(true);
    
    try {
      // Optimistic message display
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        content: messageContent.trim(),
        messageType: messageType,
        isRead: false,
        createdAt: new Date().toISOString(),
        senderId: user.id,
        receiverId: profile.id,
        sender: user,
        receiver: profile,
      };

      // Add optimistic message to UI immediately
      setMessages(prev => [...prev, optimisticMessage]);

      // API call based on follow status
      let response;
      if (isFollowing) {
        // Direct message if following
        response = await apiFetchAuth('/student/messages', user.token, {
          method: 'POST',
          body: JSON.stringify({
            receiverId: profile.id,
            content: messageContent.trim(),
            messageType: messageType
          })
        });
      } else {
        // Message request if not following
        response = await apiFetchAuth('/student/message-requests', user.token, {
          method: 'POST',
          body: JSON.stringify({
            receiverId: profile.id,
            content: messageContent.trim(),
            messageType: messageType
          })
        });
      }

      if (response.ok) {
        // Success - clear input and update message with real ID
        setMessageContent('');
        
        // Replace optimistic message with real message
        if (response.data?.message) {
          setMessages(prev => prev.map(msg => 
            msg.id === optimisticMessage.id ? response.data.message : msg
          ));
        }
        
        // Show success message
        Alert.alert(
          isFollowing ? 'Message Sent!' : 'Message Request Sent!',
          isFollowing 
            ? 'Your message has been delivered.' 
            : 'The user will receive your message request and can accept/reject it.'
        );
      } else {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        
        // Handle different error cases
        if (response.status === 403) {
          Alert.alert('Cannot Send Message', 'You need to follow this user first to send messages.');
        } else if (response.status === 400) {
          Alert.alert('Invalid Request', 'Please check your message content.');
        } else {
          Alert.alert('Error', 'Failed to send message. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  // Render individual message
  const renderMessage = ({ item }: { item: any }) => {
    const isMyMessage = item.senderId === user?.id;
    const isImage = item.messageType === 'IMAGE';
    const isFile = item.messageType === 'FILE';
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer
      ]}>
        {/* Message Avatar - Only show for other person's messages */}
        {!isMyMessage && (
          <View style={styles.messageAvatar}>
            {profile?.profilePhoto ? (
              <Image source={{ uri: profile.profilePhoto }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </View>
        )}
        
        {/* Message Content */}
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble
        ]}>
          {/* Message Type Icon */}
          {isImage && (
            <View style={styles.messageTypeIcon}>
              <Ionicons name="image-outline" size={16} color="#666" />
            </View>
          )}
          {isFile && (
            <View style={styles.messageTypeIcon}>
              <Ionicons name="document-text-outline" size={16} color="#666" />
            </View>
          )}
          
          {/* Message Text */}
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.theirMessageText
          ]}>
            {item.content}
          </Text>
          
          {/* Message Time and Status Row */}
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.theirMessageTime
            ]}>
              {new Date(item.createdAt).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
            
            {/* Read Status - Only show for my messages */}
            {isMyMessage && (
              <View style={styles.readStatus}>
                <Ionicons 
                  name={item.isRead ? "checkmark-done" : "checkmark"} 
                  size={14} 
                  color={item.isRead ? "#4CAF50" : "#999"} 
                />
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <LinearGradient
          colors={['#ff6b6b', '#ff8e53']}
          style={styles.errorGradient}
        >
          <Ionicons name="alert-circle-outline" size={64} color="#fff" />
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchUserProfile}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  // Helper for initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const renderUserPost = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.postCard} activeOpacity={0.95}>
      {/* User-Friendly Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.postAuthorSection}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.postAuthorAvatarRing}
          >
            <Image
              source={profile.profilePhoto ? { uri: profile.profilePhoto } : require('../../assets/images/avatar1.jpg')}
              style={styles.postAuthorAvatar}
            />
          </LinearGradient>
          <View style={styles.postAuthorInfo}>
            <Text style={styles.postAuthorName}>{profile.name}</Text>
            <View style={styles.postMetaRow}>
              <Ionicons name="time-outline" size={14} color="#999" />
              <Text style={styles.postTime}>{timeAgo(item.createdAt)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.postActions}>
          {item.isPrivate && (
            <View style={styles.privacyIndicator}>
              <LinearGradient
                colors={['#ff6b6b', '#ff8e53']}
                style={styles.privacyGradient}
              >
                <Ionicons name="lock-closed" size={12} color="#fff" />
              </LinearGradient>
            </View>
          )}
          <TouchableOpacity style={styles.moreButton} activeOpacity={0.7}>
            <LinearGradient
              colors={['#f0f2f5', '#e9ecef']}
              style={styles.moreButtonGradient}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color="#666" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Clear Post Content */}
      <View style={styles.postContentContainer}>
        <Text style={styles.postContent}>{item.content}</Text>
      </View>

      {/* Enhanced Post Media */}
      {item.imageUrl && (
        <TouchableOpacity style={styles.mediaContainer} activeOpacity={0.9}>
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'transparent']}
            style={styles.mediaOverlay}
          />
          <Image source={{ uri: item.imageUrl }} style={styles.mediaImage} resizeMode="cover" />
          <View style={styles.mediaPlayButton}>
            <Ionicons name="expand-outline" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
      )}

      {/* User-Friendly Hashtags */}
      {item.hashtags && item.hashtags.length > 0 && (
        <View style={styles.hashtagsContainer}>
          {item.hashtags.map((tag: string) => (
            <TouchableOpacity key={tag} activeOpacity={0.7}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.hashtagChip}
              >
                <Text style={styles.hashtagText}>#{tag}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Interactive Post Stats */}
      <View style={styles.postStats}>
        <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
          <LinearGradient
            colors={['#ff6b6b', '#ff8e53']}
            style={styles.statIconGradient}
          >
            <Ionicons name="heart-outline" size={16} color="#fff" />
          </LinearGradient>
          <Text style={styles.statText}>{item._count?.likes || 0}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
          <LinearGradient
            colors={['#4facfe', '#00f2fe']}
            style={styles.statIconGradient}
          >
            <Ionicons name="chatbubble-outline" size={16} color="#fff" />
          </LinearGradient>
          <Text style={styles.statText}>{item._count?.comments || 0}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
          <LinearGradient
            colors={['#f093fb', '#f5576c']}
            style={styles.statIconGradient}
          >
            <Ionicons name="share-outline" size={16} color="#fff" />
          </LinearGradient>
          <Text style={styles.statText}>Share</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#1877f2']}
            tintColor="#1877f2"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Professional Header with Clean Design */}
        <View style={styles.headerContainer}>
          {/* Profile Info Section */}
          <View style={styles.profileInfoContainer}>
            <View style={styles.profileAvatarContainer}>
              <View style={styles.profileAvatar}>
                {profile.profilePhoto ? (
                  <Image source={{ uri: profile.profilePhoto }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitials}>{getInitials(profile.name)}</Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>{profile.name}</Text>
              <Text style={styles.profileEmail}>
                {profile?.handle
                  ? `@${profile.handle}`
                  : profile?.username
                  ? `@${profile.username}`
                  : profile?.name
                  ? `@${profile.name.replace(/\s+/g, '').toLowerCase()}`
                  : ''}
              </Text>
              {(profile.course || profile.year) && (
                <View style={styles.profileCourseInfo}>
                  <Ionicons name="school-outline" size={16} color="#65676b" />
                  <Text style={styles.profileCourseText}>
                    {[profile.course, profile.year].filter(Boolean).join(' • ')}
                  </Text>
                </View>
              )}
            </View>

            {/* Notification Button */}
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => {
                setShowFollowRequests(true);
                fetchFollowRequests();
              }}
            >
              <View style={styles.notificationIconContainer}>
                <Ionicons name="notifications" size={20} color="#1877f2" />
                {followRequests.length > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>{followRequests.length}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Professional Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{profile._count?.posts || 0}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{profile._count?.followers || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{profile._count?.following || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        </View>

        {/* Professional Bio Section */}
        {profile.bio && (
          <View style={styles.bioSection}>
            <View style={styles.bioCard}>
              <View style={styles.bioHeader}>
                <Ionicons name="information-circle-outline" size={20} color="#1877f2" />
                <Text style={styles.bioTitle}>About</Text>
              </View>
              <Text style={styles.bioText}>{profile.bio}</Text>
            </View>
          </View>
        )}

        {/* Enhanced Action Buttons Section */}
        <View style={styles.enhancedActionSection}>
          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(248,250,252,0.95)']}
            style={styles.enhancedActionCard}
          >
            <View style={styles.enhancedActionHeader}>
              <Ionicons name="person-circle-outline" size={20} color="#667eea" />
              <Text style={styles.enhancedActionTitle}>Connect</Text>
            </View>
            
            <View style={styles.enhancedActionButtonsContainer}>
              {/* Enhanced Follow Button */}
              <TouchableOpacity 
                style={styles.enhancedFollowButtonWrapper}
                activeOpacity={0.8} 
                onPress={handleFollow}
              >
                <LinearGradient
                  colors={
                    isFollowing ? ['#ff6b6b', '#ee5a52'] :
                    profile?.followRequestStatus === 'PENDING' ? ['#ff9f43', '#f39c12'] :
                    ['#667eea', '#764ba2']
                  }
                  style={styles.enhancedFollowButtonGradient}
                >
                  <Ionicons 
                    name={
                      isFollowing ? "person-remove-outline" : 
                      profile?.followRequestStatus === 'PENDING' ? "time-outline" : 
                      "person-add-outline"
                    } 
                    size={20} 
                    color="#fff" 
                  />
                  <Text style={styles.enhancedFollowButtonText}>
                    {isFollowing ? 'Unfollow' : 
                     profile?.followRequestStatus === 'PENDING' ? 'Request Sent' : 
                     'Follow'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              
              {/* Enhanced Message Button */}
              {canMessageUser() && (
                <TouchableOpacity
                  style={styles.enhancedMessageButtonWrapper}
                  onPress={() => {
                    console.log('🔍 Message button clicked!');
                    console.log('🔍 Profile data being passed:', {
                      userId: profile?.id,
                      userName: profile?.name,
                      userProfilePhoto: profile?.profilePhoto,
                      isFollowing: isFollowing
                    });
                    router.push({
                      pathname: '/chat-screen',
                      params: {
                        userId: profile?.id || '',
                        userName: profile?.name || 'User',
                        userProfilePhoto: profile?.profilePhoto || '',
                        isFollowing: isFollowing.toString()
                      }
                    });
                  }}
                >
                  <LinearGradient
                    colors={['#4facfe', '#00f2fe']}
                    style={styles.enhancedMessageButtonGradient}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
                    <Text style={styles.enhancedMessageButtonText}>Message</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
            
            {/* Enhanced Status Indicators */}
            <View style={styles.enhancedStatusContainer}>
              {isFollowing && (
                <View style={styles.enhancedStatusItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.enhancedStatusText}>Following</Text>
                </View>
              )}
              {profile?.followRequestStatus === 'PENDING' && (
                <View style={styles.enhancedStatusItem}>
                  <Ionicons name="time-outline" size={16} color="#F59E0B" />
                  <Text style={styles.enhancedStatusText}>Request Pending</Text>
                </View>
              )}
              {profile?.isPrivate && (
                <View style={styles.enhancedStatusItem}>
                  <Ionicons name="lock-closed" size={16} color="#EF4444" />
                  <Text style={styles.enhancedStatusText}>Private Account</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>

        {/* Professional Posts Section */}
        <View style={styles.postsSection}>
          <View style={styles.postsHeader}>
            <View style={styles.postsHeaderContent}>
              <Ionicons name="create-outline" size={20} color="#1877f2" />
              <Text style={styles.postsTitle}>Posts</Text>
              <View style={styles.postsCount}>
                <Text style={styles.postsCountText}>{userPosts.length}</Text>
              </View>
            </View>
          </View>

          {postsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1877f2" />
              <Text style={styles.loadingText}>Loading posts...</Text>
            </View>
          ) : userPosts.length > 0 ? (
            <View style={styles.postsList}>
              {userPosts.map((item, index) => (
                <View key={item.id} style={styles.postCard}>
                  {renderUserPost({ item })}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyPostsContainer}>
              <View style={styles.emptyPostsCard}>
                <Ionicons name="create-outline" size={48} color="#bdc3c7" />
                <Text style={styles.emptyPostsTitle}>No posts yet</Text>
                <Text style={styles.emptyPostsSubtitle}>This user hasn't shared any posts yet</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Professional Follow Requests Modal */}
      {showFollowRequests && (
        <Modal
          visible={showFollowRequests}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowFollowRequests(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.followRequestsModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Follow Requests</Text>
                <TouchableOpacity 
                  onPress={() => setShowFollowRequests(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#65676b" />
                </TouchableOpacity>
              </View>
              
              {followRequestsLoading ? (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="large" color="#1877f2" />
                  <Text style={styles.modalLoadingText}>Loading requests...</Text>
                </View>
              ) : followRequests.length === 0 ? (
                <View style={styles.modalEmptyContainer}>
                  <Ionicons name="people-outline" size={48} color="#bdc3c7" />
                  <Text style={styles.modalEmptyTitle}>No follow requests</Text>
                  <Text style={styles.modalEmptySubtitle}>You don't have any pending follow requests</Text>
                </View>
              ) : (
                <FlatList
                  data={followRequests}
                  keyExtractor={(item) => item.id}
                  renderItem={renderFollowRequest}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.followRequestsList}
                />
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGradient: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorGradient: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  profileSection: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  courseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseText: {
    fontSize: 14,
    color: '#667eea',
    marginLeft: 8,
  },
  bioSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  bio: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#f0f0f0',
  },
  actionSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  followButton: {
    backgroundColor: '#667eea',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  unfollowButton: {
    backgroundColor: '#ff6b6b',
  },
  pendingRequestButton: {
    backgroundColor: '#ff9f43', // A different color for pending requests
  },
  followButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  messageButton: {
    backgroundColor: '#4facfe',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    shadowColor: '#4facfe',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  messageRequestButton: {
    backgroundColor: '#ff9f43', // A different color for message requests
  },
  postsSection: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  postsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  postsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  postsCount: {
    fontSize: 14,
    color: '#666',
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  postAuthorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  postAuthorAvatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postAuthorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  postAuthorInfo: {
    flex: 1,
  },
  postAuthorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  postMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postTime: {
    fontSize: 13,
    color: '#999',
    marginLeft: 4,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyIndicator: {
    marginRight: 8,
  },
  privacyGradient: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButton: {
    padding: 4,
  },
  moreButtonGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postContentContainer: {
    marginBottom: 12,
  },
  postContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  mediaContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  mediaImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
  },
  mediaPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    width: 24,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  hashtagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  hashtagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statIconGradient: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyIcon: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  dummyTestContainer: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  dummyTestTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  dummyTestSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  notificationContainer: {
    position: 'absolute',
    top: 0,
    right: 20,
    zIndex: 10,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  followRequestsModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    paddingBottom: 20, // Add bottom padding
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 8,
  },
  followRequestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginHorizontal: 20, // Add horizontal margin
  },
  followRequestUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Take available space
    marginRight: 16, // Add right margin
  },
  followRequestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  followRequestAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  followRequestAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  followRequestAvatarInitials: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  followRequestInfo: {
    flex: 1,
  },
  followRequestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  followRequestEmail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  followRequestActions: {
    flexDirection: 'row',
    gap: 10,
    flexShrink: 0, // Prevent shrinking
  },
  acceptButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#4caf50',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 70, // Ensure minimum width
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center', // Center text
  },
  rejectButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#f44336',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 70, // Ensure minimum width
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center', // Center text
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50, // Add extra top padding to prevent cutoff
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  chatUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  chatAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  chatAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatUserDetails: {
    flex: 1,
  },
  chatUserName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  chatUserStatus: {
    fontSize: 14,
    color: '#666',
  },
  messagesContainer: {
    flex: 1,
    padding: 15,
  },
  loadingMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#667eea',
    fontSize: 16,
    marginTop: 10,
  },
  emptyMessages: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyMessagesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessagesSubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  messagesList: {
    paddingBottom: 100, // Add padding for the input bar
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  theirMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    marginTop: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: '#1877f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    position: 'relative',
  },
  myMessageBubble: {
    backgroundColor: '#1877f2',
    borderBottomRightRadius: 6,
  },
  theirMessageBubble: {
    backgroundColor: '#f0f2f5',
    borderBottomLeftRadius: 6,
  },
  messageTypeIcon: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
  myMessageText: {
    color: '#fff',
  },
  theirMessageText: {
    color: '#1a1a1a',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.8)',
  },
  theirMessageTime: {
    color: '#999',
  },
  readStatus: {
    marginLeft: 8,
  },
  messageInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  attachButton: {
    padding: 10,
  },
  textInputWrapper: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  messageTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  sendButton: {
    backgroundColor: '#667eea',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  messageRequestIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#fff3cd',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffeeba',
  },
  messageRequestText: {
    fontSize: 13,
    color: '#856404',
    marginLeft: 5,
  },
  // New styles for enhanced UI
  headerGradient: {
    paddingTop: 50, // Adjust for status bar
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  enhancedProfileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  enhancedAvatarContainer: {
    marginRight: 16,
  },
  avatarRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enhancedAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  enhancedAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  enhancedAvatarInitials: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  enhancedProfileDetails: {
    flex: 1,
  },
  enhancedName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  enhancedEmail: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 8,
  },
  enhancedCourseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  enhancedCourseText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
  },
  enhancedProfileSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  enhancedBioSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  bioCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bioTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  enhancedBio: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  enhancedStatsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statsCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  enhancedStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  enhancedStatNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  enhancedStatLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  statIcon: {
    marginTop: 8,
  },
  enhancedActionSection: {
    margin: 20,
    marginTop: 0,
  },
  enhancedActionCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  enhancedActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  enhancedActionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  enhancedActionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  enhancedFollowButtonWrapper: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  enhancedFollowButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  enhancedMessageButtonWrapper: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#4facfe',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  enhancedMessageButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  enhancedStatusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 12,
  },
  enhancedStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  enhancedStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 4,
  },
  enhancedFollowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 25,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  enhancedUnfollowButton: {
    backgroundColor: '#ff6b6b',
  },
  enhancedPendingRequestButton: {
    backgroundColor: '#ff9f43', // A different color for pending requests
  },
  enhancedFollowButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  followButtonGradient: {
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  enhancedMessageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 25,
    shadowColor: '#4facfe',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  enhancedMessageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  messageButtonGradient: {
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4facfe',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  enhancedPostsSection: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  enhancedPostsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  postsHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  enhancedPostsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  postsCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  postsCountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  enhancedLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  enhancedLoadingText: {
    color: '#667eea',
    fontSize: 16,
    marginTop: 10,
  },
  enhancedEmptyContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  enhancedEmptyIcon: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  enhancedEmptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  enhancedEmptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  enhancedEmptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  enhancedFollowRequestsModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    paddingBottom: 20, // Add bottom padding
  },
  modalHeaderGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  enhancedModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  enhancedCloseButton: {
    padding: 8,
  },
  enhancedFollowRequestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginHorizontal: 20, // Add horizontal margin
  },
  enhancedFollowRequestUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Take available space
    marginRight: 16, // Add right margin
  },
  enhancedFollowRequestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  enhancedFollowRequestAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  enhancedFollowRequestAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  enhancedFollowRequestAvatarInitials: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  enhancedFollowRequestInfo: {
    flex: 1,
  },
  enhancedFollowRequestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  enhancedFollowRequestEmail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  enhancedFollowRequestActions: {
    flexDirection: 'row',
    gap: 10,
    flexShrink: 0, // Prevent shrinking
  },
  enhancedAcceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#4caf50',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 70, // Ensure minimum width
  },
  enhancedAcceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center', // Center text
  },
  acceptButtonGradient: {
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4caf50',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  enhancedRejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#f44336',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 70, // Ensure minimum width
  },
  enhancedRejectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center', // Center text
  },
  rejectButtonGradient: {
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f44336',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  enhancedChatContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  enhancedChatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  enhancedBackButton: {
    padding: 8,
  },
  enhancedChatUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  enhancedChatUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  enhancedChatAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  enhancedChatAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  enhancedChatAvatarInitials: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  enhancedChatUserDetails: {
    flex: 1,
  },
  enhancedChatUserName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  enhancedChatUserStatus: {
    fontSize: 14,
    color: '#666',
  },
  enhancedMoreButton: {
    padding: 8,
  },
  enhancedMessagesContainer: {
    flex: 1,
    padding: 15,
  },
  enhancedLoadingMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  enhancedEmptyMessages: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyMessagesCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  enhancedEmptyMessagesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  enhancedEmptyMessagesSubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  enhancedMessagesList: {
    paddingBottom: 100, // Add padding for the input bar
  },
  enhancedSendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  enhancedSendButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  enhancedMessageInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  inputContainerGradient: {
    borderRadius: 16,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  enhancedInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  enhancedAttachButton: {
    padding: 10,
  },
  enhancedTextInputWrapper: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  enhancedMessageTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  sendButtonGradient: {
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  enhancedMessageRequestIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#fff3cd',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffeeba',
  },
  enhancedMessageRequestText: {
    fontSize: 13,
    color: '#856404',
    marginLeft: 5,
  },
  enhancedAcceptButtonGradient: {
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4caf50',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  enhancedRejectButtonGradient: {
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f44336',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingTop: 60, // Add top padding to move section lower
    paddingBottom: 20,
  },
  coverPhotoContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  coverPhoto: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    overflow: 'hidden',
  },
  coverPhotoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPhotoText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  profileAvatarContainer: {
    marginRight: 16,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  profileCourseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileCourseText: {
    fontSize: 14,
    color: '#65676b',
    marginLeft: 8,
  },
  notificationIconContainer: {
    position: 'relative',
  },
  statsSection: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#65676b',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#f0f0f0',
  },
  bioSection: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  bioCard: {
    paddingHorizontal: 20,
  },
  bioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bioTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  bioText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  actionSection: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
  },
  followButton: {
    backgroundColor: '#1877f2',
  },
  unfollowButton: {
    backgroundColor: '#e74c3c',
  },
  pendingButton: {
    backgroundColor: '#f39c12',
  },
  messageButton: {
    backgroundColor: '#42a5f5',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  postsSection: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  postsHeader: {
    marginBottom: 20,
  },
  postsHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  postsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  postsCount: {
    backgroundColor: '#f0f2f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  postsCountText: {
    color: '#1877f2',
    fontSize: 14,
    fontWeight: '600',
  },
  postsList: {
    paddingBottom: 20,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  emptyPostsContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyPostsCard: {
    alignItems: 'center',
  },
  emptyPostsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#65676b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyPostsSubtitle: {
    fontSize: 14,
    color: '#65676b',
    textAlign: 'center',
  },
  followRequestsModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalLoadingText: {
    color: '#1877f2',
    fontSize: 16,
    marginTop: 10,
  },
  modalEmptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  modalEmptyText: {
    fontSize: 16,
    color: '#65676b',
    textAlign: 'center',
    marginTop: 16,
  },
  followRequestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  followRequestUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  followRequestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  followRequestAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  followRequestAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#1877f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  followRequestAvatarInitials: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  followRequestInfo: {
    flex: 1,
  },
  followRequestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  followRequestEmail: {
    fontSize: 14,
    color: '#65676b',
  },
  followRequestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50, // Add extra top padding to prevent cutoff
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  chatUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  chatAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  chatAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatAvatarInitials: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  chatUserDetails: {
    flex: 1,
  },
  chatUserName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  chatUserStatus: {
    fontSize: 14,
    color: '#666',
  },
  moreButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messagesLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messagesLoadingText: {
    color: '#1877f2',
    fontSize: 16,
    marginTop: 10,
  },
  messagesEmptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  messagesEmptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#65676b',
    marginTop: 16,
    marginBottom: 8,
  },
  messagesEmptySubtitle: {
    fontSize: 14,
    color: '#65676b',
    textAlign: 'center',
  },
  messagesList: {
    paddingBottom: 20,
  },
  messageInputContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  attachButton: {
    padding: 8,
  },
  textInputWrapper: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
  },
  messageTextInput: {
    fontSize: 16,
    color: '#1a1a1a',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#1877f2',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  messageRequestIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
  },
  messageRequestText: {
    fontSize: 12,
    color: '#856404',
    marginLeft: 8,
  },
  messagesEmptyIcon: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  startConversationButton: {
    backgroundColor: '#1877f2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  startConversationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  messagesFlatList: {
    paddingBottom: 100, // Add padding for the input bar
  },
}); 