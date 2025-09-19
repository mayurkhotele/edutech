import { AppColors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface FeatureItem {
  id: string;
  title: string;
  icon: string;
  route: string;
  color: string;
}

const features: FeatureItem[] = [
  {
    id: '1',
    title: 'Live Exam',
    icon: 'play-circle',
    route: '/(tabs)/exam',
    color: '#FF6B6B'
  },
  {
    id: '2',
    title: 'Practice Exam',
    icon: 'library',
    route: '/(tabs)/practice-exam',
    color: '#4ECDC4'
  },
  {
    id: '3',
    title: "Who's the Spy",
    icon: 'eye',
    route: '/(tabs)/spy-game',
    color: '#45B7D1'
  },
  {
    id: '4',
    title: 'Battle Quiz',
    icon: 'trophy',
    route: '/(tabs)/battle-quiz',
    color: '#96CEB4'
  },
  {
    id: '5',
    title: 'Social Media',
    icon: 'people',
    route: '/(tabs)/social',
    color: '#FECA57'
  },
  {
    id: '6',
    title: 'Exam Notifications',
    icon: 'notifications',
    route: '/(tabs)/notifications',
    color: '#FF9FF3'
  },
  {
    id: '7',
    title: 'Timetable',
    icon: 'calendar',
    route: '/(tabs)/timetable',
    color: '#54A0FF'
  },
  {
    id: '8',
    title: '24/7 Support',
    icon: 'headset',
    route: '/(tabs)/support',
    color: '#81C784'
  }
];

const OurFeaturesSection: React.FC = () => {
  const router = useRouter();

  const handleFeaturePress = (feature: FeatureItem) => {
    console.log(`Navigate to ${feature.title}`);
    router.push(feature.route as any);
  };

  const renderFeatureItem = (feature: FeatureItem, isSecondRow: boolean = false) => (
    <TouchableOpacity
      key={feature.id}
      style={[styles.featureItem, isSecondRow && styles.secondRowItem]}
      onPress={() => handleFeaturePress(feature)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: feature.color }]}>
        <Ionicons name={feature.icon as any} size={20} color="#fff" />
      </View>
      <Text style={[styles.featureTitle, isSecondRow && styles.secondRowTitle]}>
        {feature.title}
      </Text>
    </TouchableOpacity>
  );

  // Split features into two rows: first 4, then remaining 4
  const firstRowFeatures = features.slice(0, 4);
  const secondRowFeatures = features.slice(4, 8);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Our Features</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      
      {/* First Row - 4 items */}
      <View style={styles.featuresRow}>
        {firstRowFeatures.map((feature) => renderFeatureItem(feature, false))}
      </View>
      
      {/* Second Row - 4 items */}
      <View style={styles.featuresRow}>
        {secondRowFeatures.map((feature) => renderFeatureItem(feature, true))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: '500',
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  featureItem: {
    width: (screenWidth - 100) / 4, // 4 items in first row
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#e9ecef',
  },
  // Special styling for second row items (4 items)
  secondRowItem: {
    width: (screenWidth - 100) / 4, // 4 items in second row
  },
  secondRowTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    lineHeight: 14,
  },
  iconContainer: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    lineHeight: 14,
  },
});

export default OurFeaturesSection;
