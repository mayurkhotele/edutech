import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';

const medalColors = [
  '#FFD700', // Gold
  '#C0C0C0', // Silver
  '#CD7F32', // Bronze
];

const podiumHeights = [120, 90, 70];

const defaultAvatars = [
  require('../assets/images/avatar1.jpg'),
  require('../assets/images/avatar2.jpg'),
  require('../assets/images/avatar3.jpg'),
];

interface LeaderboardUser {
  name: string;
  points: number;
  subtitle?: string;
  avatar?: any;
  rank: number;
}

interface LeaderboardPodiumProps {
  data: LeaderboardUser[];
}

export default function LeaderboardPodium({ data }: LeaderboardPodiumProps) {
  // data: array of { name, points, subtitle, avatar, rank }
  const top3 = data.slice(0, 3);
  const others = data.slice(3);

  return (
    <View style={styles.container}>
      {/* Podium */}
      <View style={styles.podiumRow}>
        {/* 2nd Place */}
        <View style={[styles.podiumItem, { height: podiumHeights[1] }]}>  
          <View style={[styles.medalCircle, { backgroundColor: medalColors[1] }]}>  
            <MaterialCommunityIcons name="medal" size={32} color="#fff" />
          </View>
          <Image source={top3[1]?.avatar || defaultAvatars[1]} style={styles.avatar} />
          <Text style={styles.podiumName}>{top3[1]?.name || '-'}</Text>
          <Text style={styles.podiumPoints}>{top3[1]?.points?.toLocaleString() || '-'} PTS</Text>
          <Text style={styles.podiumRank}>2</Text>
        </View>
        {/* 1st Place */}
        <View style={[styles.podiumItem, styles.podiumFirst, { height: podiumHeights[0] }]}>  
          <View style={[styles.medalCircle, { backgroundColor: medalColors[0] }]}>  
            <MaterialCommunityIcons name="medal" size={36} color="#fff" />
          </View>
          <Image source={top3[0]?.avatar || defaultAvatars[0]} style={styles.avatar} />
          <Text style={styles.podiumName}>{top3[0]?.name || '-'}</Text>
          <Text style={styles.podiumPoints}>{top3[0]?.points?.toLocaleString() || '-'} PTS</Text>
          <Text style={styles.podiumRank}>1</Text>
        </View>
        {/* 3rd Place */}
        <View style={[styles.podiumItem, { height: podiumHeights[2] }]}>  
          <View style={[styles.medalCircle, { backgroundColor: medalColors[2] }]}>  
            <MaterialCommunityIcons name="medal" size={28} color="#fff" />
          </View>
          <Image source={top3[2]?.avatar || defaultAvatars[2]} style={styles.avatar} />
          <Text style={styles.podiumName}>{top3[2]?.name || '-'}</Text>
          <Text style={styles.podiumPoints}>{top3[2]?.points?.toLocaleString() || '-'} PTS</Text>
          <Text style={styles.podiumRank}>3</Text>
        </View>
      </View>
      {/* Others */}
      <FlatList
        data={others}
        keyExtractor={item => item.rank?.toString() || item.name}
        renderItem={({ item }) => (
          <View style={styles.otherRow}>
            <View style={styles.otherAvatarWrap}>
              <Ionicons name="person-circle" size={36} color="#bbb" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.otherName}>{item.name}</Text>
              {item.subtitle ? <Text style={styles.otherSubtitle}>{item.subtitle}</Text> : null}
            </View>
            <Text style={styles.otherRank}>#{item.rank}</Text>
            <Text style={styles.otherPoints}>{item.points?.toLocaleString()} Pts</Text>
          </View>
        )}
        style={styles.othersList}
        ListEmptyComponent={<Text style={styles.emptyText}>No more participants</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 24,
    alignItems: 'center',
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 32,
  },
  podiumItem: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 100,
    marginHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    paddingBottom: 12,
    position: 'relative',
  },
  podiumFirst: {
    zIndex: 2,
    elevation: 8,
    marginBottom: 0,
    transform: [{ translateY: -20 }],
  },
  medalCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    marginTop: -20,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 4,
    borderWidth: 2,
    borderColor: '#eee',
  },
  podiumName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
    textAlign: 'center',
  },
  podiumPoints: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
  podiumRank: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#aaa',
    marginTop: 2,
  },
  othersList: {
    width: '100%',
    marginTop: 8,
  },
  otherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 4,
    padding: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  otherAvatarWrap: {
    marginRight: 10,
  },
  otherName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
  },
  otherSubtitle: {
    fontSize: 12,
    color: '#888',
  },
  otherRank: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#888',
    marginHorizontal: 8,
  },
  otherPoints: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#222',
    marginLeft: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#aaa',
    marginVertical: 16,
  },
}); 