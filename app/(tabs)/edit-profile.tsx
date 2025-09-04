import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { apiFetchAuth, uploadFile } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, updateUser } = useAuth();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    bio: '',
    course: '',
    year: '',
    profilePhoto: '',
    isPrivate: false
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        bio: (user as any).bio || '',
        course: (user as any).course || '',
        year: (user as any).year || '',
        profilePhoto: user.profilePhoto || '',
        isPrivate: (user as any).isPrivate || false
      });
    }
    
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Start pulse animation for save button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [user, fadeAnim, slideAnim, scaleAnim, pulseAnim]);

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
          
          // Update local state with new photo
          setProfileData(prev => ({
            ...prev,
            profilePhoto: imageUrl
          }));
          
          Alert.alert('Success', 'Profile picture updated successfully!');
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

  const handleSave = async () => {
    if (!profileData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (!profileData.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    setLoading(true);
    try {
      const updateResponse = await apiFetchAuth('/student/profile', user?.token || '', {
        method: 'PUT',
        body: profileData,
      });

             if (updateResponse.ok) {
         // Update the user context with new profile data
         if (user) {
           const updatedUser = { ...user, ...updateResponse.data };
           updateUser(updatedUser);
         }
         Alert.alert('Success', 'Profile updated successfully!', [
           { text: 'OK', onPress: () => navigation.navigate('profile' as never) }
         ]);
       } else {
         Alert.alert('Error', 'Failed to update profile. Please try again.');
       }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() }
      ]
    );
  };

  // Helper for initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

    return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.enhancedContent} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 50 }}
      >
        {/* Profile Photo Section */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }}
        >
          <LinearGradient
            colors={['#ffffff', '#f8fafc', '#e2e8f0']}
            style={styles.compactPhotoSection}
          >
            <View style={styles.compactAvatarContainer}>
              {uploadingPhoto ? (
                <LinearGradient
                  colors={['#667eea', '#764ba2', '#f093fb']}
                  style={styles.compactAvatarLoading}
                >
                  <ActivityIndicator size="small" color="#fff" />
                </LinearGradient>
              ) : profileData.profilePhoto ? (
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.compactAvatarRing}
                >
                  <Image
                    source={{ uri: profileData.profilePhoto }}
                    style={styles.compactAvatar}
                  />
                </LinearGradient>
              ) : (
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.compactAvatarPlaceholder}
                >
                  <Text style={styles.compactAvatarInitials}>
                    {getInitials(profileData.name)}
                  </Text>
                </LinearGradient>
              )}
              
              <TouchableOpacity
                onPress={handleProfilePhotoUpload}
                disabled={uploadingPhoto}
                style={[
                  styles.compactEditAvatarButton,
                  uploadingPhoto && styles.compactEditAvatarButtonDisabled
                ]}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.compactEditAvatarIcon}
                >
                  <Ionicons name="camera" size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
                         <Text style={styles.enhancedPhotoLabel}>📸 Tap to change photo</Text>
             <Text style={styles.enhancedPhotoSubtext}>Make your profile picture stand out!</Text>
           </LinearGradient>
         </Animated.View>

        {/* Enhanced Form Fields with Animations */}
        <Animated.View 
          style={[
            styles.enhancedFormSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Name Field */}
          <View style={styles.enhancedInputGroup}>
            <View style={styles.enhancedInputLabelContainer}>
                             <LinearGradient
                 colors={['#667eea', '#764ba2']}
                 style={styles.inputIconContainer}
               >
                <Ionicons name="person" size={20} color="#fff" />
              </LinearGradient>
              <Text style={styles.enhancedInputLabel}>Full Name *</Text>
            </View>
                         <View style={styles.inputContainer}>
               <TextInput
                 style={styles.input}
                 value={profileData.name}
                 onChangeText={(text) => setProfileData(prev => ({ ...prev, name: text }))}
                 placeholder="Enter your full name"
                 placeholderTextColor="#94a3b8"
               />
             </View>
          </View>

          

          {/* Bio Field */}
          <View style={styles.enhancedInputGroup}>
            <View style={styles.enhancedInputLabelContainer}>
                             <LinearGradient
                 colors={['#4facfe', '#00f2fe']}
                 style={styles.inputIconContainer}
               >
                <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
              </LinearGradient>
              <Text style={styles.enhancedInputLabel}>Bio</Text>
            </View>
            <LinearGradient
              colors={['#ffffff', '#f8fafc', '#e2e8f0']}
              style={styles.enhancedInputContainer}
            >
              <TextInput
                style={[styles.enhancedInput, styles.enhancedTextArea]}
                value={profileData.bio}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, bio: text }))}
                placeholder="Tell us about yourself, your interests, or what you're studying..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </LinearGradient>
          </View>

          {/* Course and Year Row */}
          <View style={styles.enhancedRow}>
            <View style={[styles.enhancedInputGroup, styles.enhancedHalfWidth]}>
              <View style={styles.enhancedInputLabelContainer}>
                                 <LinearGradient
                   colors={['#10B981', '#059669']}
                   style={styles.inputIconContainer}
                 >
                  <Ionicons name="school" size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.enhancedInputLabel}>Course</Text>
              </View>
              <LinearGradient
                colors={['#ffffff', '#f8fafc', '#e2e8f0']}
                style={styles.enhancedInputContainer}
              >
                <TextInput
                  style={styles.enhancedInput}
                  value={profileData.course}
                  onChangeText={(text) => setProfileData(prev => ({ ...prev, course: text }))}
                  placeholder="e.g., Computer Science"
                  placeholderTextColor="#94a3b8"
                />
              </LinearGradient>
            </View>

            <View style={[styles.enhancedInputGroup, styles.enhancedHalfWidth]}>
              <View style={styles.enhancedInputLabelContainer}>
                                 <LinearGradient
                   colors={['#F59E0B', '#D97706']}
                   style={styles.inputIconContainer}
                 >
                  <Ionicons name="calendar" size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.enhancedInputLabel}>Year</Text>
              </View>
              <LinearGradient
                colors={['#ffffff', '#f8fafc', '#e2e8f0']}
                style={styles.enhancedInputContainer}
              >
                <TextInput
                  style={styles.enhancedInput}
                  value={profileData.year}
                  onChangeText={(text) => setProfileData(prev => ({ ...prev, year: text }))}
                  placeholder="e.g., 2025"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                />
              </LinearGradient>
            </View>
          </View>

                                 {/* Enhanced Privacy Switch */}
            <LinearGradient
              colors={['#ffffff', '#f8fafc', '#e2e8f0']}
              style={styles.enhancedSwitchGroup}
            >
              <View style={styles.enhancedSwitchContent}>
                <View style={styles.enhancedSwitchLabelContainer}>
                  <LinearGradient
                    colors={['#EF4444', '#DC2626']}
                    style={styles.enhancedSwitchIconContainer}
                  >
                    <Ionicons name="lock-closed" size={24} color="#fff" />
                  </LinearGradient>
                  <View style={styles.enhancedSwitchTextContainer}>
                    <Text style={styles.enhancedSwitchLabel}>🔒 Private Profile</Text>
                    <Text style={styles.enhancedSwitchDescription}>Only approved followers can see your posts and profile</Text>
                  </View>
                </View>
                <Switch
                  value={profileData.isPrivate}
                  onValueChange={(value) => setProfileData(prev => ({ ...prev, isPrivate: value }))}
                  trackColor={{ false: '#e2e8f0', true: '#667eea' }}
                  thumbColor={profileData.isPrivate ? '#fff' : '#f4f3f4'}
                  ios_backgroundColor="#e2e8f0"
                />
              </View>
            </LinearGradient>

            {/* Save Button */}
            <View style={styles.saveButtonContainer}>
              <TouchableOpacity
                onPress={handleSave}
                disabled={loading}
                style={[
                  styles.saveButton,
                  loading && styles.saveButtonDisabled
                ]}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.saveButtonGradient}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
            
          </Animated.View>
       </ScrollView>
    </View>
   );
 }

 const styles = StyleSheet.create({
   container: {
     flex: 1,
     backgroundColor: '#f8f9fa',
   },
   // Simple Header Styles
   simpleHeader: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     paddingTop: 50,
     paddingBottom: 20,
     paddingHorizontal: 20,
     backgroundColor: '#fff',
     borderBottomWidth: 1,
     borderBottomColor: '#e2e8f0',
   },
   backButton: {
     padding: 8,
   },
   saveButton: {
     borderRadius: 12,
     overflow: 'hidden',
     shadowColor: '#10B981',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.3,
     shadowRadius: 8,
     elevation: 6,
   },
   saveButtonGradient: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     paddingVertical: 12,
     paddingHorizontal: 20,
     borderRadius: 12,
   },
   saveButtonText: {
     color: '#fff',
     fontSize: 16,
     fontWeight: '700',
     marginLeft: 6,
     letterSpacing: 0.3,
   },
       saveButtonDisabled: {
      opacity: 0.6,
    },
    // Bottom Save Button Styles
    bottomSaveContainer: {
      paddingHorizontal: 20,
      paddingVertical: 20,
      backgroundColor: '#fff',
      borderTopWidth: 1,
      borderTopColor: '#e2e8f0',
    },
    bottomSaveButton: {
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
         bottomSaveButtonGradient: {
       flexDirection: 'row',
       alignItems: 'center',
       justifyContent: 'center',
       paddingVertical: 16,
       paddingHorizontal: 24,
       borderRadius: 16,
     },
     // Inline Save Button Styles
     inlineSaveContainer: {
       marginTop: 24,
       marginBottom: 20,
     },
     inlineSaveButton: {
       borderRadius: 16,
       overflow: 'hidden',
       shadowColor: '#10B981',
       shadowOffset: { width: 0, height: 4 },
       shadowOpacity: 0.3,
       shadowRadius: 8,
       elevation: 6,
     },
     inlineSaveButtonGradient: {
       flexDirection: 'row',
       alignItems: 'center',
       justifyContent: 'center',
       paddingVertical: 16,
       paddingHorizontal: 24,
       borderRadius: 16,
     },
   // Input Styles
   inputContainer: {
     backgroundColor: '#fff',
     borderRadius: 12,
     borderWidth: 2,
     borderColor: '#e2e8f0',
     paddingHorizontal: 16,
     paddingVertical: 4,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.05,
     shadowRadius: 8,
     elevation: 2,
   },
   input: {
     fontSize: 16,
     color: '#1e293b',
     paddingVertical: 16,
     paddingHorizontal: 0,
   },
   inputIconContainer: {
     width: 40,
     height: 40,
     borderRadius: 20,
     justifyContent: 'center',
     alignItems: 'center',
     marginRight: 12,
   },
  // Enhanced Header Styles
  enhancedHeader: {
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
  },
  enhancedHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  enhancedHeaderButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  enhancedHeaderButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  enhancedHeaderTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  enhancedHeaderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  enhancedHeaderSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  enhancedSaveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  enhancedSaveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  enhancedSaveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  enhancedSaveButtonDisabled: {
    opacity: 0.6,
  },
     // Enhanced Content Styles
   enhancedContent: {
     flex: 1,
   },
   // Compact Photo Section Styles
   compactPhotoSection: {
     alignItems: 'center',
     paddingVertical: 20,
     paddingHorizontal: 20,
     marginBottom: 16,
     borderRadius: 16,
     marginHorizontal: 16,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.05,
     shadowRadius: 8,
     elevation: 3,
   },
   compactAvatarContainer: {
     position: 'relative',
     marginBottom: 12,
   },
   compactAvatar: {
     width: 60,
     height: 60,
     borderRadius: 30,
   },
   compactAvatarRing: {
     width: 60,
     height: 60,
     borderRadius: 30,
     padding: 2,
     justifyContent: 'center',
     alignItems: 'center',
   },
   compactAvatarPlaceholder: {
     width: 60,
     height: 60,
     borderRadius: 30,
     justifyContent: 'center',
     alignItems: 'center',
   },
   compactAvatarInitials: {
     fontSize: 20,
     fontWeight: 'bold',
     color: '#fff',
     textShadowColor: 'rgba(0, 0, 0, 0.3)',
     textShadowOffset: { width: 0, height: 1 },
     textShadowRadius: 2,
   },
   compactAvatarLoading: {
     width: 60,
     height: 60,
     borderRadius: 30,
     justifyContent: 'center',
     alignItems: 'center',
   },
   compactEditAvatarButton: {
     position: 'absolute',
     bottom: -2,
     right: -2,
   },
   compactEditAvatarIcon: {
     width: 24,
     height: 24,
     borderRadius: 12,
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 2,
     borderColor: '#fff',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.2,
     shadowRadius: 4,
     elevation: 4,
   },
   compactEditAvatarButtonDisabled: {
     opacity: 0.5,
   },
   compactPhotoLabel: {
     fontSize: 12,
     fontWeight: '500',
     color: '#6B7280',
     textAlign: 'center',
   },
  // Enhanced Photo Section Styles
  enhancedPhotoSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  enhancedAvatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  enhancedAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  enhancedAvatarRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enhancedAvatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enhancedAvatarInitials: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  enhancedAvatarLoading: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enhancedEditAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  enhancedEditAvatarIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  enhancedEditAvatarButtonDisabled: {
    opacity: 0.5,
  },
  enhancedPhotoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  enhancedPhotoSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Enhanced Form Section Styles
  enhancedFormSection: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  enhancedInputGroup: {
    marginBottom: 24,
  },
  enhancedInputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  enhancedInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  enhancedInputContainer: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  enhancedInput: {
    fontSize: 16,
    color: '#1e293b',
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
  enhancedTextArea: {
    height: 120,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  enhancedRow: {
    flexDirection: 'row',
    gap: 16,
  },
  enhancedHalfWidth: {
    flex: 1,
  },
  // Enhanced Switch Styles
  enhancedSwitchGroup: {
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  enhancedSwitchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  enhancedSwitchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  enhancedSwitchIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  enhancedSwitchTextContainer: {
    flex: 1,
  },
  enhancedSwitchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
     enhancedSwitchDescription: {
     fontSize: 14,
     color: '#6B7280',
     lineHeight: 20,
   },
   // Save Button Container Styles
   saveButtonContainer: {
     marginTop: 32,
     paddingHorizontal: 16,
   },
   // Legacy styles for backward compatibility
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    padding: 8,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
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
  avatarLoading: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  editAvatarIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  editAvatarButtonDisabled: {
    backgroundColor: '#ccc',
  },
  photoLabel: {
    fontSize: 14,
    color: '#666',
  },
  formSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 20,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#666',
  },
}); 