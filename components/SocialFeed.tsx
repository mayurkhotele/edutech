import { Feather, Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, KeyboardAvoidingView, Modal, Platform, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { apiFetchAuth } from '../constants/api';
import { useAuth } from '../context/AuthContext';

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

export default function SocialFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Comment modal state
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetchAuth('/student/posts', user?.token || '');
      if (res.ok) {
        setPosts(res.data);
      } else {
        setError('Failed to load posts');
      }
    } catch (e) {
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
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
        setComments((prev) => [res.data, ...prev]);
        setNewComment('');
      }
    } catch (e) {
      // Optionally show error
    } finally {
      setPostingComment(false);
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#6C63FF" />;
  }
  if (error) {
    return <Text style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>{error}</Text>;
  }

  return (
    <>
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Author Row */}
            <View style={styles.authorRow}>
              <Image
                source={item.author?.profilePhoto ? { uri: item.author.profilePhoto } : require('../assets/images/avatar1.jpg')}
                style={styles.avatar}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.authorName}>{item.author?.name || 'Unknown'}</Text>
                <Text style={styles.authorMeta}>{[item.author?.course, item.author?.year].filter(Boolean).join(' • ')}</Text>
              </View>
              <Text style={styles.timeAgo}>{timeAgo(item.createdAt)}</Text>
            </View>

            {/* Content */}
            <Text style={styles.contentText}>{item.content}</Text>

            {/* Image/Video */}
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.media} resizeMode="cover" />
            ) : item.videoUrl ? (
              <View style={styles.mediaPlaceholder}>
                <Feather name="video" size={32} color="#6C63FF" />
                <Text style={{ color: '#6C63FF', marginTop: 4 }}>Video</Text>
              </View>
            ) : null}

            {/* Hashtags */}
            {item.hashtags && item.hashtags.length > 0 && (
              <View style={styles.hashtagsRow}>
                {item.hashtags.map((tag: string) => (
                  <Text key={tag} style={styles.hashtag}>#{tag}</Text>
                ))}
              </View>
            )}

            {/* Actions Row */}
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name={item.isLiked ? 'heart' : 'heart-outline'} size={22} color={item.isLiked ? '#F44336' : '#888'} />
                <Text style={styles.actionText}>{item._count?.likes || 0}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => openComments(item)}>
                <Ionicons name="chatbubble-ellipses-outline" size={22} color="#888" />
                <Text style={styles.actionText}>{item._count?.comments || 0}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>No posts yet</Text>}
        showsVerticalScrollIndicator={false}
      />

      {/* Comment Modal */}
      <Modal
        visible={commentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeComments}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={closeComments}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            {commentsLoading ? (
              <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#6C63FF" />
            ) : (
              <FlatList
                data={comments}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingBottom: 16 }}
                renderItem={({ item }) => (
                  <View style={styles.commentRow}>
                    <Image
                      source={item.user?.profilePhoto ? { uri: item.user.profilePhoto } : require('../assets/images/avatar1.jpg')}
                      style={styles.commentAvatar}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.commentName}>{item.user?.name || 'Unknown'}</Text>
                      <Text style={styles.commentContent}>{item.content}</Text>
                    </View>
                    <Text style={styles.commentTime}>{timeAgo(item.createdAt)}</Text>
                  </View>
                )}
                ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>No comments yet</Text>}
                showsVerticalScrollIndicator={false}
              />
            )}
            {/* Add Comment Input */}
            <View style={styles.addCommentRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                value={newComment}
                onChangeText={setNewComment}
                editable={!postingComment}
              />
              <TouchableOpacity
                style={styles.sendBtn}
                onPress={handleAddComment}
                disabled={postingComment || !newComment.trim()}
              >
                <Ionicons name="send" size={22} color={postingComment || !newComment.trim() ? '#aaa' : '#6C63FF'} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  authorName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
  },
  authorMeta: {
    fontSize: 12,
    color: '#888',
  },
  timeAgo: {
    fontSize: 12,
    color: '#aaa',
    marginLeft: 8,
  },
  contentText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 8,
  },
  media: {
    width: width - 64,
    height: 220,
    borderRadius: 14,
    backgroundColor: '#f3f3f3',
    marginBottom: 8,
    alignSelf: 'center',
  },
  mediaPlaceholder: {
    width: width - 64,
    height: 220,
    borderRadius: 14,
    backgroundColor: '#f3f3f3',
    marginBottom: 8,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hashtagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  hashtag: {
    color: '#6C63FF',
    marginRight: 8,
    fontWeight: 'bold',
    fontSize: 13,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    marginLeft: 4,
    color: '#444',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#222',
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    backgroundColor: '#eee',
  },
  commentName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#222',
  },
  commentContent: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  commentTime: {
    fontSize: 11,
    color: '#aaa',
    marginLeft: 8,
    marginTop: 2,
  },
  addCommentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingTop: 8,
    marginTop: 8,
  },
  commentInput: {
    flex: 1,
    height: 38,
    borderRadius: 18,
    backgroundColor: '#f3f3f3',
    paddingHorizontal: 14,
    fontSize: 15,
    marginRight: 8,
  },
  sendBtn: {
    padding: 6,
  },
}); 