import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, KeyboardAvoidingView, Modal, Platform, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { apiFetchAuth, getImageUrl } from '../constants/api';
import { useAuth } from '../context/AuthContext';
import AddStory from './AddStory';
import StoryViewer from './StoryViewer';

const { width } = Dimensions.get('window');

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
}

interface SocialFeedProps {
  refreshTrigger?: number;
  navigation?: any; // Using any for now to handle different navigation types
}

export default function SocialFeed({ refreshTrigger, navigation }: SocialFeedProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Search functionality states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  // Comment modal state
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // Add Story modal state
  const [addStoryVisible, setAddStoryVisible] = useState(false);

  // Story viewer state
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [stories, setStories] = useState<any[]>([
    // Test story to see if rendering works
    { 
      id: 'add-story', 
      username: 'Your Story', 
      image: require('../assets/images/avatar1.jpg'), 
      hasStory: false, 
      isAdd: true
    }
  ]);

  // Follow requests state
  const [followRequests, setFollowRequests] = useState<any[]>([]);
  const [showFollowRequests, setShowFollowRequests] = useState(false);
  const [followRequestsLoading, setFollowRequestsLoading] = useState(false);

  useEffect(() => {
    fetchPosts();
    fetchStories();
    fetchFollowRequests(); // Fetch follow requests on mount
  }, []);

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      resetAndFetchPosts();
      fetchStories();
    }
  }, [refreshTrigger]);

  // Refresh every time the screen comes into focus (with throttling)
  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      // Only refresh if it's been more than 30 seconds since last refresh
      if (now - lastRefresh > 30000) {
        resetAndFetchPosts();
        fetchStories();
        setLastRefresh(now);
      }
    }, [user?.token, lastRefresh])
  );
  
  // Debug state changes
  useEffect(() => {
    console.log('🔍 State changed - searchResults:', searchResults);
    console.log('🔍 State changed - showSearchResults:', showSearchResults);
    console.log('🔍 State changed - searching:', searching);
  }, [searchResults, showSearchResults, searching]);
  
  // Debug state changes
  useEffect(() => {
    console.log('🔍 State changed - searchResults:', searchResults);
    console.log('🔍 State changed - showSearchResults:', showSearchResults);
    console.log('🔍 State changed - searching:', searching);
  }, [searchResults, showSearchResults, searching]);

  const resetAndFetchPosts = () => {
    setPage(1);
    setHasMorePosts(true);
    setPosts([]);
    fetchPosts(true);
  };

  const fetchPosts = async (isRefresh = false) => {
    if (isRefresh) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    setError('');
    try {
      // Use pagination parameters
      const res = await apiFetchAuth(`/student/posts?page=${page}&limit=10`, user?.token || '');
      if (res.ok) {
        const newPosts = res.data.posts || res.data; // Handle different API response formats
        
        // Check if we have more posts
        if (newPosts.length < 10) {
          setHasMorePosts(false);
        }
        
        if (isRefresh) {
          setPosts(newPosts);
        } else {
          setPosts(prev => [...prev, ...newPosts]);
        }
      } else {
        setError('Failed to load posts');
      }
    } catch (e) {
      setError('Failed to load posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMorePosts = () => {
    if (!loadingMore && hasMorePosts) {
      setPage(prev => prev + 1);
      fetchPosts();
    }
  };

  const fetchStories = async () => {
    try {
      const response = await apiFetchAuth('/student/stories?limit=20', user?.token || '');
      
      if (response.ok) {
        // Transform the API response structure
        const storiesArray = [
          { 
            id: 'add-story', 
            username: 'Your Story', 
            image: require('../assets/images/avatar1.jpg'), 
            hasStory: false, 
            isAdd: true 
          }
        ];

        // Process each user's stories (limit to first 20 users for performance)
        const limitedUserData = response.data.slice(0, 20);
        limitedUserData.forEach((userData: any) => {
          if (userData.user && userData.stories && userData.stories.length > 0) {
            storiesArray.push({
              id: userData.user.id,
              username: userData.user.name,
              image: userData.user.profilePhoto ? getImageUrl(userData.user.profilePhoto) : require('../assets/images/avatar1.jpg'),
              hasStory: true,
              stories: userData.stories.map((story: any) => ({
                ...story,
                isLiked: story.isLiked || false,
                likeCount: story.likeCount || 0
              }))
            } as any);
          }
        });

        setStories(storiesArray);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([resetAndFetchPosts(), fetchStories()]);
    setRefreshing(false);
  };

  // Comment modal handlers
  const openComments = async (post: any) => {
    setSelectedPost(post);
    setCommentModalVisible(true);
    setCommentsLoading(true);
    setComments([]);
    try {
      const res = await apiFetchAuth(`/student/posts/${post.id}/comments`, user?.token || '');
      if (res.ok) {
        setComments(res.data);
      } else {
        setComments([]);
      }
    } catch (e) {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const closeComments = () => {
    setCommentModalVisible(false);
    setSelectedPost(null);
    setComments([]);
    setNewComment('');
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPost) return;
    setPostingComment(true);
    try {
      const res = await apiFetchAuth(`/student/posts/${selectedPost.id}/comments`, user?.token || '', {
        method: 'POST',
        body: { content: newComment.trim() },
      });
      if (res.ok) {
        // Add the new comment to the comments list
        setComments((prev) => [res.data, ...prev]);
        
        // Update the post's comment count in the main posts list
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post.id === selectedPost.id) {
              return {
                ...post,
                _count: {
                  ...post._count,
                  comments: (post._count?.comments || 0) + 1
                }
              };
            }
            return post;
          })
        );
        
        setNewComment('');
      }
    } catch (e) {
      console.error('Error adding comment:', e);
      // Optionally show error message to user
    } finally {
      setPostingComment(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const res = await apiFetchAuth(`/student/posts/${postId}/like`, user?.token || '', {
        method: 'POST',
      });
      
      if (res.ok) {
        // Update the post's like status in the local state
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                isLiked: res.data.liked,
                _count: {
                  ...post._count,
                  likes: res.data.liked 
                    ? (post._count?.likes || 0) + 1 
                    : Math.max((post._count?.likes || 0) - 1, 0)
                }
              };
            }
            return post;
          })
        );
      }
    } catch (error) {
      console.error('Error liking post:', error);
      // Optionally show error message to user
    }
  };

  const handleFollowUser = async (postId: string, authorId: string) => {
    try {
      const response = await apiFetchAuth('/student/follow', user?.token || '', {
        method: 'POST',
        body: { targetUserId: authorId },
      });

      if (response.ok) {
        // Update the post's author follow status
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                author: {
                  ...post.author,
                  isFollowing: !post.author?.isFollowing,
                  followRequestStatus: response.data.followRequestStatus // Update followRequestStatus
                }
              };
            }
            return post;
          })
        );
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleMessageUser = async (authorId: string, authorName: string) => {
    try {
      const res = await apiFetchAuth(`/student/messages/${authorId}`, user?.token || '');
      if (res.ok) {
        // Navigate to chat screen with user information
        if (navigation) {
          navigation.navigate('chat', { 
            userId: authorId, 
            userName: authorName,
            messages: res.data || []
          });
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleAddStory = () => {
    setAddStoryVisible(true);
  };

  const handleStoryCreated = () => {
    // Refresh the feed when a new story is created
    fetchPosts();
    fetchStories();
  };

  const handleStoryPress = (storyIndex: number) => {
    const selectedStory = stories[storyIndex];
    if (selectedStory && !selectedStory.isAdd && selectedStory.stories && selectedStory.stories.length > 0) {
      setSelectedStoryIndex(storyIndex);
      setStoryViewerVisible(true);
    } else {
      console.log('No stories available for this user');
    }
  };

  // Search functionality
  const handleSearch = async (query: string) => {
    console.log('🔍 Search query:', query);
    setSearchQuery(query);
    
    if (query.trim().length === 0) {
      // If no query, hide search results
      console.log('🔍 No query, hiding search results...');
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    if (query.trim().length < 2) {
      console.log('🔍 Query too short, clearing results');
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearching(true);
    try {
      console.log('🔍 Making API call to search...');
      const response = await apiFetchAuth(`/student/search?q=${encodeURIComponent(query)}`, user?.token || '');
      console.log('🔍 Search API response:', response);
      
      if (response.ok) {
        const users = response.data.users || [];
        console.log('🔍 Found users:', users);
        
        // Enhanced filtering to remove unwanted results
        const validUsers = users.filter((searchUser: any) => {
          // Basic validation
          if (!searchUser || !searchUser.id || !searchUser.name) {
            console.log('🔍 Filtering out user with missing data:', searchUser);
            return false;
          }
          
          // Filter out current user (fix the variable reference)
          if (searchUser.id === user?.id) {
            console.log('🔍 Filtering out current user:', searchUser.name);
            return false;
          }
          
          // Filter out users with incomplete profiles
          if (!searchUser.email || !searchUser.name.trim()) {
            console.log('🔍 Filtering out incomplete profile:', searchUser);
            return false;
          }
          
          // Only filter out obvious test/dummy accounts (very minimal filtering)
          const email = searchUser.email.toLowerCase();
          const unwantedPatterns = [
            'test@test', 'demo@demo', 'admin@admin', 'fake@fake'
          ];
          
          const isUnwanted = unwantedPatterns.some(pattern => 
            email.includes(pattern)
          );
          
          if (isUnwanted) {
            console.log('🔍 Filtering out test account:', searchUser.email);
            return false;
          }
          
          console.log('🔍 Valid user:', searchUser.name, searchUser.email);
          return true;
        });
        
        console.log('🔍 Valid users after enhanced filtering:', validUsers);
        
        setSearchResults(validUsers);
        setShowSearchResults(true);
      } else {
        console.log('🔍 Search API error:', response);
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('🔍 Search error:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setSearching(false);
    }
  };

  // Fetch all users for initial display - REMOVED to prevent unwanted results
  const fetchAllUsers = async () => {
    // Don't show all users by default - only show when searching
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleUserPress = (searchUser: any) => {
    console.log('🚀 handleUserPress called with:', searchUser);
    
    // Navigate to user profile using expo-router
    if (searchUser && searchUser.id) {
      console.log('🔍 Navigating to user profile:', searchUser);
      console.log('🔍 User ID:', searchUser.id);
      console.log('🔍 User Name:', searchUser.name);
      console.log('🔍 Router object:', router);
      console.log('🔍 Navigation object:', navigation);
      
      try {
        console.log('🚀 Attempting expo-router navigation...');
        // Use expo-router for navigation
        router.push({
          pathname: '/user-profile',
          params: { 
            userId: searchUser.id,
            originalUserData: searchUser
          }
        });
        
        console.log('✅ Navigation successful using expo-router');
        setShowSearchResults(false);
        setSearchQuery('');
      } catch (error) {
        console.error('❌ Navigation error:', error);
        
        // Fallback: try navigation prop if available
        if (navigation) {
          try {
            console.log('🚀 Attempting fallback navigation...');
            navigation.navigate('user-profile' as never, { 
              userId: searchUser.id,
              originalUserData: searchUser
            } as never);
            console.log('✅ Fallback navigation successful');
            setShowSearchResults(false);
            setSearchQuery('');
          } catch (fallbackError) {
            console.error('❌ Fallback navigation also failed:', fallbackError);
            alert('Navigation failed. Please try again.');
          }
        } else {
          console.log('❌ No navigation object available');
          alert('Navigation failed. Please try again.');
        }
      }
    } else {
      console.log('❌ Invalid user data');
      console.log('Search user:', searchUser);
      alert('Cannot navigate: Invalid user data');
    }
  };

  // Hide search results when scrolling
  const handleScroll = () => {
    if (showSearchResults) {
      setShowSearchResults(false);
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
      const response = await apiFetchAuth(`/student/follow-requests/${requestId}/accept`, user?.token || '', {
        method: 'POST',
      });
      
      if (response.ok) {
        // Remove the accepted request from the list
        setFollowRequests(prev => prev.filter(req => req.id !== requestId));
        // Optionally refresh posts to update follow status
        fetchPosts();
      }
    } catch (error) {
      console.error('Error accepting follow request:', error);
    }
  };

  // Reject follow request
  const handleRejectFollowRequest = async (requestId: string) => {
    try {
      const response = await apiFetchAuth(`/student/follow-requests/${requestId}/reject`, user?.token || '', {
        method: 'POST',
      });
      
      if (response.ok) {
        // Remove the rejected request from the list
        setFollowRequests(prev => prev.filter(req => req.id !== requestId));
      }
    } catch (error) {
      console.error('Error rejecting follow request:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <Text style={styles.errorTitle}>Unable to load posts</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={resetAndFetchPosts}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#667eea" />
        <Text style={styles.loadingFooterText}>Loading more posts...</Text>
      </View>
    );
  };

    const renderSearchResult = ({ item }: { item: any }) => {
    // Validate that the item has required properties
    if (!item || !item.id || !item.name) {
      return null;
    }
    
    const handleItemPress = () => {
      if (item && item.id) {
        handleUserPress(item);
      }
    };
    
    return (
      <TouchableOpacity 
        style={styles.enhancedSearchResultItem}
        onPress={handleItemPress}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.9)', 'rgba(248,250,252,0.9)']}
          style={styles.searchResultGradient}
        >
          {/* Avatar Section */}
          <View style={styles.enhancedSearchAvatar}>
            {item.profilePhoto ? (
              <Image source={{ uri: item.profilePhoto }} style={styles.enhancedAvatarImage} />
            ) : (
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.enhancedAvatarPlaceholder}
              >
                <Text style={styles.enhancedAvatarInitials}>
                  {item.name ? item.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                </Text>
              </LinearGradient>
            )}
            
            {/* Online Status Indicator */}
            <View style={styles.onlineStatusIndicator} />
          </View>
          
          {/* User Info Section */}
          <View style={styles.enhancedSearchInfo}>
            <View style={styles.userNameContainer}>
              <Text style={styles.enhancedSearchName}>{item.name}</Text>
              {item.isFollowedBack && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                </View>
              )}
            </View>
            
            <Text style={styles.enhancedSearchEmail}>{item.email}</Text>
            
            {(item.course || item.year) && (
              <View style={styles.enhancedCourseContainer}>
                <LinearGradient
                  colors={['#F3F4F6', '#E5E7EB']}
                  style={styles.courseTagGradient}
                >
                  <Ionicons name="school-outline" size={12} color="#6B7280" />
                  <Text style={styles.enhancedCourseText}>
                    {[item.course, item.year].filter(Boolean).join(' • ')}
                  </Text>
                </LinearGradient>
              </View>
            )}
          </View>
          
          {/* Action Section */}
          <View style={styles.enhancedSearchActions}>
            {item.isFollowing ? (
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.enhancedFollowingBadge}
              >
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={styles.enhancedFollowingText}>Following</Text>
              </LinearGradient>
            ) : (
              <TouchableOpacity 
                style={styles.enhancedFollowButton}
                onPress={(e) => {
                  e.stopPropagation();
                  // Handle follow action
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  style={styles.followButtonGradient}
                >
                  <Ionicons name="person-add-outline" size={16} color="#fff" />
                  <Text style={styles.followButtonText}>Follow</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderPost = ({ item }: { item: any }) => (
    <View style={styles.instagramPostCard}>
      {/* Instagram-Style Header */}
      <View style={styles.instagramPostHeader}>
        <TouchableOpacity 
          style={styles.authorSection} 
          onPress={() => {
            if (navigation && item.author?.id) {
              navigation.navigate('user-profile', { userId: item.author.id });
            }
          }}
          activeOpacity={0.7}
        >
          <View style={styles.instagramAvatarContainer}>
            <Image
              source={item.author?.profilePhoto ? { uri: item.author.profilePhoto } : require('../assets/images/avatar1.jpg')}
              style={styles.instagramAvatar}
            />
          </View>
          <View style={styles.authorInfo}>
            <Text style={styles.instagramAuthorName}>{item.author?.name || 'Unknown'}</Text>
            <Text style={styles.instagramPostLocation}>{timeAgo(item.createdAt)}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.postActions}>
          {/* Follow Button - Only show if not current user */}
          {item.author?.id !== user?.id && (
            <TouchableOpacity
              style={[
                styles.followButton, 
                item.author?.isFollowing && styles.unfollowButton,
                item.author?.followRequestStatus === 'PENDING' && styles.pendingRequestButton
              ]}
              onPress={() => handleFollowUser(
                item.id, 
                item.author?.id || ''
              )}
            >
              <Ionicons 
                name={
                  item.author?.isFollowing ? "person-remove-outline" : 
                  item.author?.followRequestStatus === 'PENDING' ? "time-outline" : 
                  "person-add-outline"
                } 
                size={16} 
                color="#fff" 
              />
              <Text style={styles.followButtonText}>
                {item.author?.isFollowing ? 'Unfollow' : 
                 item.author?.followRequestStatus === 'PENDING' ? 'Request Sent' : 
                 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
          
          {item.isPrivate && (
            <View style={styles.privacyIndicator}>
              <Ionicons name="lock-closed" size={14} color="#667eea" />
            </View>
          )}
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </View>

             {/* Instagram-Style Content */}
       <Text style={styles.instagramPostContent}>{item.content}</Text>

       {/* Instagram-Style Media */}
       {item.imageUrl && (
         <View style={styles.instagramMediaContainer}>
           <Image source={{ uri: item.imageUrl }} style={styles.instagramMediaImage} resizeMode="cover" />
         </View>
       )}

       {item.videoUrl && (
         <View style={styles.instagramVideoContainer}>
           <View style={styles.instagramVideoPlaceholder}>
             <Ionicons name="play-circle" size={48} color="#fff" />
           </View>
         </View>
       )}

       {/* Instagram-Style Hashtags */}
       {item.hashtags && item.hashtags.length > 0 && (
         <View style={styles.instagramHashtagsContainer}>
           {item.hashtags.map((tag: string) => (
             <Text key={tag} style={styles.instagramHashtagText}>#{tag}</Text>
           ))}
         </View>
       )}

       {/* Instagram-Style Action Bar */}
       <View style={styles.instagramActionsBar}>
         <View style={styles.instagramActionLeft}>
           <TouchableOpacity style={styles.instagramActionButton} onPress={() => handleLikePost(item.id)}>
             <Ionicons 
               name={item.isLiked ? 'heart' : 'heart-outline'} 
               size={28} 
               color={item.isLiked ? '#ed4956' : '#262626'} 
             />
           </TouchableOpacity>
           
           <TouchableOpacity style={styles.instagramActionButton} onPress={() => openComments(item)}>
             <Ionicons name="chatbubble-outline" size={28} color="#262626" />
           </TouchableOpacity>
           
           <TouchableOpacity style={styles.instagramActionButton}>
             <Ionicons name="paper-plane-outline" size={28} color="#262626" />
           </TouchableOpacity>
         </View>
         
         <TouchableOpacity style={styles.instagramBookmarkButton}>
           <Ionicons name="bookmark-outline" size={28} color="#262626" />
         </TouchableOpacity>
       </View>

       {/* Instagram-Style Likes Count */}
       <View style={styles.instagramLikesContainer}>
         <Text style={styles.instagramLikesText}>
           <Text style={styles.instagramLikesBold}>{item._count?.likes || 0} likes</Text>
         </Text>
       </View>

       {/* Instagram-Style Comments Preview */}
       <View style={styles.instagramCommentsContainer}>
         <Text style={styles.instagramCommentsText}>
           <Text style={styles.instagramCommentsBold}>{item.author?.name}</Text> {item.content}
         </Text>
         {item._count?.comments > 0 && (
           <TouchableOpacity onPress={() => openComments(item)}>
             <Text style={styles.instagramViewCommentsText}>
               View all {item._count.comments} comments
             </Text>
           </TouchableOpacity>
         )}
       </View>
    </View>
  );

  const renderStories = () => {
    return (
      <View style={styles.enhancedStoriesContainer}>
        <LinearGradient
          colors={['rgba(255,255,255,0.95)', 'rgba(248,250,252,0.95)']}
          style={styles.storiesGradient}
        >
          <View style={styles.enhancedStoriesHeader}>
            <View style={styles.storiesTitleContainer}>
              <Ionicons name="sparkles" size={20} color="#667eea" />
              <Text style={styles.enhancedStoriesTitle}>Today's Stories</Text>
            </View>
            <TouchableOpacity style={styles.enhancedViewAllButton}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.viewAllButtonGradient}
              >
                <Text style={styles.enhancedViewAllText}>View All</Text>
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <FlatList
            data={stories}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.enhancedStoriesList}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => {
              return (
                <TouchableOpacity 
                  style={styles.enhancedStoryItem} 
                  activeOpacity={0.8}
                  onPress={() => item.isAdd ? handleAddStory() : handleStoryPress(index)}
                >
                  <View style={styles.enhancedStoryWrapper}>
                    <LinearGradient
                      colors={
                        item.isAdd ? ['#667eea', '#764ba2'] :
                        item.hasStory && !item.viewed ? ['#ff6b6b', '#ee5a52'] :
                        ['#e0e0e0', '#d0d0d0']
                      }
                      style={styles.enhancedStoryRing}
                    >
                      {typeof item.image === 'string' ? (
                        <Image source={{ uri: item.image }} style={styles.enhancedStoryImage} />
                      ) : (
                        <Image source={item.image} style={styles.enhancedStoryImage} />
                      )}
                      {item.isAdd && (
                        <View style={styles.enhancedAddStoryIcon}>
                          <Ionicons name="add" size={18} color="#fff" />
                        </View>
                      )}
                      {item.hasStory && !item.viewed && (
                        <View style={styles.enhancedStoryIndicator}>
                          <View style={styles.enhancedStoryDot} />
                        </View>
                      )}
                    </LinearGradient>
                    <View style={styles.enhancedStoryInfo}>
                      <Text style={styles.enhancedStoryUsername} numberOfLines={1}>
                        {item.username}
                      </Text>
                      {item.isAdd && (
                        <Text style={styles.enhancedAddStoryText}>Add Story</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </LinearGradient>
      </View>
    );
  };

  const renderFollowRequests = () => (
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
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          {followRequestsLoading ? (
            <View style={styles.loadingContainer}>
              <Text>Loading...</Text>
            </View>
          ) : followRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No pending follow requests</Text>
            </View>
          ) : (
            <FlatList
              data={followRequests}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.followRequestItem}>
                  <View style={styles.followRequestUser}>
                    <View style={styles.followRequestAvatar}>
                      {item.sender?.profilePhoto ? (
                        <Image 
                          source={{ uri: item.sender.profilePhoto }} 
                          style={styles.followRequestAvatarImage} 
                        />
                      ) : (
                        <View style={styles.followRequestAvatarPlaceholder}>
                          <Text style={styles.followRequestAvatarInitials}>
                            {item.sender?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.followRequestInfo}>
                      <Text style={styles.followRequestName}>{item.sender?.name || 'Unknown User'}</Text>
                      <Text style={styles.followRequestEmail}>{item.sender?.email || ''}</Text>
                    </View>
                  </View>
                  <View style={styles.followRequestActions}>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleAcceptFollowRequest(item.id, item.senderId)}
                    >
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleRejectFollowRequest(item.id)}
                    >
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      
      {/* Enhanced Header with Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb', '#f5576c']}
        style={styles.enhancedHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>✨ Social Feed</Text>
            <Text style={styles.headerSubtitle}>Connect with your community</Text>
          </View>
          <View style={styles.headerRight}>
            {/* Follow Requests Button */}
            <TouchableOpacity 
              style={styles.followRequestsButton}
              onPress={() => {
                console.log('🔍 Follow requests button clicked!');
                // Navigate to dedicated follow requests page
                if (navigation) {
                  navigation.navigate('follow-requests' as never);
                } else {
                  router.push('/follow-requests');
                }
              }}
            >
              <Ionicons name="people-outline" size={24} color="#fff" />
              {followRequests.length > 0 && (
                <View style={styles.followRequestsBadge}>
                  <Text style={styles.followRequestsBadgeText}>{followRequests.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            
            {/* Notification Button */}
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Enhanced Search Bar */}
      <View style={styles.enhancedSearchContainer}>
        <LinearGradient
          colors={['rgba(255,255,255,0.9)', 'rgba(248,250,252,0.9)']}
          style={styles.searchBarGradient}
        >
          <View style={styles.searchContent}>
            <View style={styles.searchIconContainer}>
              <Ionicons name="search" size={20} color="#667eea" />
            </View>
            <TextInput
              style={styles.enhancedSearchInput}
              placeholder="🔍 Search users, posts, hashtags..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={handleSearch}
              onFocus={() => {
                console.log('🔍 Search bar focused');
              }}
              onBlur={() => {
                setTimeout(() => {
                  setShowSearchResults(false);
                }, 200);
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                style={styles.clearSearchButton}
                onPress={() => {
                  console.log('🔍 Clear button pressed, clearing search...');
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowSearchResults(false);
                }}
              >
                <Ionicons name="close-circle" size={20} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </View>

      {/* Enhanced Search Results */}
      {showSearchResults && (
        <View style={styles.enhancedSearchResultsContainer}>
          <LinearGradient
            colors={['#fff', '#f8f9fa']}
            style={styles.searchResultsGradient}
          >

            
            {searching ? (
              <View style={styles.searchLoadingContainer}>
                <ActivityIndicator size="small" color="#667eea" />
                <Text style={styles.searchLoadingText}>Searching...</Text>
              </View>
                                     ) : searchResults.length > 0 ? (
               <View>
                 
                 
                 
                 
                 
                 
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.id}
                  renderItem={renderSearchResult}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.searchResultsList}
                  onLayout={() => console.log('🔍 FlatList onLayout called')}
                  onContentSizeChange={() => console.log('🔍 FlatList onContentSizeChange called')}
                />
               </View>
            ) : searchQuery.trim().length >= 2 ? (
              <View style={styles.noSearchResultsContainer}>
                <Ionicons name="search-outline" size={48} color="#ccc" />
                <Text style={styles.noSearchResultsText}>No results found</Text>
                <Text style={styles.noSearchResultsSubtext}>Try different keywords or check spelling</Text>
              </View>
            ) : searchQuery.trim().length === 0 ? (
              <View style={styles.noSearchResultsContainer}>
                <Ionicons name="search-outline" size={48} color="#ccc" />
                <Text style={styles.noSearchResultsText}>Start typing to search users</Text>
                <Text style={styles.noSearchResultsSubtext}>Search by name, email, or course</Text>
              </View>
            ) : null}
          </LinearGradient>
        </View>
      )}

      {/* Enhanced Posts List */}
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#667eea']}
            tintColor="#667eea"
          />
        }
        ListHeaderComponent={renderStories}
        renderItem={renderPost}
        ListEmptyComponent={
          <View style={styles.enhancedEmptyContainer}>
            <LinearGradient
              colors={['#fff', '#f8f9fa']}
              style={styles.emptyCard}
            >
              <View style={styles.enhancedEmptyIcon}>
                <Ionicons name="chatbubbles-outline" size={64} color="#667eea" />
              </View>
              <Text style={styles.enhancedEmptyTitle}>No posts yet</Text>
              <Text style={styles.enhancedEmptySubtitle}>Be the first to share something with your community</Text>
              <TouchableOpacity 
                style={styles.createPostButton}
                onPress={() => navigation?.navigate('CreatePost')}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.createPostButtonGradient}
                >
                  <Ionicons name="create-outline" size={20} color="#fff" />
                  <Text style={styles.createPostButtonText}>Create Your First Post</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        }
        showsVerticalScrollIndicator={false}
        onEndReached={loadMorePosts}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />

      {/* Add Story Modal */}
      <AddStory
        visible={addStoryVisible}
        onClose={() => setAddStoryVisible(false)}
        onStoryCreated={handleStoryCreated}
      />

      {/* Story Viewer Modal */}
      <StoryViewer
        visible={storyViewerVisible}
        onClose={() => setStoryViewerVisible(false)}
        initialStoryIndex={0}
        stories={stories[selectedStoryIndex]?.stories || []}
      />

      {/* Professional Comment Modal */}
      <Modal
        visible={commentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeComments}
      >
        <View style={styles.commentModalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={closeComments} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              style={styles.commentsList}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <Image
                    source={item.user?.profilePhoto ? { uri: item.user.profilePhoto } : require('../assets/images/avatar1.jpg')}
                    style={styles.commentAvatar}
                  />
                  <View style={styles.commentContent}>
                    <Text style={styles.commentAuthor}>{item.user?.name || 'Unknown'}</Text>
                    <Text style={styles.commentText}>{item.content}</Text>
                    <Text style={styles.commentTime}>{timeAgo(item.createdAt)}</Text>
                  </View>
                </View>
              )}
            />
            
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.postCommentButton, !newComment.trim() && styles.postCommentButtonDisabled]}
                onPress={handleAddComment}
                disabled={!newComment.trim() || postingComment}
              >
                {postingComment ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.postCommentButtonText}>Post</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {renderFollowRequests()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  // Instagram-style header
  instagramHeader: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  headerSubtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  headerIconButton: {
    padding: 8,
    marginLeft: 12,
  },
  // Instagram-style search
  instagramSearchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  searchBarContainer: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dbdbdb',
  },
  searchIconContainer: {
    paddingHorizontal: 12,
  },
  instagramSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#262626',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  // Instagram-style stories
  instagramStoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  // Instagram-style posts
  instagramPostCard: {
    backgroundColor: '#fff',
    marginBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  instagramPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  instagramAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#dbdbdb',
  },
  instagramAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  instagramAuthorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 1,
  },
  instagramPostLocation: {
    fontSize: 12,
    color: '#8e8e93',
  },
  // Instagram-style post content
  instagramPostContent: {
    fontSize: 14,
    color: '#262626',
    lineHeight: 20,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  instagramMediaContainer: {
    width: '100%',
    height: 400,
  },
  instagramMediaImage: {
    width: '100%',
    height: '100%',
  },
  instagramVideoContainer: {
    width: '100%',
    height: 400,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instagramVideoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instagramHashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  instagramHashtagText: {
    color: '#00376b',
    fontSize: 14,
    marginRight: 8,
  },
  instagramActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  instagramActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instagramActionButton: {
    marginRight: 16,
    padding: 4,
  },
  instagramBookmarkButton: {
    padding: 4,
  },
  instagramLikesContainer: {
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  instagramLikesText: {
    fontSize: 14,
    color: '#262626',
  },
  instagramLikesBold: {
    fontWeight: '600',
  },
  instagramCommentsContainer: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  instagramCommentsText: {
    fontSize: 14,
    color: '#262626',
    lineHeight: 18,
  },
  instagramCommentsBold: {
    fontWeight: '600',
  },
  instagramViewCommentsText: {
    fontSize: 14,
    color: '#8e8e93',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingCard: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorCard: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
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
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postTime: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyIndicator: {
    marginRight: 8,
  },
  privacyIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButton: {
    padding: 4,
  },
  postContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  mediaContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f5f5f5',
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  hashtagChip: {
    backgroundColor: '#667eea',
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
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginHorizontal: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  statIcon: {
    marginRight: 6,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  postActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  shareButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 16,
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
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  noCommentsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noCommentsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    fontSize: 14,
    color: '#333',
    maxHeight: 100,
  },
  postCommentButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  postCommentButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  postCommentButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  storiesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  storiesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  storiesList: {
    flexDirection: 'row',
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 16,
  },
  storyWrapper: {
    alignItems: 'center',
  },
  storyRing: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    padding: 2.5,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addStoryRing: {
    backgroundColor: '#667eea',
    shadowColor: '#667eea',
    shadowOpacity: 0.3,
  },
  unviewedStoryRing: {
    backgroundColor: '#ff6b6b',
    shadowColor: '#ff6b6b',
    shadowOpacity: 0.3,
  },
  viewedStoryRing: {
    backgroundColor: '#e0e0e0',
  },
  storyImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  addStoryIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  storyInfo: {
    alignItems: 'center',
  },
  storyUsername: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    lineHeight: 16,
  },
  storyIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  storyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff6b6b',
  },
  addStoryText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#667eea',
    marginTop: 4,
    textAlign: 'center',
  },
  followButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  unfollowButton: {
    backgroundColor: '#ff6b6b',
  },
  messageButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4,
  },
  loadingFooter: {
    padding: 16,
    alignItems: 'center',
  },
  loadingFooterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
  },
  // Search Bar Styles
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
     searchInput: {
     flex: 1,
     fontSize: 14,
     color: '#374151',
     paddingVertical: 0,
   },
   // Enhanced Search Results Styles
   clearSearchButton: {
     padding: 5,
   },
   searchResultsContainer: {
     position: 'absolute',
     top: 70,
     left: 16,
     right: 16,
     backgroundColor: '#FFFFFF',
     borderRadius: 16,
     padding: 15,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 6 },
     shadowOpacity: 0.2,
     shadowRadius: 12,
     elevation: 8,
     zIndex: 9999,
     maxHeight: 400,
     borderWidth: 1,
     borderColor: 'rgba(139, 92, 246, 0.1)',
   },
   searchResultsList: {
     maxHeight: 300,
   },
   searchLoading: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     paddingVertical: 20,
   },
   searchLoadingText: {
     marginLeft: 8,
     color: '#8B5CF6',
     fontSize: 14,
     fontWeight: '500',
   },
   searchResultItem: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingVertical: 12,
     paddingHorizontal: 15,
     borderRadius: 12,
     marginBottom: 8,
     backgroundColor: '#F8FAFC',
     borderWidth: 1,
     borderColor: 'rgba(139, 92, 246, 0.08)',
   },
   searchResultAvatar: {
     width: 44,
     height: 44,
     borderRadius: 22,
     marginRight: 15,
     backgroundColor: '#E0E7FF',
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 2,
     borderColor: 'rgba(139, 92, 246, 0.1)',
   },
   searchResultAvatarImage: {
     width: 40,
     height: 40,
     borderRadius: 20,
   },
   searchResultAvatarPlaceholder: {
     width: 40,
     height: 40,
     borderRadius: 20,
     backgroundColor: '#E0E7FF',
     justifyContent: 'center',
     alignItems: 'center',
   },
   searchResultAvatarInitials: {
     fontSize: 18,
     fontWeight: 'bold',
     color: '#4F46E5',
   },
   searchResultInfo: {
     flex: 1,
   },
   searchResultName: {
     fontSize: 16,
     fontWeight: '600',
     color: '#1F2937',
     marginBottom: 4,
   },
   searchResultEmail: {
     fontSize: 13,
     color: '#6B7280',
     marginBottom: 4,
   },
   searchResultCourse: {
     flexDirection: 'row',
     alignItems: 'center',
   },
   searchResultCourseText: {
     fontSize: 12,
     color: '#6B7280',
     marginLeft: 6,
     fontWeight: '500',
   },
   searchResultActions: {
     flexDirection: 'row',
     alignItems: 'center',
   },
   followingBadge: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: '#ECFDF5',
     borderRadius: 16,
     paddingHorizontal: 12,
     paddingVertical: 6,
     borderWidth: 1,
     borderColor: 'rgba(16, 185, 129, 0.2)',
   },
   followingBadgeText: {
     fontSize: 12,
     color: '#10B981',
     fontWeight: '600',
     marginLeft: 6,
   },
   followButtonSmall: {
     padding: 8,
     backgroundColor: '#F3F4F6',
     borderRadius: 16,
     borderWidth: 1,
     borderColor: 'rgba(139, 92, 246, 0.2)',
   },
   // Enhanced Search Result Styles
   enhancedSearchResultItem: {
     marginBottom: 8,
     marginHorizontal: 12,
     borderRadius: 12,
     overflow: 'hidden',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.08,
     shadowRadius: 4,
     elevation: 2,
     borderWidth: 1,
     borderColor: 'rgba(102, 126, 234, 0.06)',
   },
   searchResultGradient: {
     flexDirection: 'row',
     alignItems: 'center',
     padding: 12,
     backgroundColor: 'transparent',
   },
   enhancedSearchAvatar: {
     position: 'relative',
     marginRight: 12,
   },
   enhancedAvatarImage: {
     width: 40,
     height: 40,
     borderRadius: 20,
     borderWidth: 2,
     borderColor: 'rgba(102, 126, 234, 0.2)',
   },
   enhancedAvatarPlaceholder: {
     width: 40,
     height: 40,
     borderRadius: 20,
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 2,
     borderColor: 'rgba(255, 255, 255, 0.3)',
   },
   enhancedAvatarInitials: {
     fontSize: 16,
     fontWeight: 'bold',
     color: '#fff',
   },
   onlineStatusIndicator: {
     position: 'absolute',
     bottom: 2,
     right: 2,
     width: 14,
     height: 14,
     borderRadius: 7,
     backgroundColor: '#10B981',
     borderWidth: 2,
     borderColor: '#fff',
   },
   enhancedSearchInfo: {
     flex: 1,
     paddingRight: 12,
   },
   userNameContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     marginBottom: 4,
   },
   enhancedSearchName: {
     fontSize: 14,
     fontWeight: '600',
     color: '#1F2937',
     marginRight: 6,
   },
   verifiedBadge: {
     marginLeft: 4,
   },
   enhancedSearchEmail: {
     fontSize: 12,
     color: '#6B7280',
     marginBottom: 4,
   },
   enhancedCourseContainer: {
     marginTop: 2,
   },
   courseTagGradient: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 6,
     paddingVertical: 3,
     borderRadius: 8,
     alignSelf: 'flex-start',
   },
   enhancedCourseText: {
     fontSize: 11,
     color: '#6B7280',
     fontWeight: '500',
     marginLeft: 3,
   },
   enhancedSearchActions: {
     alignItems: 'center',
   },
   enhancedFollowingBadge: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 8,
     paddingVertical: 4,
     borderRadius: 16,
   },
   enhancedFollowingText: {
     fontSize: 11,
     fontWeight: '600',
     color: '#fff',
     marginLeft: 3,
   },
   enhancedFollowButton: {
     borderRadius: 16,
     overflow: 'hidden',
   },
   followButtonGradient: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 12,
     paddingVertical: 6,
   },
   followButtonText: {
     fontSize: 11,
     fontWeight: '600',
     color: '#fff',
     marginLeft: 3,
   },
   noSearchResults: {
     alignItems: 'center',
     padding: 30,
   },
   noSearchResultsText: {
     fontSize: 16,
     color: '#6B7280',
     marginTop: 12,
     fontWeight: '500',
   },
   noSearchResultsSubtext: {
     fontSize: 14,
     color: '#9CA3AF',
     marginTop: 6,
     textAlign: 'center',
   },
  followRequestsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  followRequestsButtonText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  followRequestsModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  followRequestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  followRequestAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  followRequestAvatarInitials: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  followRequestInfo: {
    flex: 1,
  },
  followRequestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  followRequestEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  followRequestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#10B981',
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
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  pendingRequestButton: {
    backgroundColor: '#F59E0B', // Orange color for pending
  },
  enhancedHeader: {
    paddingTop: 50, // Adjust for status bar
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerGradient: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e0e0e0',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  followRequestsButton: {
    position: 'relative',
  },
  followRequestsBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff6b6b',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  followRequestsBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff6b6b',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  enhancedSearchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBarGradient: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  enhancedSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    paddingVertical: 0,
  },
  enhancedSearchResultsContainer: {
    position: 'absolute',
    top: 100, // Adjust based on header height
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9998,
    maxHeight: 400,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  searchResultsGradient: {
    borderRadius: 16,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  searchLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  searchLoadingText: {
    marginLeft: 8,
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '500',
  },
  noSearchResultsContainer: {
    alignItems: 'center',
    padding: 30,
  },
  enhancedEmptyContainer: {
    paddingVertical: 60,
  },
  enhancedEmptyIcon: {
    marginBottom: 16,
  },
  enhancedEmptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  enhancedEmptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  createPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  createPostButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  createPostButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Additional missing styles
  authorCourse: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4,
  },
  videoPlaceholder: {
    height: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  videoText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  likedText: {
    color: '#ff6b6b',
  },
  storiesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8f9ff',
    borderRadius: 20,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  commentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  commentsList: {
    padding: 16,
  },
  commentItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
     searchResultsList: {
     paddingBottom: 16,
   },
   // Enhanced Stories Styles
   enhancedStoriesContainer: {
     marginHorizontal: 16,
     marginVertical: 12,
     borderRadius: 20,
     overflow: 'hidden',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.1,
     shadowRadius: 12,
     elevation: 8,
   },
   storiesGradient: {
     padding: 20,
   },
   enhancedStoriesHeader: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     marginBottom: 16,
   },
   storiesTitleContainer: {
     flexDirection: 'row',
     alignItems: 'center',
   },
   enhancedStoriesTitle: {
     fontSize: 18,
     fontWeight: '700',
     color: '#1F2937',
     marginLeft: 8,
   },
   enhancedViewAllButton: {
     borderRadius: 20,
     overflow: 'hidden',
   },
   viewAllButtonGradient: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 16,
     paddingVertical: 8,
   },
   enhancedViewAllText: {
     fontSize: 14,
     fontWeight: '600',
     color: '#fff',
     marginRight: 4,
   },
   enhancedStoriesList: {
     paddingHorizontal: 4,
   },
   enhancedStoryItem: {
     alignItems: 'center',
     marginRight: 16,
   },
   enhancedStoryWrapper: {
     alignItems: 'center',
   },
   enhancedStoryRing: {
     width: 70,
     height: 70,
     borderRadius: 35,
     padding: 3,
     justifyContent: 'center',
     alignItems: 'center',
     marginBottom: 8,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.15,
     shadowRadius: 8,
     elevation: 6,
   },
   enhancedStoryImage: {
     width: 64,
     height: 64,
     borderRadius: 32,
   },
   enhancedAddStoryIcon: {
     position: 'absolute',
     bottom: 4,
     right: 4,
     width: 24,
     height: 24,
     borderRadius: 12,
     backgroundColor: '#667eea',
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 3,
     borderColor: '#fff',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.3,
     shadowRadius: 4,
     elevation: 4,
   },
   enhancedStoryIndicator: {
     position: 'absolute',
     top: 4,
     right: 4,
     width: 18,
     height: 18,
     borderRadius: 9,
     backgroundColor: '#fff',
     justifyContent: 'center',
     alignItems: 'center',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.3,
     shadowRadius: 4,
     elevation: 4,
   },
   enhancedStoryDot: {
     width: 10,
     height: 10,
     borderRadius: 5,
     backgroundColor: '#ff6b6b',
   },
   enhancedStoryInfo: {
     alignItems: 'center',
   },
   enhancedStoryUsername: {
     fontSize: 13,
     fontWeight: '600',
     color: '#1F2937',
     textAlign: 'center',
     lineHeight: 16,
   },
   enhancedAddStoryText: {
     fontSize: 11,
     fontWeight: '500',
     color: '#667eea',
     marginTop: 4,
     textAlign: 'center',
   },

 }); 