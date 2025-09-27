import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import CreatePost from '../../components/CreatePost';
import SocialFeed from '../../components/SocialFeed';

const { width } = Dimensions.get('window');

export default function SocialScreen() {
  const navigation = useNavigation<any>();
  const [createPostVisible, setCreatePostVisible] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Debug navigation object
  console.log('🔍 SocialScreen - Navigation object:', navigation);
  console.log('🔍 SocialScreen - Navigation type:', typeof navigation);
  console.log('🔍 SocialScreen - Navigation methods:', Object.keys(navigation || {}));

  const handlePostCreated = () => {
    // Trigger refresh of the social feed when a new post is created
    setRefreshTrigger(prev => prev + 1);
  };

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Trigger a refresh when the screen comes into focus
      setRefreshTrigger(prev => prev + 1);
    }, [])
  );

  return (
    <View style={styles.container}>
      <SocialFeed refreshTrigger={refreshTrigger} navigation={navigation} />
      
      {/* Enhanced Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setCreatePostVisible(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#FF6B6B', '#FF8E53']}
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
    position: 'relative',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#FF6B6B',
    shadowOffset: {
      width: 0,
      height: 6,
    },
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
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
}); 