import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
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
  navigation?: any;
}

export default function SocialFeed({ refreshTrigger, navigation }: SocialFeedProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
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

  useEffect(() => {
    fetchPosts();
    fetchStories();
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

  const handleFollowUser = async (authorId: string, authorName: string, isCurrentlyFollowing: boolean) => {
    try {
      let res;
      
      if (isCurrentlyFollowing) {
        // Unfollow: DELETE request with userId as query parameter
        res = await apiFetchAuth(`/student/follow?userId=${authorId}`, user?.token || '', {
          method: 'DELETE',
        });
      } else {
        // Follow: POST request with userId in body
        res = await apiFetchAuth('/student/follow', user?.token || '', {
          method: 'POST',
          body: { targetUserId: authorId },
        });
      }
      
      if (res.ok) {
        // Update the post's follow status in the local state
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post.author?.id === authorId) {
              return {
                ...post,
                author: {
                  ...post.author,
                  isFollowing: !isCurrentlyFollowing
                }
              };
            }
            return post;
          })
        );
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
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

  const renderPost = ({ item }: { item: any }) => (
    <View style={styles.postCard}>
      {/* Professional Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity 
          style={styles.authorSection} 
          onPress={() => {
            if (navigation && item.author?.id) {
              navigation.navigate('user-profile', { userId: item.author.id });
            }
          }}
          activeOpacity={0.7}
        >
          <Image
            source={item.author?.profilePhoto ? { uri: item.author.profilePhoto } : require('../assets/images/avatar1.jpg')}
            style={styles.authorAvatar}
          />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{item.author?.name || 'Unknown'}</Text>
            <View style={styles.authorMeta}>
              <Text style={styles.authorCourse}>
                {[item.author?.course, item.author?.year].filter(Boolean).join(' • ')}
              </Text>
              <Text style={styles.postTime}>{timeAgo(item.createdAt)}</Text>
            </View>
          </View>
        </TouchableOpacity>
        <View style={styles.postActions}>
          {/* Follow Button - Only show if not current user */}
          {item.author?.id !== user?.id && (
            <TouchableOpacity 
              style={[
                styles.followButton, 
                item.author?.isFollowing && styles.unfollowButton
              ]}
              onPress={() => handleFollowUser(
                item.author.id, 
                item.author.name, 
                item.author.isFollowing || false
              )}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={item.author?.isFollowing ? "person-remove-outline" : "person-add-outline"} 
                size={16} 
                color="#fff" 
              />
              <Text style={styles.followButtonText}>
                {item.author?.isFollowing ? 'Unfollow' : 'Follow'}
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

      {/* Clean Content */}
      <Text style={styles.postContent}>{item.content}</Text>

      {/* Professional Media Display */}
      {item.imageUrl && (
        <View style={styles.mediaContainer}>
          <Image source={{ uri: item.imageUrl }} style={styles.mediaImage} resizeMode="cover" />
        </View>
      )}

      {item.videoUrl && (
        <View style={styles.videoContainer}>
          <View style={styles.videoPlaceholder}>
            <Ionicons name="play-circle" size={48} color="#667eea" />
            <Text style={styles.videoText}>Video</Text>
          </View>
        </View>
      )}

      {/* Elegant Hashtags */}
      {item.hashtags && item.hashtags.length > 0 && (
        <View style={styles.hashtagsContainer}>
          {item.hashtags.map((tag: string) => (
            <View key={tag} style={styles.hashtagChip}>
              <Text style={styles.hashtagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Professional Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleLikePost(item.id)}>
          <Ionicons 
            name={item.isLiked ? 'heart' : 'heart-outline'} 
            size={20} 
            color={item.isLiked ? '#ff6b6b' : '#666'} 
          />
          <Text style={[styles.actionText, item.isLiked && styles.likedText]}>
            {item._count?.likes || 0}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => openComments(item)}>
          <Ionicons name="chatbubble-outline" size={20} color="#666" />
          <Text style={styles.actionText}>{item._count?.comments || 0}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={20} color="#666" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStories = () => {
    return (
      <View style={styles.storiesContainer}>
        <View style={styles.storiesHeader}>
          <Text style={styles.storiesTitle}>Stories</Text>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color="#667eea" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={stories}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesList}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            return (
              <TouchableOpacity 
                style={styles.storyItem} 
                activeOpacity={0.8}
                onPress={() => item.isAdd ? handleAddStory() : handleStoryPress(index)}
              >
                <View style={styles.storyWrapper}>
                  <View style={[
                    styles.storyRing,
                    item.isAdd && styles.addStoryRing,
                    item.hasStory && !item.viewed && styles.unviewedStoryRing,
                    item.hasStory && item.viewed && styles.viewedStoryRing
                  ]}>
                    {typeof item.image === 'string' ? (
                      <Image source={{ uri: item.image }} style={styles.storyImage} />
                    ) : (
                      <Image source={item.image} style={styles.storyImage} />
                    )}
                    {item.isAdd && (
                      <View style={styles.addStoryIcon}>
                        <Ionicons name="add" size={16} color="#fff" />
                      </View>
                    )}
                    {item.hasStory && !item.viewed && (
                      <View style={styles.storyIndicator}>
                        <View style={styles.storyDot} />
                      </View>
                    )}
                  </View>
                  <View style={styles.storyInfo}>
                    <Text style={styles.storyUsername} numberOfLines={1}>
                      {item.username}
                    </Text>
                    {item.isAdd && (
                      <Text style={styles.addStoryText}>Add Story</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
  };

  return (
    <>
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
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptySubtitle}>Be the first to share something with your community</Text>
            </View>
          </View>
        }
        showsVerticalScrollIndicator={false}
        onEndReached={loadMorePosts}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
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
        <View style={styles.modalOverlay}>
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
              ListEmptyComponent={
                <View style={styles.noCommentsContainer}>
                  <Text style={styles.noCommentsText}>No comments yet</Text>
                  <Text style={styles.noCommentsSubtext}>Be the first to comment!</Text>
                </View>
              }
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
    </>
  );
}

const styles = StyleSheet.create({
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
    color: '#333',
    marginBottom: 2,
  },
  authorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorCourse: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  postTime: {
    fontSize: 13,
    color: '#999',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
  privacyIndicator: {
    marginRight: 8,
  },
  moreButton: {
    padding: 4,
  },
  postContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  mediaContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
  },
  videoContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  videoPlaceholder: {
    height: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  hashtagChip: {
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  hashtagText: {
    fontSize: 13,
    color: '#667eea',
    fontWeight: '500',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 32,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  likedText: {
    color: '#ff6b6b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
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
  noCommentsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noCommentsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 4,
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: '#999',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#f8f9fa',
  },
  commentInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  postCommentButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postCommentButtonDisabled: {
    backgroundColor: '#f5f5f5',
  },
  postCommentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  storiesContainer: {
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  storiesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  storiesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.5,
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
  storiesList: {
    paddingHorizontal: 16,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 12,
    width: 75,
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
  followButtonText: {
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
}); 