import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface MembershipTier {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  period: string;
  features: string[];
  isPopular?: boolean;
  isPremium?: boolean;
  gradient: string[];
  icon: string;
  badge?: string;
}

const membershipTiers: MembershipTier[] = [
  {
    id: 'premium',
    name: 'Premium',
    price: '₹799',
    originalPrice: '₹1499',
    period: 'per month',
    features: [
      'Unlimited practice questions',
      'Unlimited exam attempts',
      'Advanced progress analytics',
      'Priority support',
      'Premium study materials',
      'Mock test series',
      'Performance insights',
      '1-on-1 expert tutoring',
      'Custom study plans',
      'Advanced AI recommendations',
      '24/7 priority support',
      'Exclusive study groups',
      'Career counseling',
      'Interview preparation',
      'Certificate programs'
    ],
    isPremium: true,
    gradient: ['#8B5CF6', '#7C3AED'],
    icon: 'diamond-outline',
    badge: 'Premium Plan'
  }
];

export default function MembershipScreen() {
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<string>('premium');

  const handleSubscribe = (tierId: string) => {
    // Handle subscription logic here
    console.log('Subscribing to:', tierId);
    // You can add payment gateway integration here
  };

  const renderFeature = (feature: string, index: number) => (
    <View key={index} style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
      </View>
      <Text style={styles.featureText}>{feature}</Text>
    </View>
  );

  const renderMembershipCard = (tier: MembershipTier) => (
    <TouchableOpacity
      key={tier.id}
      style={[
        styles.membershipCard,
        selectedTier === tier.id && styles.selectedCard
      ]}
      onPress={() => setSelectedTier(tier.id)}
    >
      {tier.badge && (
        <View style={styles.badgeContainer}>
          <LinearGradient
            colors={tier.isPremium ? ['#FFD700', '#FFA500'] : ['#FF6B6B', '#FF5252']}
            style={styles.badge}
          >
            <Text style={styles.badgeText}>{tier.badge}</Text>
          </LinearGradient>
        </View>
      )}

      <LinearGradient
        colors={tier.gradient}
        style={styles.cardHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.cardIconContainer}>
          <Ionicons name={tier.icon as any} size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.cardName}>{tier.name}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{tier.price}</Text>
          {tier.originalPrice && (
            <Text style={styles.originalPrice}>{tier.originalPrice}</Text>
          )}
        </View>
        <Text style={styles.period}>{tier.period}</Text>
      </LinearGradient>

      <View style={styles.cardContent}>
        <View style={styles.featuresList}>
          {tier.features.map((feature, index) => renderFeature(feature, index))}
        </View>

        <TouchableOpacity
          style={[
            styles.subscribeButton,
            selectedTier === tier.id && styles.selectedSubscribeButton
          ]}
          onPress={() => handleSubscribe(tier.id)}
        >
          <LinearGradient
            colors={
              selectedTier === tier.id
                ? ['#10B981', '#059669']
                : ['#6B7280', '#4B5563']
            }
            style={styles.subscribeButtonGradient}
          >
            <Text style={styles.subscribeButtonText}>
              {tier.price === 'Free' ? 'Get Started' : 'Subscribe Now'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
              {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Choose Your Plan</Text>
          </View>
        </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>


        {/* Membership Tiers */}
        <View style={styles.tiersSection}>
          <Text style={styles.premiumTitle}>Premium Membership</Text>
          <View style={styles.tiersContainer}>
            {membershipTiers.map(renderMembershipCard)}
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
          <View style={styles.faqItem}>
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>
                Can I cancel my subscription anytime?
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </View>
            <Text style={styles.faqAnswer}>
              Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>
                Do you offer refunds?
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </View>
            <Text style={styles.faqAnswer}>
              We offer a 7-day money-back guarantee for all new subscriptions. If you're not satisfied, contact our support team.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>
                What payment methods do you accept?
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </View>
            <Text style={styles.faqAnswer}>
              We accept all major credit cards, debit cards, UPI, and digital wallets including Paytm, PhonePe, and Google Pay.
            </Text>
          </View>
        </View>

        {/* Contact Support */}
        <View style={styles.supportSection}>
          <LinearGradient
            colors={['#F3F4F6', '#E5E7EB']}
            style={styles.supportCard}
          >
            <View style={styles.supportIcon}>
              <Ionicons name="headset-outline" size={32} color="#4F46E5" />
            </View>
            <Text style={styles.supportTitle}>Need Help?</Text>
            <Text style={styles.supportDescription}>
              Our support team is available 24/7 to help you with any questions
            </Text>
            <TouchableOpacity style={styles.contactButton}>
              <Text style={styles.contactButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    position: 'absolute',
    top: 15,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  headerPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  patternCircle1: {
    position: 'absolute',
    top: 20,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  patternCircle2: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  patternCircle3: {
    position: 'absolute',
    top: 60,
    left: 50,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  tiersSection: {
    marginBottom: 40,
  },
  premiumTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1,
  },
  tiersContainer: {
    gap: 20,
  },
  membershipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#8B5CF6',
    transform: [{ scale: 1.02 }],
  },
  badgeContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cardHeader: {
    padding: 30,
    alignItems: 'center',
    position: 'relative',
  },
  cardIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.7)',
    textDecorationLine: 'line-through',
  },
  period: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  cardContent: {
    padding: 30,
  },
  featuresList: {
    marginBottom: 25,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    lineHeight: 20,
  },
  subscribeButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedSubscribeButton: {
    transform: [{ scale: 1.05 }],
  },
  subscribeButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  faqSection: {
    marginBottom: 40,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  supportSection: {
    marginBottom: 40,
  },
  supportCard: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  supportIcon: {
    marginBottom: 16,
  },
  supportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  supportDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  contactButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
