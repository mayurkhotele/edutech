import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, Clipboard, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const referralCode = 'ABCDG123';

export default function ReferScreen() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    Clipboard.setString(referralCode);
    setCopied(true);
    Alert.alert('Copied!', 'Referral code copied to clipboard.');
    setTimeout(() => setCopied(false), 1500);
  };

  const handleShare = (platform: string) => {
    Alert.alert('Share', `Share via ${platform}`);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ flexGrow: 1 }}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.card}>
          <View style={styles.giftCircle}>
            <Ionicons name="gift" size={48} color="#fff" />
          </View>
          <Text style={styles.pointsText}>100<Text style={{ fontSize: 18 }}>✦</Text></Text>
          <Text style={styles.loyaltyText}>LoyaltyPoints</Text>
          <Text style={styles.descText}>
            Your friend gets 100 TimesPoints on sign up and, you get 100 TimesPoints too everytime!
          </Text>
          <View style={styles.referralBox}>
            <Text style={styles.referralLabel}>Your referral code</Text>
            <View style={styles.referralRow}>
              <Text style={styles.referralCode}>{referralCode}</Text>
              <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                <Text style={styles.copyBtnText}>{copied ? 'Copied' : 'Copy Code'}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.shareText}>Share your Referral Code via</Text>
          <View style={styles.shareRow}>
            <TouchableOpacity style={[styles.shareBtn, { backgroundColor: '#229ED9' }]} onPress={() => handleShare('Telegram')}>
              <FontAwesome name="telegram" size={22} color="#fff" />
              <Text style={styles.shareBtnText}>Telegram</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shareBtn, { backgroundColor: '#1877F3' }]} onPress={() => handleShare('Facebook')}>
              <FontAwesome name="facebook" size={22} color="#fff" />
              <Text style={styles.shareBtnText}>Facebook</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shareBtn, { backgroundColor: '#25D366' }]} onPress={() => handleShare('WhatsApp')}>
              <FontAwesome name="whatsapp" size={22} color="#fff" />
              <Text style={styles.shareBtnText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      {/* FAQ Section */}
      <View style={styles.faqSection}>
        <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqItem}>
          <Text style={styles.faqQ}>What is Refer and Earn Program?</Text>
          <Text style={styles.faqA}>Invite friends and earn loyalty points when they sign up using your code.</Text>
        </View>
        <View style={styles.faqItem}>
          <Text style={styles.faqQ}>How it works?</Text>
          <Text style={styles.faqA}>Share your referral code. When your friend signs up, both of you get points.</Text>
        </View>
        <View style={styles.faqItem}>
          <Text style={styles.faqQ}>Where can I use these LoyaltyPoints?</Text>
          <Text style={styles.faqA}>You can redeem points for rewards in the app.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  gradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: 'center',
  },
  card: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 18,
  },
  giftCircle: {
    backgroundColor: '#FFB300',
    borderRadius: 50,
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  pointsText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  loyaltyText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  descText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 18,
    marginTop: 2,
    paddingHorizontal: 8,
  },
  referralBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  referralLabel: {
    color: '#764ba2',
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 6,
  },
  referralRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  referralCode: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: '#6C63FF',
    backgroundColor: '#f3eaff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  copyBtn: {
    marginLeft: 12,
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  copyBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  shareText: {
    color: '#fff',
    fontSize: 15,
    marginTop: 8,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  shareRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 6,
    marginTop: 4,
  },
  shareBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
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
  },
  faqQ: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 15,
    marginBottom: 2,
  },
  faqA: {
    color: '#666',
    fontSize: 14,
    marginLeft: 4,
  },
}); 