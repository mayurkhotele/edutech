import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
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
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import CreatePost from '../../components/CreatePost';
import { apiFetchAuth, uploadFile } from '../../constants/api';
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

interface SearchUser {
  id: string;
  name: string;
  email: string;
  profilePhoto: string | null;
  course: string | null;
  year: string | null;
  isFollowing: boolean;
  isFollowedBack: boolean;
  followRequestStatus: string;
  canMessageDirectly: boolean;
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [pendingPostsLoading, setPendingPostsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [createPostVisible, setCreatePostVisible] = useState(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Search functionality states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetchAuth('/student/profile', user?.token || '');
      if (res.ok) {
        setProfile(res.data);
      } else {
        setError('Failed to load profile');
      }
    } catch (e) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearching(true);
    try {
      const response = await apiFetchAuth(`/student/search?q=${encodeURIComponent(query)}`, user?.token || '');
      if (response.ok) {
        setSearchResults(response.data.users || []);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setSearching(false);
    }
  };

  // Hide search results when scrolling
  const handleScroll = () => {
    if (showSearchResults) {
      setShowSearchResults(false);
    }
  };

  const handleUserPress = (searchUser: SearchUser) => {
    // Navigate to user profile
    navigation.navigate('user-profile', { userId: searchUser.id });
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const handleProfilePhotoUpload = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photo library.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingPhoto(true);
        
        try {
          // Upload the image
          const imageUrl = await uploadFile(result.assets[0].uri, user?.token || '');
          
          // Update profile with new photo
          const updateResponse = await apiFetchAuth('/student/profile', user?.token || '', {
            method: 'PATCH',
            body: {
              ...profile,
              profilePhoto: imageUrl,
            },
          });

          if (updateResponse.ok) {
            setProfile(updateResponse.data);
            // Update the user context with new profile data
            if (user) {
              const updatedUser = { ...user, ...updateResponse.data };
              updateUser(updatedUser);
            }
            Alert.alert('Success', 'Profile picture updated successfully!');
          } else {
            Alert.alert('Error', 'Failed to update profile picture. Please try again.');
          }
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          Alert.alert('Error', 'Failed to upload image. Please try again.');
        } finally {
          setUploadingPhoto(false);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      setUploadingPhoto(false);
    }
  };

  const fetchUserPosts = async () => {
    setPostsLoading(true);
    try {
      const res = await apiFetchAuth(`/student/posts?authorId=${user?.id}&limit=20`, user?.token || '');
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

  const fetchPendingPosts = async () => {
    setPendingPostsLoading(true);
    try {
      const res = await apiFetchAuth('/student/posts/pending', user?.token || '');
      if (res.ok) {
        setPendingPosts(res.data);
      }
    } catch (e) {
      console.error('Error fetching pending posts:', e);
    } finally {
      setPendingPostsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), fetchUserPosts(), fetchPendingPosts()]);
    setRefreshing(false);
  };

  // Refresh profile data every time the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
      fetchUserPosts();
      fetchPendingPosts();
    }, [user?.token])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <LinearGradient
          colors={['#EF4444', '#F97316']}
          style={styles.errorGradient}
        >
          <Ionicons name="alert-circle-outline" size={64} color="#fff" />
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
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

  // User-friendly helper functions
  const handleEditProfile = () => {
    navigation.navigate('edit-profile');
  };

  const handleShareProfile = () => {
    // TODO: Implement share functionality
    console.log('Share profile pressed');
  };

  const handleCreatePost = () => {
    setCreatePostVisible(true);
  };

  const handlePostCreated = () => {
    // Trigger refresh of the profile data when a new post is created
    setRefreshTrigger(prev => prev + 1);
    fetchProfile();
    fetchUserPosts();
    fetchPendingPosts();
  };

  const handlePostPress = (post: any) => {
    // TODO: Navigate to post detail screen
    console.log('Post pressed:', post.id);
  };

  const handleStatPress = (type: string) => {
    // TODO: Navigate to respective screens
    console.log(`${type} pressed`);
  };

  const handleFollow = async () => {
    try {
      const res = await apiFetchAuth('/student/follow', user?.token || '', {
        method: 'POST',
        body: { targetUserId: profile.id },
      });
      
      if (res.ok) {
        // Update the profile to reflect the follow action
        // You might want to update the UI to show "Following" instead of "Follow"
        console.log('Follow successful:', res.data);
        // Optionally refresh the profile data
        fetchProfile();
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const renderUserPost = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.postCard} activeOpacity={0.95} onPress={() => handlePostPress(item)}>
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
        <TouchableOpacity style={styles.postStatItem} activeOpacity={0.7}>
          <LinearGradient
            colors={['#ff6b6b', '#ff8e53']}
            style={styles.statIconGradient}
          >
            <Ionicons name="heart-outline" size={16} color="#fff" />
          </LinearGradient>
          <Text style={styles.statText}>{item._count?.likes || 0}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.postStatItem} activeOpacity={0.7}>
          <LinearGradient
            colors={['#4facfe', '#00f2fe']}
            style={styles.statIconGradient}
          >
            <Ionicons name="chatbubble-outline" size={16} color="#fff" />
          </LinearGradient>
          <Text style={styles.statText}>{item._count?.comments || 0}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.postStatItem} activeOpacity={0.7}>
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

  const renderSearchResult = ({ item }: { item: SearchUser }) => (
    <TouchableOpacity 
      style={styles.searchResultItem} 
      onPress={() => handleUserPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.searchResultAvatar}>
        {item.profilePhoto ? (
          <Image source={{ uri: item.profilePhoto }} style={styles.searchResultAvatarImage} />
        ) : (
          <View style={styles.searchResultAvatarPlaceholder}>
            <Text style={styles.searchResultAvatarInitials}>{getInitials(item.name)}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.searchResultInfo}>
        <Text style={styles.searchResultName}>{item.name}</Text>
        <Text style={styles.searchResultEmail}>{item.email}</Text>
        {(item.course || item.year) && (
          <View style={styles.searchResultCourse}>
            <Ionicons name="school-outline" size={12} color="#6B7280" />
            <Text style={styles.searchResultCourseText}>
              {[item.course, item.year].filter(Boolean).join(' • ')}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.searchResultActions}>
        {item.isFollowing ? (
          <View style={styles.followingBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.followingBadgeText}>Following</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.followButtonSmall}>
            <Ionicons name="person-add-outline" size={16} color="#8B5CF6" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
             {/* Enhanced Modern Search Bar */}
       <LinearGradient
         colors={['#f8fafc', '#e2e8f0']}
         style={styles.enhancedSearchContainer}
       >
         <View style={styles.enhancedSearchBarContainer}>
           <LinearGradient
             colors={['#ffffff', '#f1f5f9']}
             style={styles.enhancedSearchBarGradient}
           >
             <View style={styles.enhancedSearchContent}>
               <View style={styles.enhancedSearchIconContainer}>
                 <Ionicons name="search" size={22} color="#667eea" />
               </View>
               <TextInput
                 style={styles.enhancedSearchInput}
                 placeholder="Search users, posts, or hashtags..."
                 placeholderTextColor="#94a3b8"
                 value={searchQuery}
                 onChangeText={handleSearch}
                 onFocus={() => {
                   if (searchQuery.trim().length >= 2) {
                     setShowSearchResults(true);
                   }
                 }}
                 onBlur={() => {
                   setTimeout(() => {
                     setShowSearchResults(false);
                   }, 200);
                 }}
               />
               {searchQuery.length > 0 && (
                 <TouchableOpacity 
                   style={styles.enhancedClearSearchButton}
                   onPress={() => {
                     setSearchQuery('');
                     setSearchResults([]);
                     setShowSearchResults(false);
                   }}
                 >
                   <LinearGradient
                     colors={['#ef4444', '#dc2626']}
                     style={styles.enhancedClearButtonGradient}
                   >
                     <Ionicons name="close" size={16} color="#fff" />
                   </LinearGradient>
                 </TouchableOpacity>
               )}
             </View>
           </LinearGradient>
         </View>
        
                 {/* Search Results */}
         {showSearchResults && (
           <View style={styles.enhancedSearchResultsContainer}>
             {searching ? (
               <View style={styles.enhancedSearchLoading}>
                 <ActivityIndicator size="small" color="#667eea" />
                 <Text style={styles.enhancedSearchLoadingText}>Searching...</Text>
               </View>
             ) : searchResults.length > 0 ? (
               <FlatList
                 data={searchResults}
                 keyExtractor={(item) => item.id}
                 renderItem={renderSearchResult}
                 style={styles.enhancedSearchResultsList}
                 showsVerticalScrollIndicator={false}
                 keyboardShouldPersistTaps="handled"
                 nestedScrollEnabled={true}
               />
             ) : searchQuery.trim().length >= 2 ? (
               <View style={styles.enhancedNoSearchResults}>
                 <Ionicons name="search-outline" size={48} color="#94a3b8" />
                 <Text style={styles.enhancedNoSearchResultsText}>No users found</Text>
                 <Text style={styles.enhancedNoSearchResultsSubtext}>Try a different search term</Text>
               </View>
             ) : null}
           </View>
         )}
       </LinearGradient>

      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#262626']}
            tintColor="#262626"
          />
        }
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
                 {/* Enhanced Modern Profile Header */}
         <LinearGradient
           colors={['#667eea', '#764ba2', '#f093fb']}
           start={{ x: 0, y: 0 }}
           end={{ x: 1, y: 1 }}
           style={styles.enhancedProfileHeader}
         >
           <View style={styles.profileHeaderContent}>
             {/* Enhanced Avatar Section */}
             <View style={styles.enhancedAvatarSection}>
               <View style={styles.enhancedAvatarContainer}>
                 {uploadingPhoto ? (
                   <View style={styles.enhancedAvatarLoading}>
                     <ActivityIndicator size="large" color="#fff" />
                   </View>
                 ) : profile.profilePhoto ? (
                   <Image source={{ uri: profile.profilePhoto }} style={styles.enhancedAvatar} />
                 ) : (
                   <LinearGradient
                     colors={['#ff6b6b', '#ff8e53']}
                     style={styles.enhancedAvatarPlaceholder}
                   >
                     <Text style={styles.enhancedAvatarInitials}>{getInitials(profile.name)}</Text>
                   </LinearGradient>
                 )}
                 <TouchableOpacity 
                   style={[styles.enhancedEditAvatarButton, uploadingPhoto && styles.editAvatarButtonDisabled]} 
                   activeOpacity={0.8}
                   onPress={handleProfilePhotoUpload}
                   disabled={uploadingPhoto}
                 >
                   <LinearGradient
                     colors={['#4facfe', '#00f2fe']}
                     style={styles.enhancedEditAvatarIcon}
                   >
                     {uploadingPhoto ? (
                       <ActivityIndicator size="small" color="#fff" />
                     ) : (
                       <Ionicons name="camera" size={18} color="#fff" />
                     )}
                   </LinearGradient>
                 </TouchableOpacity>
               </View>
               
                               <View style={styles.enhancedProfileInfo}>
                  <Text style={styles.enhancedName}>{profile.name}</Text>
                  <Text style={styles.enhancedEmail}>
                    {profile?.handle
                      ? `@${profile.handle}`
                      : profile?.username
                      ? `@${profile.username}`
                      : profile?.name
                      ? `@${profile.name.replace(/\s+/g, '').toLowerCase()}`
                      : ''}
                  </Text>
                  {(profile.course || profile.year) && (
                    <View style={styles.enhancedCourseInfo}>
                      <Ionicons name="school-outline" size={16} color="#fff" />
                      <Text style={styles.enhancedCourseText}>{[profile.course, profile.year].filter(Boolean).join(' • ')}</Text>
                    </View>
                  )}
                </View>
             </View>

             {/* Enhanced Stats Cards */}
             <View style={styles.enhancedStatsContainer}>
               <View style={styles.enhancedStatCard}>
                 <LinearGradient
                   colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                   style={styles.enhancedStatGradient}
                 >
                   <Ionicons name="document-text" size={24} color="#fff" />
                   <Text style={styles.enhancedStatNumber}>{profile._count?.posts || 0}</Text>
                   <Text style={styles.enhancedStatLabel}>Posts</Text>
                 </LinearGradient>
               </View>
               <View style={styles.enhancedStatCard}>
                 <LinearGradient
                   colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                   style={styles.enhancedStatGradient}
                 >
                   <Ionicons name="people" size={24} color="#fff" />
                   <Text style={styles.enhancedStatNumber}>{profile._count?.followers || 0}</Text>
                   <Text style={styles.enhancedStatLabel}>Followers</Text>
                 </LinearGradient>
               </View>
               <View style={styles.enhancedStatCard}>
                 <LinearGradient
                   colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                   style={styles.enhancedStatGradient}
                 >
                   <Ionicons name="person-add" size={24} color="#fff" />
                   <Text style={styles.enhancedStatNumber}>{profile._count?.following || 0}</Text>
                   <Text style={styles.enhancedStatLabel}>Following</Text>
                 </LinearGradient>
               </View>
             </View>
             
             
             
             {/* Enhanced Action Buttons */}
             <View style={styles.enhancedActionButtons}>
               {user?.id !== profile?.id ? (
                 <TouchableOpacity style={styles.enhancedFollowButton} activeOpacity={0.8} onPress={handleFollow}>
                   <LinearGradient
                     colors={['#10B981', '#059669']}
                     style={styles.enhancedFollowButtonGradient}
                   >
                     <Ionicons name="person-add" size={18} color="#fff" />
                     <Text style={styles.enhancedFollowButtonText}>Follow</Text>
                   </LinearGradient>
                 </TouchableOpacity>
               ) : (
                 <TouchableOpacity style={styles.enhancedEditButton} activeOpacity={0.8} onPress={handleEditProfile}>
                   <LinearGradient
                     colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                     style={styles.enhancedEditButtonGradient}
                   >
                     <Ionicons name="create" size={18} color="#fff" />
                     <Text style={styles.enhancedEditButtonText}>Edit Profile</Text>
                   </LinearGradient>
                 </TouchableOpacity>
               )}
               <TouchableOpacity style={styles.enhancedShareButton} onPress={handleShareProfile}>
                 <LinearGradient
                   colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                   style={styles.enhancedShareButtonGradient}
                 >
                   <Ionicons name="share-social" size={20} color="#fff" />
                 </LinearGradient>
               </TouchableOpacity>
             </View>
           </View>
         </LinearGradient>

        {/* Enhanced Bio Section */}
        {profile.bio && (
          <View style={styles.bioSection}>
            <View style={styles.bioHeader}>
              <Ionicons name="information-circle" size={20} color="#4F46E5" />
              <Text style={styles.bioTitle}>About Me</Text>
            </View>
            <Text style={styles.bio}>{profile.bio}</Text>
          </View>
        )}



        {/* Pending Posts Section */}
        {pendingPosts.length > 0 && (
          <View style={styles.pendingPostsSection}>
            <TouchableOpacity 
              style={styles.pendingPostsHeader}
              onPress={() => navigation.navigate('pending-posts')}
              activeOpacity={0.8}
            >
              <View style={styles.pendingPostsHeaderLeft}>
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  style={styles.pendingPostsIconContainer}
                >
                  <Ionicons name="time-outline" size={20} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.pendingPostsHeaderText}>
                  <Text style={styles.pendingPostsTitle}>Pending for Review</Text>
                  <Text style={styles.pendingPostsSubtitle}>{pendingPosts.length} post{pendingPosts.length !== 1 ? 's' : ''} awaiting approval</Text>
                </View>
              </View>
              <View style={styles.pendingPostsBadge}>
                <Text style={styles.pendingPostsBadgeText}>{pendingPosts.length}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#F59E0B" />
            </TouchableOpacity>
          </View>
        )}

        {/* Enhanced Posts Section */}
        <View style={styles.postsSection}>
          <View style={styles.postsHeader}>
            <Text style={styles.postsTitle}>My Posts</Text>
            <Text style={styles.postsCount}>{userPosts.length} posts</Text>
          </View>

          {postsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
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
                <LinearGradient
                  colors={['#4F46E5', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.emptyIconGradient}
                >
                  <Ionicons name="create-outline" size={48} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptySubtitle}>Share your first post with the community</Text>
              <TouchableOpacity style={styles.createButton} activeOpacity={0.8} onPress={handleCreatePost}>
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.createButtonGradient}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.createButtonText}>Create Post</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Enhanced Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setCreatePostVisible(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Create Post Modal */}
      <CreatePost
        visible={createPostVisible}
        onClose={() => setCreatePostVisible(false)}
        onPostCreated={handlePostCreated}
      />


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  profileHeaderGradient: {
    paddingTop: 40,
    paddingBottom: 25,
    paddingHorizontal: 16,
  },
  profileHeaderContent: {
    alignItems: 'center',
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  editAvatarIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.3,
  },
  email: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    fontWeight: '500',
  },
  courseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  courseText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionSection: {
    alignItems: 'center',
  },
  followButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  followButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  editProfileButton: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  editProfileButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  editProfileButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  bioSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  bioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bioTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 6,
  },
  bio: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    fontWeight: '500',
  },

  postsSection: {
    marginHorizontal: 20,
    marginBottom: 100,
  },
  postsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  postsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 0.3,
  },
  postsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  postAuthorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  postAuthorAvatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  postAuthorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  postAuthorInfo: {
    flex: 1,
  },
  postAuthorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  postMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postTime: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyIndicator: {
    marginRight: 8,
  },
  privacyGradient: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButton: {
    padding: 6,
  },
  moreButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postContentContainer: {
    marginBottom: 16,
  },
  postContent: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    fontWeight: '500',
  },
  mediaContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  mediaImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
  },
  mediaPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -16 }, { translateY: -16 }],
    width: 32,
    height: 32,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
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
    fontWeight: '600',
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  postStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statIconGradient: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
    fontWeight: '500',
  },
  createButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 1000,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  avatarLoading: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  editAvatarButtonDisabled: {
    opacity: 0.5,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 5,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchBarGradient: {
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  clearSearchButton: {
    padding: 5,
  },
  searchResultsContainer: {
    position: 'absolute',
    top: 35, // Perfect position above search bar
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
    zIndex: 9999, // Very high z-index to ensure it's on top
    maxHeight: 550, // Maximum height for better visibility
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)', // Subtle border
  },
  searchResultsList: {
    maxHeight: 200, // Limit height for search results
  },
  searchLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
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
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 5,
    backgroundColor: '#F9FAFB',
  },
  searchResultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  searchResultAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultAvatarInitials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  searchResultEmail: {
    fontSize: 12,
    color: '#6B7280',
  },
  searchResultCourse: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  searchResultCourseText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  searchResultActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2F7',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  followingBadgeText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 4,
  },
  followButtonSmall: {
    padding: 5,
  },
  noSearchResults: {
    alignItems: 'center',
    padding: 30,
  },
  noSearchResultsText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 10,
  },
  noSearchResultsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  // Pending Posts Section Styles
  pendingPostsSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  pendingPostsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pendingPostsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pendingPostsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  pendingPostsHeaderText: {
    flex: 1,
  },
  pendingPostsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  pendingPostsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  pendingPostsBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 12,
    minWidth: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingPostsBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
  searchContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
   // Instagram-style profile header
  instagramProfileHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  instagramAvatarContainer: {
    width: 86,
    height: 86,
    borderRadius: 43,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#dbdbdb',
  },
  instagramAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  instagramAvatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instagramAvatarInitials: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#262626',
  },
  instagramProfileInfo: {
    flex: 1,
  },
  instagramUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 2,
  },
  instagramUserHandle: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 12,
  },
  instagramStats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  instagramStatItem: {
    alignItems: 'center',
    marginRight: 24,
  },
  instagramStatNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#262626',
  },
  instagramStatLabel: {
    fontSize: 12,
    color: '#8e8e93',
  },
  instagramBioContainer: {
    marginBottom: 12,
  },
  instagramBio: {
    fontSize: 14,
    color: '#262626',
    lineHeight: 20,
  },
  instagramActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instagramEditButton: {
    flex: 1,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#dbdbdb',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    alignItems: 'center',
  },
  instagramEditButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },
  instagramFollowButton: {
    flex: 1,
    backgroundColor: '#0095f6',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    alignItems: 'center',
  },
  instagramFollowButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
     instagramShareButton: {
     backgroundColor: '#fafafa',
     borderWidth: 1,
     borderColor: '#dbdbdb',
     borderRadius: 4,
     padding: 8,
     alignItems: 'center',
     justifyContent: 'center',
   },
       // Enhanced Profile Styles
    enhancedProfileHeader: {
      paddingTop: 30,
      paddingBottom: 20,
      paddingHorizontal: 16,
    },
       enhancedAvatarSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
   enhancedAvatarContainer: {
     position: 'relative',
     marginRight: 20,
   },
       enhancedAvatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 3,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
       enhancedAvatarPlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
       enhancedAvatarInitials: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
       enhancedAvatarLoading: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
   enhancedEditAvatarButton: {
     position: 'absolute',
     bottom: 0,
     right: 0,
   },
   enhancedEditAvatarIcon: {
     width: 32,
     height: 32,
     borderRadius: 16,
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 3,
     borderColor: '#FFFFFF',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.3,
     shadowRadius: 4,
     elevation: 5,
   },
   enhancedProfileInfo: {
     flex: 1,
   },
   enhancedName: {
     fontSize: 28,
     fontWeight: '700',
     color: '#FFFFFF',
     marginBottom: 6,
     textShadowColor: 'rgba(0, 0, 0, 0.3)',
     textShadowOffset: { width: 0, height: 1 },
     textShadowRadius: 2,
     letterSpacing: 0.5,
   },
       enhancedEmail: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.9)',
      marginBottom: 8,
      fontWeight: '500',
    },
    enhancedBioText: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
      marginBottom: 10,
      fontWeight: '400',
      lineHeight: 20,
      fontStyle: 'italic',
    },
   enhancedCourseInfo: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: 'rgba(255, 255, 255, 0.2)',
     paddingHorizontal: 12,
     paddingVertical: 6,
     borderRadius: 20,
   },
   enhancedCourseText: {
     fontSize: 14,
     color: '#FFFFFF',
     fontWeight: '600',
     marginLeft: 8,
   },
       enhancedStatsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
       enhancedStatCard: {
      flex: 1,
      marginHorizontal: 3,
    },
       enhancedStatGradient: {
      padding: 12,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
       enhancedStatNumber: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
      marginTop: 4,
      marginBottom: 2,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
       enhancedStatLabel: {
      fontSize: 9,
      color: 'rgba(255, 255, 255, 0.9)',
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.2,
    },
   enhancedBioContainer: {
     marginBottom: 25,
   },
   enhancedBioGradient: {
     padding: 16,
     borderRadius: 12,
     borderWidth: 1,
     borderColor: 'rgba(255, 255, 255, 0.2)',
   },
   bioIcon: {
     marginBottom: 8,
   },
   enhancedBio: {
     fontSize: 16,
     color: '#FFFFFF',
     lineHeight: 24,
     fontWeight: '500',
     textShadowColor: 'rgba(0, 0, 0, 0.2)',
     textShadowOffset: { width: 0, height: 1 },
     textShadowRadius: 1,
   },
   enhancedActionButtons: {
     flexDirection: 'row',
     alignItems: 'center',
     gap: 12,
   },
   enhancedFollowButton: {
     flex: 1,
     borderRadius: 12,
     overflow: 'hidden',
     shadowColor: '#10B981',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.3,
     shadowRadius: 8,
     elevation: 6,
   },
   enhancedFollowButtonGradient: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     paddingVertical: 14,
     paddingHorizontal: 20,
     borderRadius: 12,
   },
   enhancedFollowButtonText: {
     color: '#fff',
     fontSize: 16,
     fontWeight: '700',
     marginLeft: 8,
     letterSpacing: 0.3,
   },
   enhancedEditButton: {
     flex: 1,
     borderRadius: 12,
     overflow: 'hidden',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.2,
     shadowRadius: 8,
     elevation: 4,
   },
   enhancedEditButtonGradient: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     paddingVertical: 14,
     paddingHorizontal: 20,
     borderRadius: 12,
   },
   enhancedEditButtonText: {
     color: '#fff',
     fontSize: 16,
     fontWeight: '700',
     marginLeft: 8,
     letterSpacing: 0.3,
   },
   enhancedShareButton: {
     borderRadius: 12,
     overflow: 'hidden',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.2,
     shadowRadius: 8,
     elevation: 4,
   },
   enhancedShareButtonGradient: {
     width: 50,
     height: 50,
     borderRadius: 12,
     justifyContent: 'center',
     alignItems: 'center',
   },
   // Enhanced Search Styles
   enhancedSearchContainer: {
     paddingHorizontal: 16,
     paddingVertical: 16,
     borderBottomWidth: 1,
     borderBottomColor: 'rgba(0,0,0,0.05)',
   },
   enhancedSearchBarContainer: {
     borderRadius: 16,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 8,
     elevation: 4,
   },
   enhancedSearchBarGradient: {
     borderRadius: 16,
     paddingHorizontal: 16,
     paddingVertical: 12,
     borderWidth: 1,
     borderColor: 'rgba(102, 126, 234, 0.1)',
   },
   enhancedSearchContent: {
     flexDirection: 'row',
     alignItems: 'center',
   },
   enhancedSearchIconContainer: {
     marginRight: 12,
   },
   enhancedSearchInput: {
     flex: 1,
     fontSize: 16,
     color: '#1e293b',
     paddingVertical: 8,
   },
   enhancedClearSearchButton: {
     marginLeft: 8,
   },
   enhancedClearButtonGradient: {
     width: 24,
     height: 24,
     borderRadius: 12,
     justifyContent: 'center',
     alignItems: 'center',
   },
   enhancedSearchResultsContainer: {
     position: 'absolute',
     top: 70,
     left: 16,
     right: 16,
     backgroundColor: '#ffffff',
     borderRadius: 16,
     padding: 16,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 8 },
     shadowOpacity: 0.15,
     shadowRadius: 16,
     elevation: 10,
     zIndex: 9999,
     maxHeight: 400,
     borderWidth: 1,
     borderColor: 'rgba(102, 126, 234, 0.1)',
   },
   enhancedSearchResultsList: {
     maxHeight: 300,
   },
   enhancedSearchLoading: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     paddingVertical: 20,
   },
   enhancedSearchLoadingText: {
     marginLeft: 12,
     color: '#667eea',
     fontSize: 16,
     fontWeight: '600',
   },
   enhancedNoSearchResults: {
     alignItems: 'center',
     padding: 40,
   },
   enhancedNoSearchResultsText: {
     fontSize: 18,
     color: '#64748b',
     marginTop: 16,
     fontWeight: '600',
   },
   enhancedNoSearchResultsSubtext: {
     fontSize: 14,
     color: '#94a3b8',
     marginTop: 8,
     textAlign: 'center',
   },
});