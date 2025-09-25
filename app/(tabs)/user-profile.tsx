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
      // Ensure profile has required fields
      const profileData = {
        ...originalUserData,
        name: originalUserData.name || originalUserData.username || 'Unknown User',
        username: originalUserData.username || originalUserData.name || 'unknown',
        email: originalUserData.email || '',
        profilePhoto: originalUserData.profilePhoto || null,
        bio: originalUserData.bio || '',
        followersCount: originalUserData.followersCount || 0,
        followingCount: originalUserData.followingCount || 0,
        postsCount: originalUserData.postsCount || 0
      };
      setProfile(profileData);
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
        `Are you sure you want to unfollow ${profile?.name || 'this user'}?`,
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


  if (error) {
    return (
      <View style={styles.enhancedErrorContainer}>
        <LinearGradient
          colors={['#ff6b6b', '#ff8e53', '#ff9f43']}
          style={styles.enhancedErrorGradient}
        >
          <View style={styles.errorContent}>
            <View style={styles.errorIconContainer}>
              <Ionicons name="alert-circle-outline" size={64} color="#fff" />
            </View>
            <Text style={styles.enhancedErrorTitle}>Oops! Something went wrong</Text>
            <Text style={styles.enhancedErrorText}>{error}</Text>
            <TouchableOpacity style={styles.enhancedRetryButton} onPress={fetchUserProfile}>
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.retryButtonGradient}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.enhancedRetryButtonText}>Try Again</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // Helper for initials
  const getInitials = (name: string | undefined) => {
    if (!name || typeof name !== 'string') {
      return 'U';
    }
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
            <Text style={styles.postAuthorName}>{profile?.name || 'Unknown User'}</Text>
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
            colors={['#4F46E5']}
            tintColor="#4F46E5"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Enhanced Profile Section */}
        <View style={styles.enhancedProfileSection}>
          <LinearGradient
            colors={['#fff', '#f8f9fa']}
            style={styles.profileCard}
          >
            <View style={styles.profileInfoContainer}>
              <View style={styles.profileAvatarContainer}>
                <View style={styles.avatarRing}>
                  {profile.profilePhoto ? (
                    <Image source={{ uri: profile.profilePhoto }} style={styles.enhancedAvatarImage} />
                  ) : (
                    <LinearGradient
                      colors={['#4F46E5', '#7C3AED']}
                      style={styles.enhancedAvatarPlaceholder}
                    >
                      <Text style={styles.enhancedAvatarInitials}>{getInitials(profile?.name)}</Text>
                    </LinearGradient>
                  )}
                  <View style={styles.onlineIndicator} />
                </View>
              </View>
              
              <View style={styles.profileDetails}>
                <View style={styles.nameRow}>
                  <Text style={styles.enhancedProfileName}>{profile?.name || 'Unknown User'}</Text>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  </View>
                </View>
                <Text style={styles.enhancedProfileHandle}>
                  {profile?.handle
                    ? `@${profile.handle}`
                    : profile?.username
                    ? `@${profile.username}`
                    : profile?.name
                    ? `@${(profile?.name || 'unknown').replace(/\s+/g, '').toLowerCase()}`
                    : ''}
                </Text>
                {profile.bio && (
                  <Text style={styles.profileBio}>{profile.bio}</Text>
                )}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Enhanced Stats Section */}
        <View style={styles.enhancedStatsSection}>
          <LinearGradient
            colors={['#fff', '#f8f9fa']}
            style={styles.statsCard}
          >
            <View style={styles.enhancedStatsContainer}>
              <TouchableOpacity style={styles.enhancedStatItem} activeOpacity={0.8}>
                <LinearGradient
                  colors={['#4F46E5', '#7C3AED']}
                  style={styles.statIconGradient}
                >
                  <Ionicons name="grid-outline" size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.enhancedStatNumber}>{profile._count?.posts || 0}</Text>
                <Text style={styles.enhancedStatLabel}>Posts</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.enhancedStatItem} activeOpacity={0.8}>
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.statIconGradient}
                >
                  <Ionicons name="people-outline" size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.enhancedStatNumber}>{profile._count?.followers || 0}</Text>
                <Text style={styles.enhancedStatLabel}>Followers</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.enhancedStatItem} activeOpacity={0.8}>
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  style={styles.statIconGradient}
                >
                  <Ionicons name="person-add-outline" size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.enhancedStatNumber}>{profile._count?.following || 0}</Text>
                <Text style={styles.enhancedStatLabel}>Following</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Enhanced Bio Section */}
        {profile.bio && (
          <View style={styles.enhancedBioSection}>
            <View style={styles.bioCard}>
              <View style={styles.bioHeader}>
                <LinearGradient
                  colors={['#4F46E5', '#7C3AED']}
                  style={styles.bioIconGradient}
                >
                  <Ionicons name="information-circle-outline" size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.bioTitle}>About</Text>
              </View>
              <Text style={styles.bioText}>{profile.bio}</Text>
            </View>
          </View>
        )}

        {/* Enhanced Action Buttons */}
        <View style={styles.enhancedActionSection}>
          <LinearGradient
            colors={['#fff', '#f8f9fa']}
            style={styles.actionCard}
          >
            <View style={styles.enhancedActionButtonsContainer}>
              {/* Follow Button */}
              <TouchableOpacity 
                style={styles.enhancedFollowButtonWrapper}
                activeOpacity={0.8} 
                onPress={handleFollow}
              >
                <LinearGradient
                  colors={
                    isFollowing ? ['#ff6b6b', '#ee5a52'] :
                    profile?.followRequestStatus === 'PENDING' ? ['#ff9f43', '#f39c12'] :
                    ['#4F46E5', '#7C3AED']
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
                    {isFollowing ? 'Following' : 
                     profile?.followRequestStatus === 'PENDING' ? 'Requested' : 
                     'Follow'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              
              {/* Message Button */}
              {canMessageUser() && (
                <TouchableOpacity
                  style={styles.enhancedMessageButtonWrapper}
                  onPress={() => {
                    console.log('🔍 Message button clicked!');
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
                    colors={['#7C3AED', '#8B5CF6']}
                    style={styles.enhancedMessageButtonGradient}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
                    <Text style={styles.enhancedMessageButtonText}>Message</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              
              {/* More Options Button */}
              <TouchableOpacity style={styles.moreOptionsButton} activeOpacity={0.8}>
                <LinearGradient
                  colors={['#6B7280', '#4B5563']}
                  style={styles.moreOptionsGradient}
                >
                  <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* About Section */}
        {(profile.course || profile.year) && (
          <View style={styles.aboutSection}>
            <Text style={styles.aboutTitle}>About</Text>
            <View style={styles.profileCourseInfo}>
              <Ionicons name="school-outline" size={16} color="#666" />
              <Text style={styles.profileCourseText}>
                {[profile.course, profile.year].filter(Boolean).join(' • ')}
              </Text>
            </View>
          </View>
        )}

        {/* Enhanced Posts Section */}
        <View style={styles.enhancedPostsSection}>
          <LinearGradient
            colors={['#fff', '#f8f9fa']}
            style={styles.postsCard}
          >
            <View style={styles.postsHeader}>
              <View style={styles.postsHeaderLeft}>
                <LinearGradient
                  colors={['#4F46E5', '#7C3AED']}
                  style={styles.postsIconGradient}
                >
                  <Ionicons name="grid-outline" size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.postsTitle}>Posts</Text>
              </View>
              <Text style={styles.postsCount}>{userPosts.length} posts</Text>
            </View>
            
            {postsLoading ? (
              <View style={styles.enhancedLoadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.enhancedLoadingText}>Loading posts...</Text>
              </View>
            ) : userPosts.length > 0 ? (
              <View style={styles.enhancedPostsList}>
                {userPosts.map((item, index) => (
                  <View key={item.id} style={styles.enhancedPostCard}>
                    <LinearGradient
                      colors={['#fff', '#f8f9fa']}
                      style={styles.postCardGradient}
                    >
                      {/* Enhanced Post Header */}
                      <View style={styles.enhancedPostHeader}>
                        <View style={styles.enhancedPostAuthorSection}>
                          <View style={styles.enhancedPostAvatar}>
                            {profile.profilePhoto ? (
                              <Image source={{ uri: profile.profilePhoto }} style={styles.enhancedPostAvatarImage} />
                            ) : (
                              <LinearGradient
                                colors={['#4F46E5', '#7C3AED']}
                                style={styles.enhancedPostAvatarPlaceholder}
                              >
                                <Text style={styles.enhancedPostAvatarInitials}>{getInitials(profile?.name)}</Text>
                              </LinearGradient>
                            )}
                          </View>
                          <View style={styles.enhancedPostAuthorInfo}>
                            <Text style={styles.enhancedPostAuthorName}>{profile?.name || 'Unknown User'}</Text>
                            <Text style={styles.enhancedPostTime}>{timeAgo(item.createdAt)}</Text>
                          </View>
                        </View>
                        <TouchableOpacity style={styles.enhancedPostMoreButton}>
                          <Ionicons name="ellipsis-horizontal" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                      </View>

                      {/* Enhanced Post Content */}
                      <View style={styles.enhancedPostContentContainer}>
                        <Text style={styles.enhancedPostContent}>{item.content}</Text>
                      </View>

                      {/* Enhanced Post Image */}
                      {item.imageUrl && (
                        <View style={styles.enhancedPostImageContainer}>
                          <Image source={{ uri: item.imageUrl }} style={styles.enhancedPostImage} />
                        </View>
                      )}

                      {/* Enhanced Post Actions */}
                      <View style={styles.enhancedPostActions}>
                        <TouchableOpacity style={styles.enhancedPostActionButton}>
                          <LinearGradient
                            colors={['#ff6b6b', '#ff8e53']}
                            style={styles.postActionIconGradient}
                          >
                            <Ionicons name="heart-outline" size={16} color="#fff" />
                          </LinearGradient>
                          <Text style={styles.enhancedPostActionText}>{item._count?.likes || 0}</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.enhancedPostActionButton}>
                          <LinearGradient
                            colors={['#4facfe', '#00f2fe']}
                            style={styles.postActionIconGradient}
                          >
                            <Ionicons name="chatbubble-outline" size={16} color="#fff" />
                          </LinearGradient>
                          <Text style={styles.enhancedPostActionText}>{item._count?.comments || 0}</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.enhancedPostActionButton}>
                          <LinearGradient
                            colors={['#f093fb', '#f5576c']}
                            style={styles.postActionIconGradient}
                          >
                            <Ionicons name="share-outline" size={16} color="#fff" />
                          </LinearGradient>
                          <Text style={styles.enhancedPostActionText}>Share</Text>
                        </TouchableOpacity>
                      </View>
                    </LinearGradient>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.enhancedEmptyPostsContainer}>
                <LinearGradient
                  colors={['#f8f9fa', '#e9ecef']}
                  style={styles.enhancedEmptyPostsCard}
                >
                  <View style={styles.enhancedEmptyPostsIcon}>
                    <Ionicons name="camera-outline" size={48} color="#9CA3AF" />
                  </View>
                  <Text style={styles.enhancedEmptyPostsTitle}>No posts yet</Text>
                  <Text style={styles.enhancedEmptyPostsSubtitle}>When {profile?.name || 'this user'} shares photos and videos, you'll see them here.</Text>
                </LinearGradient>
              </View>
            )}
          </LinearGradient>
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
                  <Text style={styles.modalTitle}>No follow requests</Text>
                  <Text style={styles.emptySubtitle}>You don't have any pending follow requests</Text>
                </View>
              ) : (
                <FlatList
                  data={followRequests}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={styles.followRequestItem}>
                      <Text style={styles.followRequestText}>{item.sender?.name || 'Unknown User'}</Text>
                    </View>
                  )}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.followRequestItem}
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
    backgroundColor: '#fff',
  },
  // Clean Profile Section
  cleanProfileSection: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  compactStatsSection: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  cleanActionSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  cleanActionButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cleanActionButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Posts Section
  postsSection: {
    backgroundColor: '#fff',
    paddingTop: 20,
  },
  postsList: {
    paddingHorizontal: 16,
  },
  postCard: {
    backgroundColor: '#fff',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  postAuthorSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAuthorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    overflow: 'hidden',
  },
  postAuthorAvatarImage: {
    width: '100%',
    height: '100%',
  },
  postAuthorAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postAuthorAvatarInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  postAuthorInfo: {
    flex: 1,
  },
  postAuthorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  postTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  postMoreButton: {
    padding: 8,
  },
  postContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  postContent: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  postImageContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  postActionButton: {
    padding: 8,
    marginRight: 16,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  postLikes: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginRight: 16,
  },
  postComments: {
    fontSize: 14,
    color: '#666',
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
  },
  postGridItem: {
    width: '33.333%',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: '#fff',
  },
  postGridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
  },
  postGridPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Enhanced Profile Section
  enhancedProfileSection: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  profileGradient: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  profileAvatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 4,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Enhanced Stats Section
  enhancedStatsSection: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  // Enhanced Bio Section
  enhancedBioSection: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  bioIconGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bioTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  // Enhanced Action Section
  enhancedActionSection: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  enhancedFollowButtonWrapper: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
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
  enhancedFollowButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  enhancedMessageButtonWrapper: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
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
  enhancedMessageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Enhanced Posts Section
  enhancedPostsSection: {
    backgroundColor: '#fff',
    marginTop: 16,
  },
  enhancedNavigationTabs: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: '#dbdbdb',
    backgroundColor: '#fff',
    paddingVertical: 8,
  },
  enhancedTabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  tabIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },
  tabLabelInactive: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8e8e93',
  },
  // Instagram-Style Navigation Tabs
  navigationTabs: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: '#dbdbdb',
    backgroundColor: '#fff',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  // Enhanced Posts List
  enhancedPostsList: {
    backgroundColor: '#fff',
  },
  enhancedPostCard: {
    backgroundColor: '#fff',
    marginBottom: 8,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  // Enhanced Post Header Styles
  enhancedPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  postAuthorAvatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 2,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButtonGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Enhanced Post Content Styles
  enhancedPostContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  enhancedPostContent: {
    fontSize: 15,
    color: '#000',
    lineHeight: 22,
    fontWeight: '400',
  },
  // Enhanced Post Image Styles
  enhancedPostImageContainer: {
    backgroundColor: '#fff',
    position: 'relative',
  },
  enhancedPostImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // Enhanced Post Actions Styles
  enhancedPostActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  enhancedPostActionButton: {
    padding: 4,
  },
  actionIconGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Enhanced Post Stats Styles
  enhancedPostStats: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  enhancedPostLikes: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  enhancedPostComments: {
    fontSize: 15,
    color: '#8e8e93',
  },
  // Enhanced Empty Posts State
  enhancedEmptyPostsContainer: {
    alignItems: 'center',
    padding: 40,
    marginHorizontal: 16,
  },
  enhancedEmptyPostsCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    width: '100%',
  },
  emptyPostsIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  enhancedEmptyPostsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  enhancedEmptyPostsSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyPostsAction: {
    marginTop: 8,
  },
  followUserButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  followUserButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  followUserButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Post Header Styles
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  postAuthorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  postAuthorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
  },
  postAuthorAvatarImage: {
    width: '100%',
    height: '100%',
  },
  postAuthorAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0095f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postAuthorAvatarInitials: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  postAuthorInfo: {
    flex: 1,
  },
  postAuthorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  postTime: {
    fontSize: 12,
    color: '#8e8e93',
  },
  postMoreButton: {
    padding: 4,
  },
  // Post Content Styles
  postContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  postContent: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  // Post Image Styles
  postImageContainer: {
    backgroundColor: '#fff',
  },
  postImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
  },
  // Post Actions Styles
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 16,
  },
  postActionButton: {
    padding: 4,
  },
  // Post Stats Styles
  postStats: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  postLikes: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  postComments: {
    fontSize: 14,
    color: '#8e8e93',
  },
  scrollView: {
    flex: 1,
  },
  // Enhanced Loading States
  enhancedLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enhancedLoadingGradient: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  enhancedLoadingText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtext: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Enhanced Error States
  enhancedErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enhancedErrorGradient: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorIconContainer: {
    marginBottom: 24,
  },
  enhancedErrorTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  enhancedErrorText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  enhancedRetryButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  enhancedRetryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  },
  profileAvatarContainer: {
    marginRight: 16,
  },
  profileAvatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    overflow: 'hidden',
  },
  profileDetails: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
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
    color: '#666',
    marginLeft: 8,
  },
  // About Section
  aboutSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 14,
    color: '#8e8e93',
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
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
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
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    borderWidth: 1,
    borderColor: '#dbdbdb',
  },
  followButton: {
    backgroundColor: '#0095f6',
    borderColor: '#0095f6',
  },
  unfollowButton: {
    backgroundColor: '#fff',
    borderColor: '#dbdbdb',
  },
  pendingButton: {
    backgroundColor: '#fff',
    borderColor: '#dbdbdb',
  },
  messageButton: {
    backgroundColor: '#fff',
    borderColor: '#dbdbdb',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
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

  enhancedProfileSection: {
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  profileCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  enhancedAvatarImage: {
    width: 92,
    height: 92,
    borderRadius: 46,
  },
  enhancedAvatarPlaceholder: {
    width: 92,
    height: 92,
    borderRadius: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enhancedAvatarInitials: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: '#fff',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  enhancedProfileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginRight: 8,
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  enhancedProfileHandle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  profileBio: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  enhancedStatsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statsCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  enhancedStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  enhancedStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  enhancedStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  enhancedStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  enhancedActionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  enhancedFollowButtonWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  enhancedFollowButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  enhancedFollowButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  enhancedMessageButtonWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  enhancedMessageButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  enhancedMessageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  moreOptionsButton: {
    width: 48,
    borderRadius: 12,
    overflow: 'hidden',
  },
  moreOptionsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  enhancedPostsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  postsCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  postsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  postsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postsIconGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  postsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  postsCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  enhancedPostsList: {
    gap: 12,
  },
  enhancedPostCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  postCardGradient: {
    padding: 16,
  },
  enhancedPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  enhancedPostAuthorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  enhancedPostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    overflow: 'hidden',
  },
  enhancedPostAvatarImage: {
    width: '100%',
    height: '100%',
  },
  enhancedPostAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  enhancedPostAvatarInitials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  enhancedPostAuthorInfo: {
    flex: 1,
  },
  enhancedPostAuthorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  enhancedPostTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  enhancedPostMoreButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
  },
  enhancedPostContentContainer: {
    marginBottom: 12,
  },
  enhancedPostContent: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  enhancedPostImageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  enhancedPostImage: {
    width: '100%',
    height: 200,
  },
  enhancedPostActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  enhancedPostActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    paddingVertical: 4,
  },
  postActionIconGradient: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  enhancedPostActionText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  enhancedLoadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  enhancedLoadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    fontWeight: '500',
  },
  enhancedEmptyPostsContainer: {
    paddingVertical: 40,
  },
  enhancedEmptyPostsCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  enhancedEmptyPostsIcon: {
    marginBottom: 16,
  },
  enhancedEmptyPostsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  enhancedEmptyPostsSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 