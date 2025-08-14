import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Clipboard, Dimensions, Image, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const { user } = useAuth();

  const fetchTicketDetails = async () => {
    if (!user?.token) return;

    try {
      setLoading(true);
      const response = await apiFetchAuth('/student/referral/stats', user.token);
      
      if (response.ok) {
        setData(response.data);
      } else {
        Alert.alert('Error', 'Failed to load referral data.');
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
      Alert.alert('Error', 'Failed to load referral data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTicketDetails();
  };

  useFocusEffect(
    React.useCallback(() => {
      if (!user?.token) return;
      fetchTicketDetails();
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading your referral stats...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#667eea']}
          tintColor="#667eea"
        />
      }
    >
      {/* Enhanced Header */}
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="gift" size={28} color="#fff" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Refer & Earn</Text>
            <Text style={styles.headerSubtitle}>
              Invite friends and earn <Text style={styles.earningsHighlight}>₹100</Text> for each referral!
            </Text>
          </View>
        </View>
        
        {/* Floating Stats Preview */}
        <View style={styles.floatingStats}>
          <View style={styles.floatingStatItem}>
            <Text style={styles.floatingStatValue}>{data?.referralCount || 0}</Text>
            <Text style={styles.floatingStatLabel}>Referrals</Text>
          </View>
          <View style={styles.floatingStatDivider} />
          <View style={styles.floatingStatItem}>
            <Text style={styles.floatingStatValue}>₹{data?.totalEarnings || 0}</Text>
            <Text style={styles.floatingStatLabel}>Earned</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Enhanced Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <LinearGradient 
            colors={["#a18cd1", "#fbc2eb"]} 
            style={styles.statsCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.statsIconContainer}>
              <Ionicons name="people" size={24} color="#fff" />
            </View>
            <Text style={styles.statsValue}>{data?.referralCount || 0}</Text>
            <Text style={styles.statsLabel}>Total Referrals</Text>
          </LinearGradient>
          
          <LinearGradient 
            colors={["#43e97b", "#38f9d7"]} 
            style={styles.statsCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.statsIconContainer}>
              <Ionicons name="cash" size={24} color="#fff" />
            </View>
            <Text style={styles.statsValue}>₹{data?.totalEarnings || 0}</Text>
            <Text style={styles.statsLabel}>Total Earnings</Text>
          </LinearGradient>
        </View>
        
        <LinearGradient 
          colors={["#f7971e", "#ffd200"]} 
          style={styles.potentialCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.potentialContent}>
            <View style={styles.potentialIconContainer}>
              <Ionicons name="trending-up" size={28} color="#fff" />
            </View>
            <View style={styles.potentialTextContainer}>
              <Text style={styles.potentialLabel}>Potential Earnings</Text>
              <Text style={styles.potentialValue}>₹{(data?.referralCount || 0) * 100}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Enhanced Referral Code Card */}
      <View style={styles.referralCodeSection}>
        <Text style={styles.sectionTitle}>Your Referral Code</Text>
        <View style={styles.referralCard}>
          <View style={styles.referralCardContent}>
            <View style={styles.codeContainer}>
              <Ionicons name="key" size={24} color="#667eea" style={styles.codeIcon} />
              <View style={styles.codeTextContainer}>
                <Text style={styles.codeLabel}>Share this code with friends</Text>
                <Text
                  selectable
                  style={styles.referralCode}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {data?.referralCode || 'XXXX-XXXX'}
                </Text>
              </View>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
                <Ionicons 
                  name={copied ? "checkmark-circle" : "copy-outline"} 
                  size={20} 
                  color="#667eea" 
                />
                <Text style={styles.copyButtonText}>
                  {copied ? "Copied!" : "Copy"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareButton} onPress={() => handleShare('Share')}>
                <Ionicons name="share-social-outline" size={20} color="#667eea" />
                <Text style={styles.shareButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* How It Works Section */}
      <View style={styles.howItWorksSection}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.stepsContainer}>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Share Your Code</Text>
              <Text style={styles.stepDescription}>Send your referral code to friends and family</Text>
            </View>
          </View>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>They Sign Up</Text>
              <Text style={styles.stepDescription}>Your friends register using your code</Text>
            </View>
          </View>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Earn Rewards</Text>
              <Text style={styles.stepDescription}>You both get ₹100 instantly!</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Enhanced Referrals List */}
      <View style={styles.referralsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>People You've Referred</Text>
          <Text style={styles.referralsCount}>{data?.referrals?.length || 0} referrals</Text>
        </View>
        
        {data?.referrals && data.referrals.length > 0 ? (
          <View style={styles.referralsList}>
            {data.referrals.map((item, index) => (
              <View style={styles.referralItemCard} key={item.id}>
                {renderAvatar(item, index)}
                <View style={styles.referralInfo}>
                  <Text style={styles.referralName} numberOfLines={1} ellipsizeMode="tail">
                    {item.name}
                  </Text>
                  <Text style={styles.referralEmail} numberOfLines={1} ellipsizeMode="middle">
                    {item.email}
                  </Text>
                  <Text style={styles.referralDate}>
                    Joined {timeAgo(item.joinedAt)}
                  </Text>
                </View>
                <LinearGradient 
                  colors={["#43e97b", "#38f9d7"]} 
                  style={styles.earnedBadge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  <Text style={styles.earnedText}>+₹100</Text>
                </LinearGradient>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="people-outline" size={48} color="#ccc" />
            </View>
            <Text style={styles.emptyTitle}>No Referrals Yet</Text>
            <Text style={styles.emptyDescription}>
              Start sharing your referral code to earn rewards!
            </Text>
          </View>
        )}
      </View>

      {/* Enhanced FAQ Section */}
      <View style={styles.faqSection}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {faqList.map((faq, idx) => (
          <View key={idx} style={styles.faqItem}>
            <TouchableOpacity 
              onPress={() => setFaqOpen(faqOpen === idx ? null : idx)} 
              style={styles.faqQuestion}
              activeOpacity={0.7}
            >
              <View style={styles.faqQuestionContent}>
                <Ionicons 
                  name={faqOpen === idx ? "chevron-down" : "chevron-forward"} 
                  size={20} 
                  color="#667eea" 
                />
                <Text style={styles.faqQuestionText}>{faq.q}</Text>
              </View>
            </TouchableOpacity>
            {faqOpen === idx && (
              <View style={styles.faqAnswer}>
                <Text style={styles.faqAnswerText}>{faq.a}</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const faqList = [
  {
    q: 'What is the Refer and Earn Program?',
    a: 'Our Refer and Earn program rewards you with ₹100 for every friend who signs up using your referral code. It\'s our way of thanking you for spreading the word about Yottascore!',
  },
  {
    q: 'How does the referral process work?',
    a: 'Simply share your unique referral code with friends. When they register and use your code, both you and your friend will instantly receive ₹100 in your accounts.',
  },
  {
    q: 'Where can I use my earnings?',
    a: 'Your referral earnings can be used to purchase exam packages, practice tests, or any other services available in the app. The money is added directly to your wallet.',
  },
  {
    q: 'Is there a limit to referrals?',
    a: 'No! You can refer as many friends as you want. Each successful referral earns you ₹100, so the more friends you invite, the more you earn.',
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
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  earningsHighlight: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  floatingStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  floatingStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  floatingStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  floatingStatLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  floatingStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statsContainer: {
    marginTop: -10,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statsCard: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  statsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statsLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  potentialCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  potentialContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  potentialIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  potentialTextContainer: {
    flex: 1,
  },
  potentialLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  potentialValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  referralCodeSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  referralCard: {
    backgroundColor: 'rgba(248, 249, 250, 0.9)',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.15)',
  },
  referralCardContent: {
    alignItems: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  codeIcon: {
    marginRight: 12,
  },
  codeTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  codeLabel: {
    color: '#495057',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  referralCode: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    backgroundColor: 'rgba(108, 117, 125, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    letterSpacing: 2,
    borderWidth: 1,
    borderColor: 'rgba(108, 117, 125, 0.15)',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  copyButtonText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  shareButtonText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  howItWorksSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  stepsContainer: {
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  referralsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  referralsCount: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  referralsList: {
    gap: 12,
  },
  referralItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  avatarImgWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 16,
    backgroundColor: '#f3eaff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  referralInfo: {
    flex: 1,
  },
  referralName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  referralEmail: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  referralDate: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '500',
  },
  earnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#43e97b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  earnedText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
  faqSection: {
    paddingHorizontal: 20,
  },
  faqItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  faqQuestion: {
    padding: 20,
  },
  faqQuestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 12,
  },
  faqAnswer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    marginLeft: 32,
  },
}); 