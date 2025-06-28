import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import CreatePost from '../../components/CreatePost';
import SocialFeed from '../../components/SocialFeed';

export default function SocialScreen() {
  const navigation = useNavigation();
  const [createPostVisible, setCreatePostVisible] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePostCreated = () => {
    // Trigger refresh of the social feed when a new post is created
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <View style={styles.container}>
      <SocialFeed refreshTrigger={refreshTrigger} navigation={navigation} />
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setCreatePostVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
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
    backgroundColor: '#F6F8FB',
    position: 'relative',
  },
  fab: {
    position: 'absolute',
    bottom: 100, // Increased from 30 to avoid tab bar
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10, // Increased elevation for Android
    zIndex: 1000, // Added zIndex for iOS
  },
}); 