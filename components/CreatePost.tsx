import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { apiFetchAuth, uploadFile } from '../constants/api';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

interface CreatePostProps {
  visible: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export default function CreatePost({ visible, onClose, onPostCreated }: CreatePostProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setImage(null);
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content for your post');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = null;
      if (image) {
        const uploadedImageUrl = await uploadFile(image, user?.token || '');
        imageUrl = uploadedImageUrl;
      }

      const hashtagsArray = hashtags
        .split(',')
        .map(tag => tag.trim().replace('#', ''))
        .filter(tag => tag.length > 0);

      const postData = {
        content: content.trim(),
        hashtags: hashtagsArray,
        isPrivate,
        imageUrl: imageUrl,
      };

      const response = await apiFetchAuth('/student/posts', user?.token || '', {
        method: 'POST',
        body: postData,
      });

      if (response.ok) {
        Alert.alert('Success', 'Post created successfully!');
        resetForm();
        onPostCreated();
        onClose();
      } else {
        Alert.alert('Error', 'Failed to create post. Please try again.');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setContent('');
    setHashtags('');
    setIsPrivate(false);
    setImage(null);
  };

  const handleClose = () => {
    if (content.trim() || hashtags.trim() || image) {
      Alert.alert(
        'Discard Post?',
        'Are you sure you want to discard this post?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              resetForm();
              onClose();
            },
          },
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Enhanced Header with Premium Gradient */}
        <LinearGradient
          colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
              <LinearGradient
                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                style={styles.closeButtonGradient}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Create Post</Text>
              <Text style={styles.headerSubtitle}>Share your thoughts with the community</Text>
            </View>
            
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading || !content.trim()}
              style={[styles.postButton, !content.trim() && styles.disabledButton]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <LinearGradient
                  colors={content.trim() ? ['#FF6B6B', '#FF8E53'] : ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                  style={styles.postButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="send" size={18} color="#fff" style={styles.sendIcon} />
                  <Text style={styles.postButtonText}>Post</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Enhanced User Info Section */}
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.userInfoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.userInfoSection}>
              <View style={styles.avatarContainer}>
                <Image
                  source={user?.profilePicture ? { uri: user.profilePicture } : require('../assets/images/avatar1.jpg')}
                  style={styles.userAvatar}
                />
                <View style={styles.onlineIndicator} />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user?.name || 'Anonymous'}</Text>
                <View style={styles.privacyIndicator}>
                  <Ionicons
                    name={isPrivate ? 'lock-closed' : 'globe'}
                    size={16}
                    color={isPrivate ? '#FF6B6B' : '#4ECDC4'}
                  />
                  <Text style={styles.privacyText}>
                    {isPrivate ? 'Private Post' : 'Public Post'}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Enhanced Content Input */}
          <View style={styles.contentSection}>
            <View style={styles.inputHeader}>
              <Ionicons name="create-outline" size={20} color="#667eea" />
              <Text style={styles.inputLabel}>What's on your mind?</Text>
            </View>
            <TextInput
              style={styles.contentInput}
              placeholder="Share your thoughts, ideas, or experiences..."
              placeholderTextColor="#999"
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              maxLength={1000}
            />
            <View style={styles.charCountContainer}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.charCountGradient}
              >
                <Text style={styles.charCount}>{content.length}/1000</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Enhanced Image Preview */}
          {image && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.previewImage} />
              <LinearGradient
                colors={['rgba(0,0,0,0.6)', 'transparent']}
                style={styles.imageOverlay}
              />
              <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                <LinearGradient
                  colors={['#FF6B6B', '#FF8E53']}
                  style={styles.removeButtonGradient}
                >
                  <Ionicons name="close" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Enhanced Hashtags Section */}
          <View style={styles.hashtagsContainer}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.iconContainer}
              >
                <Ionicons name="pricetag" size={18} color="#fff" />
              </LinearGradient>
              <Text style={styles.sectionTitle}>Hashtags</Text>
            </View>
            <TextInput
              style={styles.hashtagsInput}
              placeholder="Enter hashtags separated by commas (e.g., study, math, exam)"
              placeholderTextColor="#999"
              value={hashtags}
              onChangeText={setHashtags}
            />
            {hashtags && (
              <View style={styles.hashtagsPreview}>
                {hashtags.split(',').map((tag, index) => {
                  const cleanTag = tag.trim().replace('#', '');
                  if (cleanTag) {
                    return (
                      <LinearGradient
                        key={index}
                        colors={['#667eea', '#764ba2']}
                        style={styles.hashtagChip}
                      >
                        <Text style={styles.hashtagText}>#{cleanTag}</Text>
                      </LinearGradient>
                    );
                  }
                  return null;
                })}
              </View>
            )}
          </View>

          {/* Enhanced Privacy Toggle */}
          <View style={styles.privacyContainer}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.iconContainer}
              >
                <Ionicons name="shield" size={18} color="#fff" />
              </LinearGradient>
              <Text style={styles.sectionTitle}>Privacy Settings</Text>
            </View>
            <TouchableOpacity
              style={styles.privacyToggle}
              onPress={() => setIsPrivate(!isPrivate)}
            >
              <View style={styles.privacyInfo}>
                <Ionicons
                  name={isPrivate ? 'lock-closed' : 'globe'}
                  size={24}
                  color={isPrivate ? '#FF6B6B' : '#4ECDC4'}
                />
                <View style={styles.privacyTextContainer}>
                  <Text style={styles.privacyToggleText}>
                    {isPrivate ? 'Private Post' : 'Public Post'}
                  </Text>
                  <Text style={styles.privacyDescription}>
                    {isPrivate ? 'Only you can see this post' : 'Everyone can see this post'}
                  </Text>
                </View>
              </View>
              <View style={[styles.toggleSwitch, isPrivate && styles.toggleSwitchActive]}>
                <View style={[styles.toggleKnob, isPrivate && styles.toggleKnobActive]} />
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Enhanced Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.actionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="image-outline" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Add Photo</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  closeButtonGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  postButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  postButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  postButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  userInfoGradient: {
    borderRadius: 20,
    marginBottom: 20,
    padding: 2,
  },
  userInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 18,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  userAvatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    borderWidth: 3,
    borderColor: '#fff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4ECDC4',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  privacyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  contentSection: {
    marginBottom: 20,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    minHeight: 120,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.1)',
  },
  charCountContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  charCountGradient: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  charCount: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  previewImage: {
    width: '100%',
    height: 250,
    borderRadius: 20,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  removeImageButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  removeButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  hashtagsContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  hashtagsInput: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    fontSize: 14,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.1)',
  },
  hashtagsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  hashtagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  hashtagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  privacyContainer: {
    marginBottom: 20,
  },
  privacyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.1)',
  },
  privacyInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyTextContainer: {
    marginLeft: 12,
  },
  privacyToggleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  privacyDescription: {
    fontSize: 14,
    color: '#666',
  },
  toggleSwitch: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  toggleSwitchActive: {
    backgroundColor: '#667eea',
  },
  toggleKnob: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  toggleKnobActive: {
    transform: [{ translateX: 24 }],
  },
  bottomActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(102, 126, 234, 0.1)',
    backgroundColor: '#fff',
  },
  actionButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  sendIcon: {
    marginRight: 6,
  },
}); 