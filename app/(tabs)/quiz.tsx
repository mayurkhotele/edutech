import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Brain,
  CheckCircle,
  Clock,
  Key,
  Map,
  Plus,
  Star,
  TestTube,
  Trophy,
  Users,
  X,
  Zap
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { io, Socket } from 'socket.io-client';

const { width, height } = Dimensions.get('window');

interface QuestionCategory {
  id: string;
  name: string;
  color: string;
  description: string;
  questionCount: number;
}

interface BattleAmount {
  id: string;
  categoryId: string;
  amount: number;
  isActive: boolean;
  maxPlayers: number;
  createdAt: string;
  updatedAt: string;
}

export default function QuizScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [questionCategories, setQuestionCategories] = useState<QuestionCategory[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [roomCode, setRoomCode] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [scienceImageLoadError, setScienceImageLoadError] = useState(false);
  const [mathImageLoadError, setMathImageLoadError] = useState(false);
  
  // Amount selection modal states
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [battleAmounts, setBattleAmounts] = useState<BattleAmount[]>([]);
  const [selectedAmount, setSelectedAmount] = useState<BattleAmount | null>(null);
  const [loadingAmounts, setLoadingAmounts] = useState(false);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  
  // Smooth animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [cardScaleAnim] = useState(new Animated.Value(0.98));
  const [buttonPulseAnim] = useState(new Animated.Value(1));
  const [floatingAnim] = useState(new Animated.Value(0));
  const [glowAnim] = useState(new Animated.Value(0));
  const [sparkleAnim] = useState(new Animated.Value(0));
  
  // Category icon animations
  const [iconRotateAnim] = useState(new Animated.Value(0));
  const [iconBounceAnim] = useState(new Animated.Value(1));
  const [iconGlowAnim] = useState(new Animated.Value(0));
  
  // Modal animation values
  const [modalSlideAnim] = useState(new Animated.Value(height));
  const [modalFadeAnim] = useState(new Animated.Value(0));
  
  // Initialize socket connection
  useEffect(() => {
    if (user?.token) {
      const newSocket = io('http://192.168.1.4:3001', {
        auth: {
          token: user.token
        },
        transports: ['websocket', 'polling'],
        path: '/api/socket'
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user?.token]);

  const fetchQuestionCategories = async () => {
    if (!user?.token) return;
    
    try {
      console.log('Fetching question categories...');
      const response = await apiFetchAuth('/student/question-categories', user.token);
      if (response.ok) {
        const categories: QuestionCategory[] = response.data;
        console.log('Categories fetched successfully:', categories);
        setQuestionCategories(categories);
        // Remove automatic selection - no category should be preselected
      } else {
        console.error('Failed to fetch categories - response not ok');
      }
    } catch (error) {
      console.error('Failed to fetch question categories:', error);
    }
  };

  const fetchWalletBalance = async () => {
    if (!user?.token) return;
    
    try {
      const response = await apiFetchAuth('/student/wallet', user.token);
      if (response.ok) {
        setWalletBalance(response.data.balance || 0);
      }
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
    }
  };

  const fetchBattleAmounts = async (categoryId: string) => {
    if (!user?.token) return;
    
    try {
      setLoadingAmounts(true);
      console.log('Fetching battle amounts for category:', categoryId);
      const response = await apiFetchAuth(`/student/battle-quiz/amounts?categoryId=${categoryId}`, user.token);
      if (response.ok) {
        const amounts: BattleAmount[] = response.data;
        console.log('Battle amounts fetched successfully:', amounts);
        setBattleAmounts(amounts);
        return amounts;
      } else {
        console.error('Failed to fetch battle amounts - response not ok');
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch battle amounts:', error);
      return [];
    } finally {
      setLoadingAmounts(false);
    }
  };

  const handleCategoryPress = async (category: QuestionCategory) => {
    console.log('Category pressed:', category.name);
    setSelectedCategory(category.id);
    setSelectedCategoryName(category.name);
    
    // Fetch amounts for this category
    const amounts = await fetchBattleAmounts(category.id);
    if (amounts && amounts.length > 0) {
      // Show modal with animation
      setShowAmountModal(true);
      Animated.parallel([
        Animated.timing(modalFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(modalSlideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]).start();
    } else {
      Alert.alert('Error', 'No battle amounts available for this category');
    }
  };

  const closeAmountModal = () => {
    Animated.parallel([
      Animated.timing(modalFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(modalSlideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
    ]).start(() => {
      setShowAmountModal(false);
      setSelectedAmount(null);
    });
  };

  const handleAmountSelect = (amount: BattleAmount) => {
    setSelectedAmount(amount);
  };

  const handlePlayNow = () => {
    if (!selectedAmount) {
      Alert.alert('Error', 'Please select an amount to play');
      return;
    }

    if (!socket) {
      Alert.alert('Error', 'Not connected to server');
      return;
    }

    console.log('Starting battle with amount:', selectedAmount);
    closeAmountModal();
    
    router.push({
      pathname: '/(tabs)/matchmaking',
      params: { 
        category: selectedCategory,
        amount: selectedAmount.amount.toString(),
        amountId: selectedAmount.id,
        mode: 'battle'
      }
    } as any);
  };

  useEffect(() => {
    fetchQuestionCategories();
    fetchWalletBalance();
    
    // Add some fallback categories for testing
    if (questionCategories.length === 0) {
      const fallbackCategories = [
        { id: '1', name: 'GK', color: '#FF6B9D', description: 'General Knowledge', questionCount: 50 },
        { id: '2', name: 'Sports', color: '#4F9EFF', description: 'Sports & Games', questionCount: 45 },
        { id: '3', name: 'History', color: '#4CAF50', description: 'Historical Facts', questionCount: 40 },
        { id: '4', name: 'Science', color: '#FFB74D', description: 'Scientific Knowledge', questionCount: 55 },
        { id: '5', name: 'Geography', color: '#9C27B0', description: 'World Geography', questionCount: 35 },
      ];
      setQuestionCategories(fallbackCategories);
      // Remove automatic selection from fallback categories too
    }
    
    // Smooth entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(cardScaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.2)),
      }),
    ]).start();

    // Gentle sparkle animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();

    // Subtle glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();

    // Gentle floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(floatingAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();

    // Soft pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();

    // Icon rotation animation
    Animated.loop(
      Animated.timing(iconRotateAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();

    // Icon bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconBounceAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.2)),
        }),
        Animated.timing(iconBounceAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.2)),
        }),
      ])
    ).start();

    // Icon glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconGlowAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(iconGlowAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();

    setLoading(false);
  }, [user?.token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuestionCategories();
    fetchWalletBalance();
    setRefreshing(false);
  };

  const handleQuickMatch = () => {
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category first');
      return;
    }

    // Find the selected category
    const category = questionCategories.find(cat => cat.id === selectedCategory);
    if (category) {
      handleCategoryPress(category);
    } else {
      Alert.alert('Error', 'Selected category not found');
    }
  };

  const handleCreateRoom = () => {
    if (!socket) {
      Alert.alert('Error', 'Not connected to server');
      return;
    }

    console.log('Creating private room');
    Alert.alert('Create Room', 'Private room creation feature coming soon!');
  };

  const handleJoinRoom = () => {
    if (!roomCode.trim()) {
      Alert.alert('Error', 'Please enter a room code');
      return;
    }

    if (!socket) {
      Alert.alert('Error', 'Not connected to server');
      return;
    }

    console.log('Joining room:', roomCode);
    router.push({
      pathname: '/(tabs)/battle-room',
      params: { 
        roomCode: roomCode.trim()
      }
    } as any);
  };

  const getGradientColors = (categoryColor: string): [string, string] => {
    const colors: Record<string, [string, string]> = {
      '#3B82F6': ['#3B82F6', '#1D4ED8'],
      '#10B981': ['#10B981', '#059669'],
      '#F59E0B': ['#F59E0B', '#D97706'],
      '#EF4444': ['#EF4444', '#DC2626'],
      '#8B5CF6': ['#8B5CF6', '#7C3AED'],
      '#EC4899': ['#EC4899', '#DB2777'],
    };
    return colors[categoryColor] || ['#6366F1', '#4F46E5'];
  };

  const getCategoryBackgroundColor = (index: number) => {
    const colors = [
      '#FF6B9D', // Dark pink
      '#4F9EFF', // Dark blue
      '#4CAF50', // Dark green
      '#FFB74D', // Dark orange
      '#9C27B0', // Dark purple
      '#FF5722', // Dark red
      '#00BCD4', // Dark cyan
      '#8BC34A', // Dark light green
    ];
    return colors[index % colors.length];
  };

  const getCategoryIcon = (categoryName: string) => {
    console.log('getCategoryIcon called with:', categoryName);
    const lowerName = categoryName.toLowerCase();
    
    switch (lowerName) {
      case 'general knowledge':
      case 'gk':
      case 'general':
        return 'Brain';
      case 'sports':
      case 'sport':
        return 'Trophy';
      case 'history':
      case 'historical':
        return 'Clock';
      case 'science':
      case 'scientific':
        return 'TestTube';
      case 'math':
      case 'mathematics':
      case 'mathematical':
        console.log('Math category detected, returning Map');
        return 'Map';
      case 'geography':
      case 'geographical':
        return 'Map';
      default:
        console.log('Default case, returning Brain for:', categoryName);
        return 'Brain';
    }
  };

  const renderCategoryIcon = (categoryName: string, size: number, color: string, index?: number) => {
    console.log('Rendering icon for category:', categoryName, 'Index:', index);
    
    // Index-based icon assignment
    if (index !== undefined) {
      switch (index) {
        case 0: // First category - 3D character
          if (!imageLoadError) {
            return (
              <Image 
                source={require('../../assets/images/3d-character.png')} 
                style={{ width: '100%', height: '80%', marginBottom: 8 }}
                resizeMode="contain"
                onLoad={() => console.log('3D character loaded successfully!')}
                onError={() => {
                  console.log('3D character loading error');
                  setImageLoadError(true);
                }}
              />
            );
          }
          return <Brain size={size} color={color} />;
        
        case 1: // Second category - Sports
          return (
            <Image 
              source={require('../../assets/images/sports-icon.png')} 
              style={{ width: 60, height: 60 }}
              resizeMode="contain"
              onError={() => console.log('Sports image loading error')}
            />
          );
        
        case 2: // Third category - History
          return (
            <Image 
              source={require('../../assets/images/history-icon.png')} 
              style={{ width: 60, height: 60 }}
              resizeMode="contain"
              onError={() => console.log('History image loading error')}
            />
          );
        
        case 3: // Fourth category - Science
          if (!scienceImageLoadError) {
            return (
              <Image 
                source={require('../../assets/images/science-icon.png')} 
                style={{ width: 50, height: 50 }}
                resizeMode="contain"
                onError={() => {
                  console.log('Science image loading error');
                  setScienceImageLoadError(true);
                }}
              />
            );
          }
          return <TestTube size={size} color={color} />;
        
        case 4: // Fifth category - Math
          if (!mathImageLoadError) {
            return (
              <Image 
                source={require('../../assets/images/math-icon.png')} 
                style={{ width: 60, height: 60 }}
                resizeMode="contain"
                onLoad={() => console.log('Math image loaded successfully!')}
                onError={() => {
                  console.log('Math image loading error');
                  setMathImageLoadError(true);
                }}
              />
            );
          }
          return <Map size={size} color={color} />;
        
        default:
          return <Brain size={size} color={color} />;
      }
    }
    
    // Fallback to name-based for any other cases
    const iconName = getCategoryIcon(categoryName);
    switch (iconName) {
      case 'Brain':
        return <Brain size={size} color={color} />;
      case 'Trophy':
        return <Trophy size={size} color={color} />;
      case 'Clock':
        return <Clock size={size} color={color} />;
      case 'TestTube':
        return <TestTube size={size} color={color} />;
      case 'Map':
        return <Map size={size} color={color} />;
      default:
        return <Brain size={size} color={color} />;
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.loadingContainer}
      >
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContent}>
          <Animated.View 
            style={[
              styles.loadingIcon,
              { 
                transform: [
                  { scale: pulseAnim },
                  { translateY: floatingAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -5],
                  })}
                ]
              }
            ]}
          >
            <Zap size={48} color="#fff" />
          </Animated.View>
          <Text style={styles.loadingText}>Loading Battle Arena...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#667eea"
            colors={['#667eea', '#764ba2']}
          />
        }
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        decelerationRate="normal"
      >
        <Animated.View 
          style={[
            styles.content,
            { 
              opacity: fadeAnim, 
              transform: [
                { translateY: slideAnim },
                { scale: cardScaleAnim }
              ]
            }
          ]}
        >
          {/* Choose Your Category Section */}
          <View style={styles.section}>
            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: '#EBF4FF' }]}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 107, 107, 0.1)' }]}>
                  <Clock size={16} color="#FF6B6B" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>~30s</Text>
                  <Text style={styles.statLabel}>Wait Time</Text>
                </View>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#F3E8FF' }]}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(78, 205, 196, 0.1)' }]}>
                  <Users size={16} color="#4ECDC4" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>1.2k</Text>
                  <Text style={styles.statLabel}>Online</Text>
                </View>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#FFFBEB' }]}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 217, 61, 0.1)' }]}>
                  <Trophy size={16} color="#FFD93D" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>50</Text>
                  <Text style={styles.statLabel}>High Rewo</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Select Your Battle Category */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Your Battle Category</Text>
            
            <View style={styles.categoryGrid}>
              {/* Large Category Card - Left Side */}
              <View style={styles.largeCategoryContainer}>
                <TouchableOpacity
                  style={[
                    styles.largeCategoryCard,
                    selectedCategory === questionCategories[0]?.id && styles.selectedCategoryCard
                  ]}
                  onPress={() => questionCategories[0] && handleCategoryPress(questionCategories[0])}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.largeCategoryContent,
                    { backgroundColor: getCategoryBackgroundColor(0) }, // Pink for first category
                    selectedCategory === questionCategories[0]?.id && styles.selectedCategoryContent
                  ]}>
                    {renderCategoryIcon(questionCategories[0]?.name || '', 32, selectedCategory === questionCategories[0]?.id ? '#fff' : '#fff', 0)}
                    <Text style={[
                      styles.largeCategoryName,
                      selectedCategory === questionCategories[0]?.id && styles.selectedCategoryText
                    ]}>
                      {questionCategories[0]?.name || 'Any Category'}
                    </Text>
                  </View>
                  {selectedCategory === questionCategories[0]?.id && (
                    <View style={styles.selectedIndicator}>
                      <CheckCircle size={20} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Small Category Cards - Right Side */}
              <View style={styles.smallCategoriesContainer}>
                {/* Top Row - 2 Cards */}
                <View style={styles.smallCategoriesRow}>
                  {questionCategories.slice(1, 3).map((category, index) => {
                    console.log('Category being rendered:', category.name, 'Index:', index + 1);
                    return (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.smallCategoryCard,
                          { backgroundColor: getCategoryBackgroundColor(index + 1) },
                          selectedCategory === category.id && styles.selectedCategoryCard
                        ]}
                        onPress={() => handleCategoryPress(category)}
                        activeOpacity={0.7}
                      >
                        <View style={[
                          styles.smallCategoryContent,
                          { backgroundColor: getCategoryBackgroundColor(index + 1) },
                          selectedCategory === category.id && styles.selectedCategoryContent
                        ]}>
                          <View style={[
                            styles.smallCategoryIcon,
                            selectedCategory === category.id && styles.selectedCategoryIcon
                          ]}>
                            {renderCategoryIcon(category.name, 16, selectedCategory === category.id ? '#fff' : '#fff', index + 1)}
                          </View>
                          <Text style={[
                            styles.smallCategoryName,
                            selectedCategory === category.id && styles.selectedCategoryText
                          ]}>
                            {category.name}
                          </Text>
                        </View>
                        {selectedCategory === category.id && (
                          <View style={styles.selectedIndicator}>
                            <CheckCircle size={12} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Bottom Row - 2 Cards */}
                <View style={styles.smallCategoriesRow}>
                  {questionCategories.slice(3, 5).map((category, index) => {
                    console.log('Category being rendered:', category.name, 'Index:', index + 3);
                    return (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.smallCategoryCard,
                          { backgroundColor: getCategoryBackgroundColor(index + 3) },
                          selectedCategory === category.id && styles.selectedCategoryCard
                        ]}
                        onPress={() => handleCategoryPress(category)}
                        activeOpacity={0.7}
                      >
                        <View style={[
                          styles.smallCategoryContent,
                          { backgroundColor: getCategoryBackgroundColor(index + 3) },
                          selectedCategory === category.id && styles.selectedCategoryContent
                        ]}>
                          <View style={[
                            styles.smallCategoryIcon,
                            selectedCategory === category.id && styles.selectedCategoryIcon
                          ]}>
                            {renderCategoryIcon(category.name, 16, selectedCategory === category.id ? '#fff' : '#fff', index + 3)}
                          </View>
                          <Text style={[
                            styles.smallCategoryName,
                            selectedCategory === category.id && styles.selectedCategoryText
                          ]}>
                            {category.name}
                          </Text>
                        </View>
                        {selectedCategory === category.id && (
                          <View style={styles.selectedIndicator}>
                            <CheckCircle size={12} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Main Action Button */}
            <Animated.View style={{ 
              transform: [{ scale: buttonPulseAnim }],
              marginTop: 8,
            }}>
              <TouchableOpacity
                style={styles.mainActionButton}
                onPress={handleQuickMatch}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FF6B6B', '#FF8E53', '#FF6B6B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.mainActionButtonGradient}
                >
                  {/* Glow Effect */}
                  <View style={styles.buttonGlow} />
                  
                  {/* Main Content */}
                  <View style={styles.buttonContent}>
                    <View style={styles.buttonIconContainer}>
                      <Zap size={28} color="#fff" />
                    </View>
                    <Text style={styles.mainActionButtonText}>Start Battle</Text>
                    <View style={styles.buttonArrowContainer}>
                      <ArrowRight size={24} color="#fff" />
                    </View>
                  </View>
                  
                  {/* Sparkle Effects */}
                  <Animated.View 
                    style={[
                      styles.buttonSparkle1,
                      {
                        opacity: sparkleAnim,
                        transform: [
                          { rotate: sparkleAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '360deg'],
                          })}
                        ]
                      }
                    ]}
                  >
                    <Star size={12} color="rgba(255,255,255,0.6)" />
                  </Animated.View>
                  
                  <Animated.View 
                    style={[
                      styles.buttonSparkle2,
                      {
                        opacity: sparkleAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 0.8],
                        }),
                        transform: [
                          { rotate: sparkleAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['360deg', '0deg'],
                          })}
                        ]
                      }
                    ]}
                  >
                    <Star size={8} color="rgba(255,255,255,0.4)" />
                  </Animated.View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Private Room Section */}
          <View style={styles.section}>
            <LinearGradient
              colors={['rgba(76, 175, 80, 0.06)', 'rgba(139, 195, 74, 0.06)']}
              style={styles.privateRoomContainer}
            >
              {/* Header Section */}
              <View style={styles.privateRoomHeader}>
                <View style={styles.privateRoomInfo}>
                  <View style={styles.privateRoomIconContainer}>
                    <Users size={28} color="#667eea" />
                  </View>
                  <View style={styles.privateRoomText}>
                    <Text style={styles.privateRoomTitle}>Private Room</Text>
                    <Text style={styles.privateRoomSubtitle}>Play with friends & family</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.createRoomButton}
                  onPress={handleCreateRoom}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.createRoomButtonGradient}
                  >
                    <Plus size={24} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Join Room Section */}
              <View style={styles.joinRoomSection}>
                <View style={styles.joinRoomHeader}>
                  <View style={styles.joinRoomIconContainer}>
                    <Key size={20} color="#667eea" />
                  </View>
                  <Text style={styles.joinRoomLabel}>Join existing room</Text>
                </View>
                
                <View style={styles.joinRoomInputContainer}>
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconContainer}>
                      <Key size={18} color="#9ca3af" />
                    </View>
                    <TextInput
                      style={styles.roomCodeInput}
                      placeholder="Enter room code"
                      placeholderTextColor="#9ca3af"
                      value={roomCode}
                      onChangeText={setRoomCode}
                      autoCapitalize="none"
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.joinButton}
                    onPress={handleJoinRoom}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      style={styles.joinButtonGradient}
                    >
                      <Text style={styles.joinButtonText}>Join</Text>
                      <ArrowRight size={16} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Amount Selection Modal */}
      <Modal
        visible={showAmountModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeAmountModal}
      >
        <TouchableWithoutFeedback onPress={closeAmountModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.bottomSheet,
                  {
                    transform: [{ translateY: modalSlideAnim }],
                  },
                ]}
              >
                {/* Handle Bar */}
                <View style={styles.handleBar} />
                
                {/* Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Choose Entry Amount</Text>
                  <TouchableOpacity onPress={closeAmountModal} style={styles.closeButton}>
                    <X size={24} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Amount Options */}
                {loadingAmounts ? (
                  <View style={styles.loadingAmountsContainer}>
                    <Text style={styles.loadingAmountsText}>Loading amounts...</Text>
                  </View>
                ) : (
                  <View style={styles.amountOptionsContainer}>
                    {/* Paid Amount Options */}
                    {battleAmounts.map((amount) => (
                      <TouchableOpacity
                        key={amount.id}
                        style={[
                          styles.amountOption,
                          selectedAmount?.id === amount.id && styles.selectedAmountOption
                        ]}
                        onPress={() => handleAmountSelect(amount)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.amountOptionContent}>
                          <Text style={styles.amountOptionText}>₹{amount.amount}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Play Now Button */}
                <TouchableOpacity
                  style={styles.playNowButton}
                  onPress={handlePlayNow}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#4CAF50', '#45A049', '#2E7D32']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.playNowButtonGradient}
                  >
                    <Text style={styles.playNowButtonText}>PLAY NOW</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Terms and Conditions */}
                <View style={styles.termsContainer}>
                  <TouchableOpacity style={styles.termsCheckbox}>
                    <CheckCircle size={20} color="#4CAF50" />
                  </TouchableOpacity>
                  <Text style={styles.termsText}>
                    I have read and understood the{' '}
                    <Text style={styles.termsLink}>rules</Text> of the game
                  </Text>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  loadingContent: {
    alignItems: 'center',
    zIndex: 2,
  },
  loadingIcon: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 20,
  },
  animatedHeader: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
    height: 140, // Reduced height from 200 to 140
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
    paddingHorizontal: 10,
    position: 'absolute',
    top: 90, // Reduced from 150 to 90
    left: 0,
    right: 0,
  },
  headerButton: {
    padding: 10,
  },
  titleContainer: {
    position: 'absolute',
    top: 35, // Back to center position
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  battleTitle: {
    fontSize: 28, // Reduced from 36 to 28
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4, // Reduced from 8 to 4
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  battleSubtitle: {
    fontSize: 14, // Reduced from 18 to 14
    color: '#fff',
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  floatingElement: {
    position: 'absolute',
    zIndex: 1,
  },
  battleSword: {
    top: 30, // Reduced from 50 to 30
    left: 20,
  },
  battleShield: {
    top: 60, // Reduced from 100 to 60
    right: 20,
  },
  battleStar: {
    bottom: 30, // Reduced from 50 to 30
    right: 50,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
    paddingTop: 0, // Remove top padding since we have animated header
  },
  content: {
    marginTop: 20,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statContent: {
    flex: 1,
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  categoryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  allCategoriesContainer: {
    width: '100%',
    gap: 8,
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  categoryCard: {
    width: '31%', // Adjusted for 3-column grid
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  selectedCategoryCard: {
    borderColor: '#667eea',
    borderWidth: 2,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryContent: {
    padding: 16,
    alignItems: 'center',
    minHeight: 100,
    position: 'relative',
  },
  selectedCategoryContent: {
    backgroundColor: '#667eea',
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.08)',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.1)',
  },
  selectedCategoryIcon: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderColor: 'rgba(255,255,255,0.5)',
    transform: [{ scale: 1.05 }],
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 0,
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  mainActionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 16,
    position: 'relative',
  },
  mainActionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    minHeight: 60,
    position: 'relative',
  },
  mainActionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 12,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  privateRoomContainer: {
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  privateRoomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  privateRoomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  privateRoomIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    marginRight: 10,
  },
  privateRoomText: {
    flex: 1,
  },
  privateRoomTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  privateRoomSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  createRoomButton: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    width: 48,
    height: 48,
    marginLeft: 8,
  },
  createRoomButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  joinRoomSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(102, 126, 234, 0.1)',
  },
  joinRoomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  joinRoomIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    marginRight: 8,
  },
  joinRoomLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  joinRoomInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.1)',
  },
  inputIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
    marginRight: 8,
  },
  roomCodeInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    paddingVertical: 0,
    fontWeight: '500',
  },
  joinButton: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    marginLeft: 8,
  },
  joinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 6,
  },
  infoCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    marginBottom: 16,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  infoCardDesc: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  largeCategoryContainer: {
    width: '48%', // Adjust as needed for the large card
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  largeCategoryCard: {
    width: '100%',
    height: 160, // Match the height of 4 small cards (2 rows × 80px each)
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3E8FF', // Default background for large card
  },
  largeCategoryContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  largeCategoryIcon: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
  },
  largeCategoryName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff', // Changed to white for dark backgrounds
    textAlign: 'center',
  },
  smallCategoriesContainer: {
    width: '48%', // Adjust as needed for the small cards
    gap: 8,
  },
  smallCategoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  smallCategoryCard: {
    width: '48%', // Adjust as needed for the small cards
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 0, // No bottom margin for small cards
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  smallCategoryContent: {
    width: '100%',
    height: 80, // Fixed height for small cards
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  smallCategoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: 2,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  smallCategoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff', // Changed to white for dark backgrounds
    textAlign: 'center',
  },
  buttonGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.5,
    zIndex: -1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 12,
  },
  buttonArrowContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginLeft: 12,
  },
  buttonSparkle1: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    opacity: 0.5,
    zIndex: -1,
  },
  buttonSparkle2: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    opacity: 0.5,
    zIndex: -1,
  },
  characterImage: {
    width: '100%',
    height: '80%',
    marginBottom: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  bottomSheet: {
    backgroundColor: '#8B5CF6',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    width: '100%',
    padding: 24,
    paddingBottom: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 15,
  },
  handleBar: {
    width: 50,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  winningsContainer: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  winningsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  trophyContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  winningsText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  winningsAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  infoButton: {
    padding: 8,
  },
  amountOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
    flexWrap: 'wrap',
    gap: 15,
  },
  amountOption: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  selectedAmountOption: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
    transform: [{ scale: 1.05 }],
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  amountOptionContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountOptionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tickMark: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  termsCheckbox: {
    marginRight: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    padding: 5,
  },
  termsText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  termsLink: {
    color: '#FFD700',
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
  loadingAmountsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingAmountsText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  playNowButton: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 16,
    position: 'relative',
  },
  playNowButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    minHeight: 60,
    position: 'relative',
  },
  playNowButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 12,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
}); 