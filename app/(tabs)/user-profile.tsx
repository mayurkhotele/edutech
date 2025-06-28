import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
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
  const { userId } = route.params as { userId: string };
  const navigation = useNavigation<any>();
  
  const [profile, setProfile] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetchAuth(`/student/profile?userId=${userId}`, user?.token || '');
      if (res.ok) {
        setProfile(res.data);
        setIsFollowing(res.data.isFollowing || false);
      } else {
        setError('Failed to load profile');
      }
    } catch (e) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    setPostsLoading(true);
    try {
      const res = await apiFetchAuth('/student/posts', user?.token || '');
      if (res.ok) {
        // Filter posts to only show posts by the specific user
        const filteredPosts = res.data.filter((post: any) => post.authorId === userId);
        setUserPosts(filteredPosts);
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

  const handleFollow = async () => {
    // If already following, show confirmation dialog for unfollowing
    if (isFollowing) {
      Alert.alert(
        'Unfollow User',
        `Are you sure you want to unfollow ${profile.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Unfollow', style: 'destructive', onPress: performFollowAction },
        ]
      );
    } else {
      // If not following, directly perform follow action
      performFollowAction();
    }
  };

  const performFollowAction = async () => {
    try {
      let res;
      
      if (isFollowing) {
        // Unfollow: DELETE request with userId as query parameter
        res = await apiFetchAuth(`/student/follow?userId=${userId}`, user?.token || '', {
          method: 'DELETE',
        });
      } else {
        // Follow: POST request with userId in body
        res = await apiFetchAuth('/student/follow', user?.token || '', {
          method: 'POST',
          body: { targetUserId: userId },
        });
      }
      
      if (res.ok) {
        // Toggle the following status
        setIsFollowing(!isFollowing);
        // Refresh the profile to update follower count
        fetchUserProfile();
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
    }
  };

  const handleMessageUser = async () => {
    try {
      const res = await apiFetchAuth(`/student/messages?user=${userId}`, user?.token || '');
      if (res.ok) {
        // Navigate to chat screen with user information
        navigation.navigate('chat', { 
          userId: userId, 
          userName: profile.name,
          messages: res.data || []
        });
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
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
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={['#667eea']}
          tintColor="#667eea"
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Clean Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {profile.profilePhoto ? (
              <Image source={{ uri: profile.profilePhoto }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{getInitials(profile.name)}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.email}>{profile.email}</Text>
            {(profile.course || profile.year) && (
              <View style={styles.courseInfo}>
                <Ionicons name="school-outline" size={16} color="#667eea" />
                <Text style={styles.courseText}>{[profile.course, profile.year].filter(Boolean).join(' • ')}</Text>
              </View>
            )}
          </View>
        </View>

        {profile.bio && (
          <View style={styles.bioSection}>
            <Text style={styles.bio}>{profile.bio}</Text>
          </View>
        )}

        {/* Clean Stats */}
        <View style={styles.statsSection}>
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

        {/* Clean Action Buttons */}
        <View style={styles.actionSection}>
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={[styles.followButton, isFollowing && styles.unfollowButton]} 
              activeOpacity={0.8} 
              onPress={handleFollow}
            >
              <Ionicons 
                name={isFollowing ? "person-remove-outline" : "person-add-outline"} 
                size={20} 
                color="#fff" 
              />
              <Text style={styles.followButtonText}>
                {isFollowing ? 'Unfollow' : 'Follow'}
              </Text>
            </TouchableOpacity>
            
            {/* Message Button - Only show if following the user */}
            {isFollowing && (
              <TouchableOpacity 
                style={styles.messageButton}
                onPress={handleMessageUser}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubble-outline" size={20} color="#fff" />
                <Text style={styles.messageButtonText}>Message</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Clean Posts Section */}
      <View style={styles.postsSection}>
        <View style={styles.postsHeader}>
          <Text style={styles.postsTitle}>Posts</Text>
          <Text style={styles.postsCount}>{userPosts.length} posts</Text>
        </View>

        {postsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Loading posts...</Text>
          </View>
        ) : userPosts.length > 0 ? (
          <FlatList
            data={userPosts}
            keyExtractor={(item) => item.id}
            renderItem={renderUserPost}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="create-outline" size={48} color="#ccc" />
            </View>
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptySubtitle}>This user hasn't shared any posts yet</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
}); 