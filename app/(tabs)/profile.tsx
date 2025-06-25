import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { apiFetchAuth } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

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

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#6C63FF" />;
  }
  if (error) {
    return <Text style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>{error}</Text>;
  }

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
      {/* Profile Card */}
      <View style={styles.profileCard}>
        {/* Profile Photo */}
        {profile.profilePhoto ? (
          <Image source={{ uri: profile.profilePhoto }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>{getInitials(profile.name)}</Text>
          </View>
        )}
        {/* Name & Email */}
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.email}>{profile.email}</Text>
        {/* Course/Year */}
        {(profile.course || profile.year) && (
          <Text style={styles.meta}>{[profile.course, profile.year].filter(Boolean).join(' • ')}</Text>
        )}
        {/* Bio */}
        {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
        {/* Counts Row */}
        <View style={styles.countsRow}>
          <View style={styles.countItem}>
            <Text style={styles.countNumber}>{profile._count?.followers || 0}</Text>
            <Text style={styles.countLabel}>Followers</Text>
          </View>
          <View style={styles.countItem}>
            <Text style={styles.countNumber}>{profile._count?.following || 0}</Text>
            <Text style={styles.countLabel}>Following</Text>
          </View>
          <View style={styles.countItem}>
            <Text style={styles.countNumber}>{profile._count?.posts || 0}</Text>
            <Text style={styles.countLabel}>Posts</Text>
          </View>
        </View>
        {/* Edit Profile Button */}
        <TouchableOpacity style={styles.editBtn}>
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    width: width - 32,
    backgroundColor: '#fff',
    borderRadius: 22,
    alignItems: 'center',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 6,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12,
    backgroundColor: '#eee',
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 36,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 22,
    color: '#222',
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    color: '#888',
    marginBottom: 6,
  },
  meta: {
    fontSize: 14,
    color: '#6C63FF',
    marginBottom: 6,
  },
  bio: {
    fontSize: 15,
    color: '#444',
    marginBottom: 10,
    textAlign: 'center',
  },
  countsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 18,
  },
  countItem: {
    alignItems: 'center',
    flex: 1,
  },
  countNumber: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#222',
  },
  countLabel: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 10,
  },
  editBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
}); 