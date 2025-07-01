import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Clipboard, Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { apiFetchAuth } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';

interface ReferralUser {
  id: string;
  name: string;
  email: string;
  profilePhoto: string | null;
  joinedAt: string;
}

interface ReferralStats {
  referralCode: string;
  referralCount: number;
  totalEarnings: number;
  referredBy: string | null;
  referrerInfo: any;
  referrals: ReferralUser[];
}

const { width: screenWidth } = Dimensions.get('window');

export default function ReferScreen() {
  const [data, setData] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const { user } = useAuth();

  useFocusEffect(
    React.useCallback(() => {
      if (!user?.token) return;
      setLoading(true);
      apiFetchAuth('/student/referral/stats', user.token)
        .then((res) => {
          setData(res.data);
          setLoading(false);
        })
        .catch((err) => {
          Alert.alert('Error', 'Failed to fetch referral data');
          setLoading(false);
        });
    }, [user])
  );

  const handleCopy = () => {
    if (data?.referralCode) {
      Clipboard.setString(data.referralCode);
      setCopied(true);
      Alert.alert('Copied!', 'Referral code copied to clipboard.');
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleShare = (platform: string) => {
    Alert.alert('Share', `Share via ${platform}`);
  };

  const renderAvatar = (user: ReferralUser, index: number) => {
    if (user.profilePhoto) {
      return (
        <View style={styles.avatarImgWrap}>
          <Image source={{ uri: user.profilePhoto }} style={styles.avatarImg} />
        </View>
      );
    }
    // Fallback: initials
    const initials = user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
    return (
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={styles.avatarCircle}
      >
        <Text style={styles.avatarText}>{initials || index + 1}</Text>
      </LinearGradient>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f7f9fb' }}
      contentContainerStyle={{ flexGrow: 1 }}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Ionicons name="gift" size={32} color="#fff" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <ThemedText type="title" style={styles.headerTitle}>Refer & Earn</ThemedText>
            <ThemedText type="subtitle" style={styles.headerSubtitle}>
              Invite friends and earn <Text style={{ color: '#fff', fontWeight: 'bold' }}>₹100</Text> for each successful referral!
            </ThemedText>
          </View>
        </View>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <LinearGradient colors={["#a18cd1", "#fbc2eb"]} style={styles.statsCard}>
          <Ionicons name="people" size={20} color="#fff" style={styles.statsIcon} />
          <Text style={styles.statsValue}>{data?.referralCount || 0}</Text>
          <Text style={styles.statsLabel}>Total Referrals</Text>
        </LinearGradient>
        <LinearGradient colors={["#43e97b", "#38f9d7"]} style={styles.statsCard}>
          <Ionicons name="cash" size={20} color="#fff" style={styles.statsIcon} />
          <Text style={styles.statsValue}>₹{data?.totalEarnings || 0}</Text>
          <Text style={styles.statsLabel}>Total Earnings</Text>
        </LinearGradient>
        <LinearGradient colors={["#f7971e", "#ffd200"]} style={styles.statsCard}>
          <Ionicons name="trending-up" size={20} color="#fff" style={styles.statsIcon} />
          <Text style={styles.statsValue}>₹{(data?.referralCount || 0) * 100}</Text>
          <Text style={styles.statsLabel}>Potential Earnings</Text>
        </LinearGradient>
      </View>

      {/* Referral Code Card */}
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.referralCard}>
        <View style={styles.referralCardContent}>
          <Ionicons name="key" size={28} color="#fff" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.referralCodeLabel}>Your Referral Code</Text>
            <Text
              selectable
              style={styles.referralCode}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {data?.referralCode || ''}
            </Text>
          </View>
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
            <Ionicons name={copied ? "checkmark" : "copy-outline"} size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareBtn} onPress={() => handleShare('Share')}>
            <Ionicons name="share-social-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.howItWorksBox}>
          <Ionicons name="information-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.howItWorksText}>
            Share your referral code with friends. When they register using your code, you'll earn <Text style={{ fontWeight: 'bold', color: '#fff' }}>₹100</Text> instantly!
          </Text>
        </View>
      </LinearGradient>

      {/* People you've referred */}
      <View style={styles.referredSection}>
        <Text style={styles.referredTitle}>People you've referred</Text>
        {data?.referrals && data.referrals.length > 0 ? (
          <View style={{ marginTop: 6 }}>
            {data.referrals.map((item, index) => (
              <View style={styles.referredCard} key={item.id}>
                {renderAvatar(item, index)}
                <View style={{ flex: 1 }}>
                  <Text style={styles.referredName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                  <Text style={styles.referredEmail} numberOfLines={1} ellipsizeMode="middle">{item.email}</Text>
                  <Text style={styles.referredJoined}>Joined {timeAgo(item.joinedAt)}</Text>
                </View>
                <LinearGradient colors={["#43e97b", "#38f9d7"]} style={styles.earnedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#fff" style={{ marginRight: 2 }} />
                  <Text style={styles.earnedText}>+₹100</Text>
                </LinearGradient>
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ color: '#888', marginTop: 10 }}>No referrals yet.</Text>
        )}
      </View>

      {/* FAQ Section */}
      <View style={styles.faqSection}>
        <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
        {faqList.map((faq, idx) => (
          <View key={idx} style={styles.faqItem}>
            <TouchableOpacity onPress={() => setFaqOpen(faqOpen === idx ? null : idx)} style={styles.faqQRow} activeOpacity={0.8}>
              <Ionicons name={faqOpen === idx ? "chevron-down" : "chevron-forward"} size={18} color="#764ba2" style={{ marginRight: 8 }} />
              <Text style={styles.faqQ}>{faq.q}</Text>
            </TouchableOpacity>
            {faqOpen === idx && <Text style={styles.faqA}>{faq.a}</Text>}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const faqList = [
  {
    q: 'What is Refer and Earn Program?',
    a: 'Invite friends and earn loyalty points when they sign up using your code.',
  },
  {
    q: 'How it works?',
    a: 'Share your referral code. When your friend signs up, both of you get points.',
  },
  {
    q: 'Where can I use these LoyaltyPoints?',
    a: 'You can redeem points for rewards in the app.',
  },
];

function timeAgo(dateString: string) {
  const now = new Date();
  const joined = new Date(dateString);
  const diff = Math.floor((now.getTime() - joined.getTime()) / 1000); // seconds
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

const styles = StyleSheet.create({
  headerGradient: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 12,
    paddingHorizontal: 18,
    marginBottom: 0,
    shadowColor: '#764ba2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 15,
    marginTop: 2,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginTop: -8,
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  statsCard: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 4,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#764ba2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 6,
  },
  statsIcon: {
    marginBottom: 2,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 1,
  },
  statsLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.92,
    textAlign: 'center',
  },
  referralCard: {
    marginHorizontal: 18,
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#764ba2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 10,
    elevation: 8,
  },
  referralCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  referralCodeLabel: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 2,
  },
  referralCode: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 2,
  },
  copyBtn: {
    marginLeft: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 8,
    padding: 8,
  },
  shareBtn: {
    marginLeft: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 8,
    padding: 8,
  },
  howItWorksBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 10,
    padding: 10,
    marginTop: 2,
  },
  howItWorksText: {
    color: '#fff',
    fontSize: 13,
    marginLeft: 4,
    flex: 1,
  },
  referredSection: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  referredTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#6C63FF',
    marginBottom: 12,
  },
  referredCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#764ba2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3eaff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#6C63FF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  avatarImgWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#f3eaff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  referredName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#333',
  },
  referredEmail: {
    color: '#888',
    fontSize: 13,
  },
  referredJoined: {
    color: '#6C63FF',
    fontSize: 12,
    marginTop: 2,
  },
  earnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
    shadowColor: '#43e97b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 6,
    elevation: 3,
  },
  earnedText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 2,
  },
  faqSection: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 32,
  },
  faqTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#6C63FF',
    marginBottom: 12,
  },
  faqItem: {
    marginBottom: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#764ba2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  faqQRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqQ: {
    fontWeight: 'bold',
    color: '#764ba2',
    fontSize: 15,
    marginBottom: 2,
  },
  faqA: {
    color: '#666',
    fontSize: 14,
    marginLeft: 26,
    marginTop: 2,
  },
}); 