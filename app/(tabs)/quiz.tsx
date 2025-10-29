import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    ArrowRight,
    Brain,
    CheckCircle,
    Clock,
    Map,
    TestTube,
    Trophy,
    Users,
    X,
    Zap
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
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
      const newSocket = io('http://192.168.1.6:3001', {
        auth: {
          token: user.token
        },
        transports: ['websocket', 'polling'],
        path: '/api/socket'
      });

      newSocket.on('connect', () => {

      });

      newSocket.on('disconnect', () => {

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

      const response = await apiFetchAuth('/student/battle-quiz', user.token);
      if (response.ok) {
        const categories: QuestionCategory[] = response.data;

        setQuestionCategories(categories);
        // Remove automatic selection - no category should be preselected
      } else {
        console.error('Failed to fetch battle quiz categories - response not ok');
      }
    } catch (error) {
      console.error('Failed to fetch battle quiz categories:', error);
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

      const response = await apiFetchAuth(`/student/battle-quiz/amounts?categoryId=${categoryId}`, user.token);
      if (response.ok) {
        const amounts: BattleAmount[] = response.data;

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


    router.push({
      pathname: '/(tabs)/battle-room',
      params: { 
        roomCode: roomCode.trim()
      }
    } as any);
  };

  const getGradientColors = (categoryColor: string): [string, string] => {
    // Create a darker shade of the same color for gradient effect
    const lightenColor = (color: string, percent: number) => {
      const num = parseInt(color.replace("#", ""), 16);
      const amt = Math.round(2.55 * percent);
      const R = (num >> 16) + amt;
      const G = (num >> 8 & 0x00FF) + amt;
      const B = (num & 0x0000FF) + amt;
      return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    };

    const darkenColor = (color: string, percent: number) => {
      const num = parseInt(color.replace("#", ""), 16);
      const amt = Math.round(2.55 * percent);
      const R = (num >> 16) - amt;
      const G = (num >> 8 & 0x00FF) - amt;
      const B = (num & 0x0000FF) - amt;
      return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
        (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
        (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
    };

    // Predefined colors for common cases, otherwise generate gradient
    const colors: Record<string, [string, string]> = {
      '#3B82F6': ['#3B82F6', '#1D4ED8'],
      '#10B981': ['#10B981', '#059669'],
      '#F59E0B': ['#F59E0B', '#D97706'],
      '#EF4444': ['#EF4444', '#DC2626'],
      '#8B5CF6': ['#8B5CF6', '#7C3AED'],
      '#EC4899': ['#EC4899', '#DB2777'],
      '#f55600': ['#f55600', '#d4490a'], // Orange for Science from API
    };
    
    return colors[categoryColor] || [categoryColor, darkenColor(categoryColor, 20)];
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

        return 'Map';
      case 'geography':
      case 'geographical':
        return 'Map';
      default:

        return 'Brain';
    }
  };

  const renderCategoryIcon = (categoryName: string, size: number, color: string, index?: number) => {

    
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
            tintColor="#4F46E5"
            colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
          />
        }
        showsVerticalScrollIndicator={false}
        bounces={true}
        overScrollMode="always"
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        decelerationRate="fast"
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
                     {/* Enhanced Battle Arena Section with Header Background */}
           <View style={styles.battleArenaSection}>
                           <LinearGradient
                colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.battleArenaGradient}
              >
               {/* Animated Background Pattern */}
               <View style={styles.backgroundPattern}>
                 <Animated.View 
                   style={[
                     styles.patternCircle1,
                     {
                       transform: [
                         { scale: pulseAnim },
                         { translateX: floatingAnim.interpolate({
                           inputRange: [0, 1],
                           outputRange: [0, 10],
                         })}
                       ]
                     }
                   ]} 
                 />
                 <Animated.View 
                   style={[
                     styles.patternCircle2,
                     {
                       transform: [
                         { scale: pulseAnim.interpolate({
                           inputRange: [0, 1],
                           outputRange: [1, 1.1],
                         })},
                         { translateY: floatingAnim.interpolate({
                           inputRange: [0, 1],
                           outputRange: [0, -15],
                         })}
                       ]
                     }
                   ]} 
                 />
                 <Animated.View 
                   style={[
                     styles.patternCircle3,
                     {
                       transform: [
                         { rotate: iconRotateAnim.interpolate({
                           inputRange: [0, 1],
                           outputRange: ['0deg', '360deg'],
                         })}
                       ]
                     }
                   ]} 
                 />
                 <View style={styles.patternDots} />
                 
                 {/* Animated Sparkles */}
                 <Animated.View 
                   style={[
                     styles.sparkle1,
                     {
                       opacity: sparkleAnim,
                       transform: [
                         { scale: sparkleAnim.interpolate({
                           inputRange: [0, 1],
                           outputRange: [0.5, 1.2],
                         })}
                       ]
                     }
                   ]} 
                 />
                 <Animated.View 
                   style={[
                     styles.sparkle2,
                     {
                       opacity: sparkleAnim.interpolate({
                         inputRange: [0, 1],
                         outputRange: [0.3, 0.8],
                       }),
                       transform: [
                         { scale: sparkleAnim.interpolate({
                           inputRange: [0, 1],
                           outputRange: [0.8, 1.5],
                         })}
                       ]
                     }
                   ]} 
                 />
                 <Animated.View 
                   style={[
                     styles.sparkle3,
                     {
                       opacity: sparkleAnim.interpolate({
                         inputRange: [0, 1],
                         outputRange: [0.5, 1],
                       }),
                       transform: [
                         { scale: sparkleAnim.interpolate({
                           inputRange: [0, 1],
                           outputRange: [1, 0.7],
                         })}
                       ]
                     }
                   ]} 
                 />
               </View>
               
               <View style={styles.battleArenaContent}>
                 <View style={styles.battleArenaLeft}>
                   <Animated.View 
                     style={[
                       styles.titleContainer,
                       {
                         transform: [
                           { translateY: slideAnim.interpolate({
                             inputRange: [0, 1],
                             outputRange: [20, 0],
                           })}
                         ]
                       }
                     ]}
                   >
                     <Text style={styles.battleArenaTitle}>BATTLE ARENA</Text>
                     <Text style={styles.battleArenaSubtitle}>Challenge other players in real-time battle</Text>
                   </Animated.View>
                   
                   {/* Animated Stats Row */}
                   <Animated.View 
                     style={[
                       styles.battleStatsRow,
                       {
                         opacity: fadeAnim,
                         transform: [
                           { translateY: slideAnim.interpolate({
                             inputRange: [0, 1],
                             outputRange: [30, 0],
                           })}
                         ]
                       }
                     ]}
                   >
                     <View style={styles.battleStatItem}>
                       <Animated.View 
                         style={[
                           styles.battleStatIcon,
                           {
                             transform: [
                               { scale: iconBounceAnim },
                               { rotate: iconRotateAnim.interpolate({
                                 inputRange: [0, 1],
                                 outputRange: ['0deg', '360deg'],
                               })}
                             ]
                           }
                         ]}
                       >
                         <Trophy size={16} color="#FFD700" />
                       </Animated.View>
                       <Text style={styles.battleStatText}>1.2k Players</Text>
                     </View>
                     <View style={styles.battleStatItem}>
                       <Animated.View 
                         style={[
                           styles.battleStatIcon,
                           {
                             transform: [
                               { scale: iconBounceAnim },
                               { rotate: iconRotateAnim.interpolate({
                                 inputRange: [0, 1],
                                 outputRange: ['0deg', '-360deg'],
                               })}
                             ]
                           }
                         ]}
                       >
                         <Zap size={16} color="#FFD700" />
                       </Animated.View>
                       <Text style={styles.battleStatText}>Live Battles</Text>
                     </View>
                     <View style={styles.battleStatItem}>
                       <Animated.View 
                         style={[
                           styles.battleStatIcon,
                           {
                             transform: [
                               { scale: iconBounceAnim },
                               { rotate: iconRotateAnim.interpolate({
                                 inputRange: [0, 1],
                                 outputRange: ['0deg', '360deg'],
                               })}
                             ]
                           }
                         ]}
                       >
                         <Clock size={16} color="#FFD700" />
                       </Animated.View>
                       <Text style={styles.battleStatText}>~30s Wait</Text>
                     </View>
                   </Animated.View>
                 </View>
                 
                 <View style={styles.battleArenaRight}>
                   <Animated.View 
                     style={[
                       styles.imageContainer,
                       {
                         transform: [
                           { scale: cardScaleAnim },
                           { translateY: floatingAnim.interpolate({
                             inputRange: [0, 1],
                             outputRange: [0, -8],
                           })}
                         ]
                       }
                     ]}
                   >
                     <Image
                       source={require('../../assets/images/icons/p-bat-bg1.png')}
                       style={styles.battleArenaImage}
                       resizeMode="contain"
                     />
                     
                     {/* Glow Effect */}
                     <Animated.View 
                       style={[
                         styles.imageGlow,
                         {
                           opacity: glowAnim,
                           transform: [
                             { scale: glowAnim.interpolate({
                               inputRange: [0, 1],
                               outputRange: [0.8, 1.2],
                             })}
                           ]
                         }
                       ]} 
                     />
                   </Animated.View>
                 </View>
               </View>
             </LinearGradient>
                       </View>
 
                       {/* Enhanced Stats Section */}
            <View style={styles.section}>
              <View style={styles.enhancedStatsRow}>
                <View style={styles.enhancedStatCard}>
                  <LinearGradient
                    colors={['rgba(255, 107, 107, 0.1)', 'rgba(255, 107, 107, 0.05)']}
                    style={styles.enhancedStatGradient}
                  >
                                         <View style={styles.enhancedStatIconContainer}>
                       <LinearGradient
                         colors={['rgba(255, 107, 107, 0.2)', 'rgba(255, 107, 107, 0.1)']}
                         style={styles.enhancedStatIconGradient}
                       >
                         <Clock size={24} color="#FF6B6B" />
                       </LinearGradient>
                     </View>
                    <View style={styles.enhancedStatContent}>
                      <Text style={styles.enhancedStatValue}>~30s</Text>
                      <Text style={styles.enhancedStatLabel}>Wait Time</Text>
                    </View>
                  </LinearGradient>
                </View>
                
                <View style={styles.enhancedStatCard}>
                  <LinearGradient
                    colors={['rgba(78, 205, 196, 0.1)', 'rgba(78, 205, 196, 0.05)']}
                    style={styles.enhancedStatGradient}
                  >
                                         <View style={styles.enhancedStatIconContainer}>
                       <LinearGradient
                         colors={['rgba(78, 205, 196, 0.2)', 'rgba(78, 205, 196, 0.1)']}
                         style={styles.enhancedStatIconGradient}
                       >
                         <Users size={28} color="#4ECDC4" />
                       </LinearGradient>
                     </View>
                    <View style={styles.enhancedStatContent}>
                      <Text style={styles.enhancedStatValue}>1.2k</Text>
                      <Text style={styles.enhancedStatLabel}>Online</Text>
                    </View>
                  </LinearGradient>
                </View>
                
                <View style={styles.enhancedStatCard}>
                  <LinearGradient
                    colors={['rgba(255, 217, 61, 0.1)', 'rgba(255, 217, 61, 0.05)']}
                    style={styles.enhancedStatGradient}
                  >
                                         <View style={styles.enhancedStatIconContainer}>
                       <LinearGradient
                         colors={['rgba(255, 217, 61, 0.2)', 'rgba(255, 217, 61, 0.1)']}
                         style={styles.enhancedStatIconGradient}
                       >
                         <Trophy size={28} color="#FFD93D" />
                       </LinearGradient>
                     </View>
                    <View style={styles.enhancedStatContent}>
                      <Text style={styles.enhancedStatValue}>50</Text>
                      <Text style={styles.enhancedStatLabel}>High Rewards</Text>
                    </View>
                  </LinearGradient>
                </View>
              </View>
            </View>
 
           {/* Enhanced Category Selection */}
          <View style={styles.section}>
            <View style={styles.categorySectionBackground}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Select Your Battle Category</Text>
              </View>
              
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
                    <LinearGradient
                      colors={getGradientColors(questionCategories[0]?.color || '#6366F1')}
                      style={[
                        styles.largeCategoryContent,
                        selectedCategory === questionCategories[0]?.id && styles.selectedCategoryContent
                      ]}
                    >
                                             <Animated.View 
                         style={[
                           styles.largeCategoryIcon,
                           {
                             transform: [
                               { scale: iconBounceAnim }
                             ]
                           }
                         ]}
                       >
                        {renderCategoryIcon(questionCategories[0]?.name || '', 40, '#fff', 0)}
                      </Animated.View>
                      <Text style={[
                        styles.largeCategoryName,
                        selectedCategory === questionCategories[0]?.id && styles.selectedCategoryText
                      ]}>
                        {questionCategories[0]?.name || 'Any Category'}
                      </Text>
                      <Text style={styles.largeCategoryDescription}>
                        {questionCategories[0]?.questionCount || 0} questions
                      </Text>
                    </LinearGradient>
                    {selectedCategory === questionCategories[0]?.id && (
                      <View style={styles.selectedIndicator}>
                        <CheckCircle size={24} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Small Category Cards - Right Side */}
                <View style={styles.smallCategoriesContainer}>
                  {/* Top Row - 2 Cards */}
                  <View style={styles.smallCategoriesRow}>
                    {questionCategories.slice(1, 3).map((category, index) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.smallCategoryCard,
                          selectedCategory === category.id && styles.selectedCategoryCard
                        ]}
                        onPress={() => handleCategoryPress(category)}
                        activeOpacity={0.7}
                      >
                        <LinearGradient
                          colors={getGradientColors(category.color)}
                          style={[
                            styles.smallCategoryContent,
                            selectedCategory === category.id && styles.selectedCategoryContent
                          ]}
                        >
                          <Animated.View 
                            style={[
                              styles.smallCategoryIcon,
                              {
                                transform: [
                                  { scale: iconBounceAnim }
                                ]
                              }
                            ]}
                          >
                            {renderCategoryIcon(category.name, 24, '#fff', index + 1)}
                          </Animated.View>
                          <Text style={[
                            styles.smallCategoryName,
                            selectedCategory === category.id && styles.selectedCategoryText
                          ]}>
                            {category.name}
                          </Text>
                        </LinearGradient>
                        {selectedCategory === category.id && (
                          <View style={styles.selectedIndicator}>
                            <CheckCircle size={16} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Bottom Row - 2 Cards */}
                  <View style={styles.smallCategoriesRow}>
                    {questionCategories.slice(3, 5).map((category, index) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.smallCategoryCard,
                          selectedCategory === category.id && styles.selectedCategoryCard
                        ]}
                        onPress={() => handleCategoryPress(category)}
                        activeOpacity={0.7}
                      >
                        <LinearGradient
                          colors={getGradientColors(category.color)}
                          style={[
                            styles.smallCategoryContent,
                            selectedCategory === category.id && styles.selectedCategoryContent
                          ]}
                        >
                          <Animated.View 
                            style={[
                              styles.smallCategoryIcon,
                              {
                                transform: [
                                  { scale: iconBounceAnim }
                                ]
                              }
                            ]}
                          >
                            {renderCategoryIcon(category.name, 24, '#fff', index + 3)}
                          </Animated.View>
                          <Text style={[
                            styles.smallCategoryName,
                            selectedCategory === category.id && styles.selectedCategoryText
                          ]}>
                            {category.name}
                          </Text>
                        </LinearGradient>
                        {selectedCategory === category.id && (
                          <View style={styles.selectedIndicator}>
                            <CheckCircle size={16} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

                             {/* Main Action Button */}
               <Animated.View 
                 style={[
                   styles.mainActionButton,
                   {
                     transform: [
                       { scale: buttonPulseAnim },
                       { translateY: floatingAnim.interpolate({
                         inputRange: [0, 1],
                         outputRange: [0, -2],
                       })}
                     ]
                   }
                 ]}
               >
                 <TouchableOpacity
                   onPress={handleQuickMatch}
                   activeOpacity={0.8}
                 >
                   <LinearGradient
                     colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
                     start={{ x: 0, y: 0 }}
                     end={{ x: 1, y: 1 }}
                     style={styles.mainActionButtonGradient}
                   >
                     {/* Animated Glow Effect */}
                     <Animated.View 
                       style={[
                         styles.buttonGlow,
                         {
                           opacity: glowAnim,
                           transform: [
                             { scale: glowAnim.interpolate({
                               inputRange: [0, 1],
                               outputRange: [0.8, 1.2],
                             })}
                           ]
                         }
                       ]} 
                     />
                     
                     {/* Animated Sparkles */}
                     <Animated.View 
                       style={[
                         styles.buttonSparkle1,
                         {
                           opacity: sparkleAnim,
                           transform: [
                             { scale: sparkleAnim.interpolate({
                               inputRange: [0, 1],
                               outputRange: [0.5, 1.2],
                             })}
                           ]
                         }
                       ]} 
                     />
                     <Animated.View 
                       style={[
                         styles.buttonSparkle2,
                         {
                           opacity: sparkleAnim.interpolate({
                             inputRange: [0, 1],
                             outputRange: [0.3, 0.8],
                           }),
                           transform: [
                             { scale: sparkleAnim.interpolate({
                               inputRange: [0, 1],
                               outputRange: [0.8, 1.5],
                             })}
                           ]
                         }
                       ]} 
                     />
                     
                     {/* Main Content */}
                     <View style={styles.buttonContent}>
                       <Animated.View 
                         style={[
                           styles.buttonIconContainer,
                           {
                             transform: [
                               { scale: iconBounceAnim },
                               { rotate: iconRotateAnim.interpolate({
                                 inputRange: [0, 1],
                                 outputRange: ['0deg', '360deg'],
                               })}
                             ]
                           }
                         ]}
                       >
                         <Zap size={24} color="#fff" />
                       </Animated.View>
                       <Text style={styles.mainActionButtonText}>Start Battle</Text>
                       <Animated.View 
                         style={[
                           styles.buttonArrowContainer,
                           {
                             transform: [
                               { scale: iconBounceAnim },
                               { translateX: floatingAnim.interpolate({
                                 inputRange: [0, 1],
                                 outputRange: [0, 5],
                               })}
                             ]
                           }
                         ]}
                       >
                         <ArrowRight size={24} color="#fff" />
                       </Animated.View>
                     </View>
                   </LinearGradient>
                 </TouchableOpacity>
               </Animated.View>
            </View>

            {/* TEMPORARILY COMMENTED OUT - Private Room and Join Section 
            <View style={styles.section}>
              <LinearGradient
                colors={['rgba(102, 126, 234, 0.08)', 'rgba(118, 75, 162, 0.08)']}
                style={styles.privateRoomContainer}
              >
                <View style={styles.privateRoomHeader}>
                  <View style={styles.privateRoomInfo}>
                    <View style={styles.privateRoomIconContainer}>
                      <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        style={styles.privateRoomIconGradient}
                      >
                        <Users size={28} color="#fff" />
                      </LinearGradient>
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
                <View style={styles.joinRoomSection}>
                  <View style={styles.joinRoomHeader}>
                    <View style={styles.joinRoomIconContainer}>
                      <Key size={20} color="#667eea" />
                    </View>
                    <Text style={styles.joinRoomLabel}>Join existing room</Text>
                  </View>
                  <View style={styles.joinRoomInputContainer}>
                    <TextInput
                      style={styles.roomCodeInput}
                      placeholder="Enter room code"
                      placeholderTextColor="#9ca3af"
                      value={roomCode}
                      onChangeText={setRoomCode}
                      autoCapitalize="none"
                    />
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
            */}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Enhanced Amount Selection Modal */}
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
                   styles.enhancedBottomSheet,
                   {
                     transform: [{ translateY: modalSlideAnim }],
                   },
                 ]}
               >
                 <LinearGradient
                   colors={['#667eea', '#764ba2', '#4F46E5']}
                   start={{ x: 0, y: 0 }}
                   end={{ x: 1, y: 1 }}
                   style={styles.modalGradientBackground}
                 >
                   
                {/* Enhanced Handle Bar */}
                <View style={styles.enhancedHandleBar}>
                  <View style={styles.handleBarLine} />
                </View>
                
                                 {/* Enhanced Header */}
                 <View style={styles.enhancedModalHeader}>
                   <View style={styles.modalTitleContainer}>
                     <Text style={styles.enhancedModalTitle}>Choose Battle Amount</Text>
                     <Text style={styles.modalSubtitle}>Select your entry fee for {selectedCategoryName}</Text>
                   </View>
                   <TouchableOpacity onPress={closeAmountModal} style={styles.enhancedCloseButton}>
                     <LinearGradient
                       colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                       style={styles.closeButtonGradient}
                     >
                       <X size={18} color="#fff" />
                     </LinearGradient>
                   </TouchableOpacity>
                 </View>

                {/* Enhanced Amount Options */}
                                 {loadingAmounts ? (
                   <View style={styles.enhancedLoadingContainer}>
                     <Animated.View 
                       style={[
                         styles.loadingIconContainer,
                         {
                           transform: [
                             { rotate: iconRotateAnim.interpolate({
                               inputRange: [0, 1],
                               outputRange: ['0deg', '360deg'],
                             })}
                           ]
                         }
                       ]}
                     >
                       <Zap size={24} color="#fff" />
                     </Animated.View>
                     <Text style={styles.enhancedLoadingText}>✨ Loading amounts...</Text>
                   </View>
                ) : (
                  <View style={styles.enhancedAmountOptionsContainer}>
                    {battleAmounts.map((amount, index) => (
                      <TouchableOpacity
                        key={amount.id}
                        style={[
                          styles.enhancedAmountOption,
                          selectedAmount?.id === amount.id && styles.enhancedSelectedAmountOption
                        ]}
                        onPress={() => handleAmountSelect(amount)}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={selectedAmount?.id === amount.id 
                            ? ['#10B981', '#059669', '#047857']
                            : ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']
                          }
                          style={styles.amountOptionGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <View style={styles.amountOptionContent}>
                            <Text style={styles.currencySymbol}>₹</Text>
                            <Text style={[
                              styles.enhancedAmountOptionText,
                              selectedAmount?.id === amount.id && styles.selectedAmountText
                            ]}>
                              {amount.amount}
                            </Text>
                          </View>
                          
                          {/* Selection Indicator */}
                          {selectedAmount?.id === amount.id && (
                            <View style={styles.amountSelectedIndicator}>
                              <CheckCircle size={20} color="#fff" />
                            </View>
                          )}
                          
                          {/* Glow Effect for Selected */}
                          {selectedAmount?.id === amount.id && (
                            <View style={styles.amountGlowEffect} />
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Enhanced Play Now Button */}
                <View style={styles.playButtonContainer}>
                  <TouchableOpacity
                    style={[
                      styles.enhancedPlayNowButton,
                      !selectedAmount && styles.disabledPlayButton
                    ]}
                    onPress={handlePlayNow}
                    activeOpacity={0.8}
                    disabled={!selectedAmount}
                  >
                    <LinearGradient
                      colors={selectedAmount 
                        ? ['#FF6B35', '#F7931E', '#FFD700']
                        : ['#9CA3AF', '#6B7280', '#4B5563']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.enhancedPlayNowButtonGradient}
                    >
                      <View style={styles.playButtonContent}>
                        <Animated.View 
                          style={[
                            styles.playButtonIconContainer,
                            {
                              transform: [
                                { scale: iconBounceAnim },
                                { rotate: selectedAmount ? iconRotateAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: ['0deg', '360deg'],
                                }) : '0deg'}
                              ]
                            }
                          ]}
                        >
                          <Zap size={20} color="#fff" />
                        </Animated.View>
                        <View style={styles.playButtonTextContainer}>
                          <Text style={styles.enhancedPlayNowButtonText}>
                            {selectedAmount ? 'START BATTLE' : 'SELECT AMOUNT'}
                          </Text>
                          {selectedAmount && (
                            <Text style={styles.playButtonSubtext}>
                              Entry Fee: ₹{selectedAmount.amount}
                            </Text>
                          )}
                        </View>
                        <ArrowRight size={20} color="#fff" />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>


                 </LinearGradient>
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
  sectionHeader: {
    marginBottom: 16,
    alignItems: 'center', // Center the title
  },
     sectionTitle: {
     fontSize: 14,
     fontWeight: '700',
     color: '#1E293B',
     marginBottom: 16,
     textAlign: 'center',
     textShadowColor: 'rgba(0,0,0,0.1)',
     textShadowOffset: { width: 0, height: 1 },
     textShadowRadius: 2,
     letterSpacing: 0.3,
     textTransform: 'uppercase',
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
    alignItems: 'flex-start', // Changed back to flex-start for proper alignment
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151', // Changed from #1E293B to darker color for better visibility
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280', // Changed from #64748B to darker color for better visibility
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
     paddingVertical: 10,
     paddingHorizontal: 20,
     minHeight: 48,
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
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.3,
  },
  privateRoomSubtitle: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 0.2,
    lineHeight: 20,
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
     marginBottom: 12,
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
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '700',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.05)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
     joinRoomInputContainer: {
     flexDirection: 'column',
     backgroundColor: '#fff',
     borderRadius: 12,
     paddingHorizontal: 12,
     paddingVertical: 8,
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
     width: '100%',
     fontSize: 14,
     color: '#1E293B',
     paddingVertical: 12,
     paddingHorizontal: 16,
     fontWeight: '500',
     backgroundColor: '#F8FAFC',
     borderRadius: 8,
     borderWidth: 1,
     borderColor: 'rgba(102, 126, 234, 0.1)',
     marginBottom: 12,
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
     alignSelf: 'flex-end',
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
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
     width: 80,
     height: 80,
     borderRadius: 40,
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
     width: 40,
     height: 40,
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
     width: 40,
     height: 40,
     borderRadius: 20,
     justifyContent: 'center',
     alignItems: 'center',
     backgroundColor: 'rgba(255, 255, 255, 0.2)',
     marginRight: 8,
   },
     buttonArrowContainer: {
     width: 40,
     height: 40,
     borderRadius: 20,
     justifyContent: 'center',
     alignItems: 'center',
     backgroundColor: 'rgba(255, 255, 255, 0.2)',
     marginLeft: 8,
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
     modalOverlay: {
     position: 'absolute',
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     backgroundColor: 'rgba(0,0,0,0.7)',
     justifyContent: 'center',
     alignItems: 'center',
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
  // New styles for enhanced UI
  battleArenaGradient: {
    position: 'relative',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  patternCircle1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -20,
    left: -20,
  },
  patternCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: 20,
    right: 20,
  },
  patternCircle3: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.03)',
    top: 100,
    left: '50%',
    marginLeft: -100,
  },
  patternDots: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.02)',
    zIndex: -1,
  },
  patternStars: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  quizGameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quizGameBadge: {
    backgroundColor: '#FF4444',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 10,
  },
  quizGameBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  vsContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  vsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  largeCategoryDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  privateRoomIconGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Added faint background
  },
  headerSection: {
    marginBottom: 24,
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 8,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionButton: {
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
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    minHeight: 60,
    position: 'relative',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 12,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  actionButtonDisabled: {
    backgroundColor: '#E5E7EB',
    borderColor: '#D1D5DB',
  },
  actionButtonTextDisabled: {
    color: '#9CA3AF',
  },
  privateRoomCard: {
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
  privateRoomIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.1)',
  },
  playButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  loadingContent: {
    alignItems: 'center',
    zIndex: 2,
  },
  loadingIcon: {
    marginBottom: 20,
  },
  battleArenaSection: {
    marginTop: 20,
    marginBottom: 20,
    height: 180, // Reduced height from 240 to 180 for more compact design
  },
  battleArenaGradient: {
    position: 'relative',
    width: '100%',
    height: '100%', // Use full height of parent
    borderRadius: 16,
    overflow: 'hidden',
  },
  battleArenaContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 20,
    paddingVertical: 16, // Added vertical padding
  },
  battleArenaLeft: {
    flex: 1,
    marginRight: 10,
    justifyContent: 'center', // Center content vertically
  },
  battleArenaRight: {
    width: 100,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    marginBottom: 12, // Reduced margin to fit better
  },
  battleArenaTitle: {
    fontSize: 24, // Reduced font size to prevent cutting
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'left',
    marginBottom: 4, // Reduced margin
  },
  battleArenaSubtitle: {
    fontSize: 16, // Reduced font size to prevent cutting
    color: '#fff',
    textAlign: 'left',
    marginBottom: 2, // Reduced margin
    opacity: 0.9, // Slightly transparent for better hierarchy
  },
  quizGameSection: {
    marginTop: 8, // Reduced margin
  },
  quizGameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6, // Reduced margin
    flexWrap: 'wrap', // Allow text to wrap if needed
  },
  quizGameText: {
    fontSize: 16, // Reduced font size to prevent cutting
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 5,
    flexShrink: 1, // Allow text to shrink if needed
  },
  quizGameBadge: {
    backgroundColor: '#FF4444',
    borderRadius: 8, // Reduced border radius
    paddingHorizontal: 6, // Reduced padding
    paddingVertical: 3, // Reduced padding
    marginLeft: 8, // Reduced margin
  },
  quizGameBadgeText: {
    color: '#fff',
    fontSize: 9, // Reduced font size to prevent cutting
    fontWeight: 'bold',
  },
  playerComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 8, // Reduced margin
    flexWrap: 'wrap', // Allow wrapping if needed
  },
  playerItem: {
    alignItems: 'center',
    marginHorizontal: 4, // Reduced margin
  },
  playerIcon: {
    width: 28, // Reduced size
    height: 28, // Reduced size
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerScore: {
    fontSize: 18, // Reduced font size to prevent cutting
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4, // Reduced margin
  },
  vsContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16, // Reduced border radius
    paddingHorizontal: 12, // Reduced padding
    paddingVertical: 6, // Reduced padding
    marginHorizontal: 8, // Reduced margin
  },
  vsText: {
    color: '#fff',
    fontSize: 14, // Reduced font size to prevent cutting
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 8, // Reduced margin
    flexWrap: 'wrap', // Allow wrapping if needed
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: 4, // Reduced margin
  },
  statText: {
    fontSize: 12, // Reduced font size to prevent cutting
    color: '#FFD700',
    marginTop: 3, // Reduced margin
    fontWeight: '600',
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8, // Reduced margin
    position: 'absolute', // Position absolutely to save space
    bottom: 12, // Position at bottom
    left: 0,
    right: 0,
  },
  dot: {
    width: 6, // Reduced size
    height: 6, // Reduced size
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 3, // Reduced margin
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 8, // Reduced size
    height: 8, // Reduced size
    borderRadius: 4,
  },
  characterContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  characterImage: {
    width: 100, // Reduced size to fit better
    height: 100, // Reduced size to fit better
    position: 'relative',
  },
  characterBody: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60, // Reduced height
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 30,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  characterHead: {
    position: 'absolute',
    top: -8, // Adjusted position
    left: '50%',
    marginLeft: -8, // Adjusted margin
    width: 16, // Reduced size
    height: 16, // Reduced size
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.3)',
  },
  characterTorso: {
    position: 'absolute',
    top: 8, // Adjusted position
    left: '50%',
    marginLeft: -16, // Adjusted margin
    width: 32, // Reduced size
    height: 32, // Reduced size
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.3)',
  },
  characterArms: {
    position: 'absolute',
    top: 16, // Adjusted position
    left: '50%',
    marginLeft: -24, // Adjusted margin
    width: 48, // Reduced size
    height: 16, // Reduced height
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.3)',
  },
  characterLegs: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -16, // Adjusted margin
    width: 32, // Reduced size
    height: 32, // Reduced size
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.3)',
  },
  characterReflection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 16, // Reduced height
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  battleArenaImage: {
    position: 'absolute',
    width: 240,
    height: 240,
    alignSelf: 'center',
    marginTop: 80, // Reduced from 120 to 80 to fit in compact header
    zIndex: 1,
  },
     categorySectionBackground: {
     backgroundColor: '#F3E8FF', // Added background color for category section
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
   
   // Enhanced Battle Arena Styles
       battleStatsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 2, // Reduced from 8 to 2 to move icons much higher
      paddingHorizontal: 8,
    },
   battleStatItem: {
     alignItems: 'center',
     flex: 1,
   },
   battleStatIcon: {
     width: 32,
     height: 32,
     borderRadius: 16,
     backgroundColor: 'rgba(255, 255, 255, 0.2)',
     justifyContent: 'center',
     alignItems: 'center',
     marginBottom: 4,
     borderWidth: 1,
     borderColor: 'rgba(255, 255, 255, 0.3)',
   },
   battleStatText: {
     fontSize: 10,
     color: '#FFD700',
     fontWeight: '600',
     textAlign: 'center',
   },
   imageContainer: {
     position: 'relative',
     alignItems: 'center',
     justifyContent: 'center',
   },
   imageGlow: {
     position: 'absolute',
     width: 120,
     height: 120,
     borderRadius: 60,
     backgroundColor: 'rgba(255, 215, 0, 0.3)',
     zIndex: -1,
   },
   sparkle1: {
     position: 'absolute',
     top: 20,
     left: 30,
     width: 8,
     height: 8,
     borderRadius: 4,
     backgroundColor: '#FFD700',
     zIndex: 1,
   },
   sparkle2: {
     position: 'absolute',
     top: 60,
     right: 40,
     width: 6,
     height: 6,
     borderRadius: 3,
     backgroundColor: '#FFD700',
     zIndex: 1,
   },
       sparkle3: {
      position: 'absolute',
      bottom: 30,
      left: 50,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#FFD700',
      zIndex: 1,
    },
    
    // Enhanced Stats Styles
            enhancedStatsRow: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     marginBottom: 8, // Increased for better spacing
     gap: 8, // Reduced gap for more compact design
   },
    enhancedStatCard: {
      flex: 1,
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
         enhancedStatGradient: {
       padding: 12,
       alignItems: 'center',
       minHeight: 60,
     },
         enhancedStatIconContainer: {
       width: 32,
       height: 32,
       borderRadius: 16,
       backgroundColor: 'rgba(255, 255, 255, 0.15)',
       justifyContent: 'center',
       alignItems: 'center',
       marginBottom: 6,
       borderWidth: 1,
       borderColor: 'rgba(255, 255, 255, 0.2)',
     },
    enhancedStatContent: {
      alignItems: 'center',
    },
         enhancedStatValue: {
       fontSize: 18,
       fontWeight: '800',
       color: '#1E293B',
       marginBottom: 2,
       textShadowColor: 'rgba(0,0,0,0.1)',
       textShadowOffset: { width: 0, height: 1 },
       textShadowRadius: 2,
       letterSpacing: 0.3,
     },
     enhancedStatLabel: {
       fontSize: 13,
       color: '#64748B',
       fontWeight: '600',
       textAlign: 'center',
       letterSpacing: 0.3,
       textTransform: 'uppercase',
     },
        enhancedStatIconGradient: {
     width: 48,
     height: 48,
     borderRadius: 24,
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 2,
     borderColor: 'rgba(255, 255, 255, 0.3)',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
     elevation: 3,
   },
   
          // Enhanced Modal Styles
   enhancedBottomSheet: {
     borderTopLeftRadius: 25,
     borderTopRightRadius: 25,
     width: '100%',
     maxWidth: 450,
     alignSelf: 'center',
     position: 'absolute',
     bottom: 0,
     left: 0,
     right: 0,
     shadowColor: '#667eea',
     shadowOffset: { width: 0, height: -10 },
     shadowOpacity: 0.3,
     shadowRadius: 25,
     elevation: 15,
     overflow: 'hidden',
     borderWidth: 2,
     borderColor: 'rgba(255, 255, 255, 0.15)',
   },
       modalGradientBackground: {
     padding: 24,
     paddingTop: 8,
     paddingBottom: 30,
     borderTopLeftRadius: 25,
     borderTopRightRadius: 25,
     minHeight: 'auto',
   },
   enhancedHandleBar: {
     alignItems: 'center',
     marginBottom: 12,
     paddingTop: 6,
   },
   handleBarLine: {
     width: 40,
     height: 4,
     backgroundColor: 'rgba(255, 255, 255, 0.6)',
     borderRadius: 2,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.2,
     shadowRadius: 2,
     elevation: 2,
   },
       enhancedModalHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: 25,
     paddingHorizontal: 4,
   },
   modalTitleContainer: {
     flex: 1,
     alignItems: 'center',
   },
   enhancedModalTitle: {
     fontSize: 20,
     fontWeight: '800',
     color: '#FFFFFF',
     textAlign: 'center',
     textShadowColor: 'rgba(0,0,0,0.3)',
     textShadowOffset: { width: 0, height: 2 },
     textShadowRadius: 4,
     letterSpacing: 0.6,
     marginBottom: 4,
   },
   modalSubtitle: {
     fontSize: 14,
     color: 'rgba(255,255,255,0.85)',
     textAlign: 'center',
     fontWeight: '600',
     letterSpacing: 0.3,
     textShadowColor: 'rgba(0,0,0,0.2)',
     textShadowOffset: { width: 0, height: 1 },
     textShadowRadius: 2,
   },
    enhancedCloseButton: {
      padding: 6,
      backgroundColor: 'rgba(255,255,255,0.25)',
      borderRadius: 15,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.4)',
    },
       enhancedLoadingContainer: {
     alignItems: 'center',
     paddingVertical: 20,
   },
       loadingIconContainer: {
     marginBottom: 8,
     padding: 8,
     backgroundColor: 'rgba(255,255,255,0.15)',
     borderRadius: 16,
     borderWidth: 1,
     borderColor: 'rgba(255,255,255,0.3)',
   },
    enhancedLoadingText: {
      fontSize: 14,
      color: '#fff',
      fontWeight: '600',
      letterSpacing: 0.2,
    },
       enhancedAmountOptionsContainer: {
     flexDirection: 'row',
     justifyContent: 'space-around',
     alignItems: 'center',
     marginBottom: 30,
     flexWrap: 'wrap',
     gap: 12,
     paddingHorizontal: 8,
     paddingVertical: 10,
   },
       amountOptionWrapper: {
     marginBottom: 4,
   },
    enhancedAmountOption: {
      width: 80,
      height: 80,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.3)',
      shadowColor: '#667eea',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
      position: 'relative',
      overflow: 'hidden',
      marginHorizontal: 6,
    },
    amountOptionGradient: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    enhancedSelectedAmountOption: {
      borderColor: '#10B981',
      borderWidth: 3,
      transform: [{ scale: 1.08 }],
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 15,
      elevation: 10,
    },
       enhancedAmountOptionText: {
     fontSize: 18,
     fontWeight: '800',
     color: '#fff',
     textShadowColor: 'rgba(0,0,0,0.3)',
     textShadowOffset: { width: 0, height: 1 },
     textShadowRadius: 3,
     letterSpacing: 0.5,
   },
   currencySymbol: {
     fontSize: 14,
     fontWeight: '600',
     color: 'rgba(255,255,255,0.8)',
     marginBottom: 2,
   },
   amountOptionContent: {
     alignItems: 'center',
     justifyContent: 'center',
   },
   amountSelectedIndicator: {
     position: 'absolute',
     top: -8,
     right: -8,
     backgroundColor: '#10B981',
     borderRadius: 15,
     width: 30,
     height: 30,
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 2,
     borderColor: '#fff',
     shadowColor: '#10B981',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.3,
     shadowRadius: 4,
     elevation: 5,
   },
   amountGlowEffect: {
     position: 'absolute',
     top: -5,
     left: -5,
     right: -5,
     bottom: -5,
     borderRadius: 25,
     backgroundColor: 'rgba(16, 185, 129, 0.2)',
     zIndex: -1,
   },
   closeButtonGradient: {
     width: 32,
     height: 32,
     borderRadius: 16,
     justifyContent: 'center',
     alignItems: 'center',
   },
   playButtonContainer: {
     marginTop: 10,
     marginBottom: 5,
   },
   playButtonContent: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     paddingHorizontal: 20,
     paddingVertical: 16,
   },
   playButtonTextContainer: {
     flex: 1,
     alignItems: 'center',
     marginHorizontal: 15,
   },
   playButtonSubtext: {
     fontSize: 12,
     color: 'rgba(255,255,255,0.9)',
     fontWeight: '600',
     marginTop: 2,
     letterSpacing: 0.3,
   },
   disabledPlayButton: {
     opacity: 0.7,
   },
   selectedAmountText: {
     color: '#FFFFFF',
     fontWeight: '800',
     textShadowColor: 'rgba(0,0,0,0.4)',
     textShadowOffset: { width: 0, height: 2 },
     textShadowRadius: 3,
   },
   selectedIndicator: {
     position: 'absolute',
     top: -8,
     right: -8,
     backgroundColor: '#4CAF50',
     borderRadius: 12,
     padding: 2,
     borderWidth: 2,
     borderColor: '#FFFFFF',
   },
   loadingContainer: {
     padding: 20,
     alignItems: 'center',
   },
   loadingText: {
     fontSize: 14,
     color: '#666',
     marginTop: 8,
   },
       enhancedPlayNowButton: {
     borderRadius: 14,
     overflow: 'hidden',
     borderWidth: 1,
     borderColor: 'rgba(255, 255, 255, 0.3)',
     shadowColor: '#4CAF50',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.2,
     shadowRadius: 6,
     elevation: 4,
     marginTop: 8,
     position: 'relative',
   },
       enhancedPlayNowButtonGradient: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     paddingVertical: 10,
     paddingHorizontal: 20,
     minHeight: 42,
     position: 'relative',
   },
    playButtonIconContainer: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      marginRight: 8,
    },
    enhancedPlayNowButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
      marginHorizontal: 8,
      textShadowColor: 'rgba(0,0,0,0.2)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
      letterSpacing: 0.3,
    },
                 enhancedTermsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      paddingTop: 8,
       borderTopWidth: 1,
       borderTopColor: 'rgba(255,255,255,0.3)',
     },
    enhancedTermsCheckbox: {
      marginRight: 8,
      backgroundColor: 'rgba(255,255,255,0.25)',
      borderRadius: 12,
      padding: 4,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.4)',
    },
    enhancedTermsText: {
      fontSize: 12,
      color: '#fff',
      fontWeight: '500',
      letterSpacing: 0.1,
    },
         enhancedTermsLink: {
       color: '#FFD700',
       textDecorationLine: 'underline',
       fontWeight: 'bold',
     },
     
     // Modal Background Styles
     modalGradientBackground: {
       position: 'relative',
       width: '100%',
       height: '100%',
       borderRadius: 20,
       overflow: 'hidden',
     },
     modalBackgroundPattern: {
       position: 'absolute',
       top: 0,
       left: 0,
       right: 0,
       bottom: 0,
       zIndex: -1,
     },
     modalPatternCircle1: {
       position: 'absolute',
       width: 80,
       height: 80,
       borderRadius: 40,
       backgroundColor: 'rgba(255,255,255,0.08)',
       top: -10,
       left: -10,
     },
     modalPatternCircle2: {
       position: 'absolute',
       width: 120,
       height: 120,
       borderRadius: 60,
       backgroundColor: 'rgba(255,255,255,0.06)',
       bottom: 15,
       right: 15,
     },
     modalPatternCircle3: {
       position: 'absolute',
       width: 150,
       height: 150,
       borderRadius: 75,
       backgroundColor: 'rgba(255,255,255,0.04)',
       top: 80,
       left: '50%',
       marginLeft: -75,
     },
     modalSparkle1: {
       position: 'absolute',
       top: 15,
       left: 25,
       width: 6,
       height: 6,
       borderRadius: 3,
       backgroundColor: '#FFD700',
       zIndex: 1,
     },
     modalSparkle2: {
       position: 'absolute',
       top: 50,
       right: 30,
       width: 4,
       height: 4,
       borderRadius: 2,
       backgroundColor: '#FFD700',
       zIndex: 1,
     },
     modalSparkle3: {
       position: 'absolute',
       bottom: 25,
       left: 40,
       width: 8,
       height: 8,
       borderRadius: 4,
       backgroundColor: '#FFD700',
       zIndex: 1,
     },
}); 
