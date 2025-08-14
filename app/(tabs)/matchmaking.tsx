import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { io, Socket } from 'socket.io-client';

const { width, height } = Dimensions.get('window');

interface User {
  id: string;
  name: string;
  profilePhoto?: string;
  level: number;
}

interface MatchmakingState {
  status: 'searching' | 'found' | 'starting' | 'error';
  timeElapsed: number;
  opponent?: User;
  category?: string;
  estimatedWait: number;
}

export default function MatchmakingScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [matchmakingState, setMatchmakingState] = useState<MatchmakingState>({
    status: 'searching',
    timeElapsed: 0,
    estimatedWait: 30
  });
  
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Enhanced Animation values
  const [pulseAnim] = useState(new Animated.Value(1));
  const [scaleAnim] = useState(new Animated.Value(1));
  const [rotateAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [searchAnim] = useState(new Animated.Value(0));
  const [glowAnim] = useState(new Animated.Value(0));
  const [waveAnim] = useState(new Animated.Value(0));
  const [particleAnim1] = useState(new Animated.Value(0));
  const [particleAnim2] = useState(new Animated.Value(0));
  const [particleAnim3] = useState(new Animated.Value(0));
  const [radarAnim] = useState(new Animated.Value(0));
  const [scanAnim] = useState(new Animated.Value(0));
  
  // Refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchStartTime = useRef<number>(Date.now());
  const hasStartedSearch = useRef(false);

  const category = params.category as string;
  const mode = params.mode as string;

  console.log('Matchmaking Screen - Initial State:', { category, mode, user: user?.id });

  // Initialize socket connection
  useEffect(() => {
    console.log('🔌 Socket connection useEffect triggered');
    console.log('🔑 User token available:', !!user?.token);
    console.log('👤 User object:', { id: user?.id, hasToken: !!user?.token });
    
    if (user?.token) {
      console.log('🚀 Initializing socket connection...');
      const newSocket = io('http://192.168.1.4:3001', {
        auth: {
          token: user.token
        },
        transports: ['websocket', 'polling'],
        path: '/api/socket'
      });
      setMatchmakingState({
        status: 'searching',
        timeElapsed: 0,
        estimatedWait: 30
      });
      hasStartedSearch.current = false;
      searchStartTime.current = Date.now();
      newSocket.on('connect', () => {
        console.log('✅ Socket connected:', newSocket.id);
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('🔥 Socket connection error:', error);
        console.error('🔥 Error message:', error.message);
      });

      newSocket.on('error', (error) => {
        console.error('🔥 Socket error:', error);
      });

      setSocket(newSocket);

      return () => {
        console.log('🧹 Cleaning up socket connection...');
        newSocket.disconnect();
      };
    } else {
      console.log('❌ No user token available for socket connection');
    }
  }, [user?.token]);

  // Start matchmaking
  useEffect(() => {
    console.log('🎯 Matchmaking useEffect triggered');
    console.log('🔍 Current state:', { 
      hasSocket: !!socket, 
      isConnected, 
      hasStarted: hasStartedSearch.current,
      category,
      mode
    });
    if (!hasStartedSearch.current) {
      console.log('🧹 Resetting matchmaking state...');
      setMatchmakingState({
        status: 'searching',
        timeElapsed: 0,
        estimatedWait: 30
      });
      hasStartedSearch.current = false;
      searchStartTime.current = Date.now();
    }
    if (!socket || !isConnected || hasStartedSearch.current) {
      console.log('⏳ Waiting for socket connection or already started:', { 
        hasSocket: !!socket, 
        isConnected, 
        hasStarted: hasStartedSearch.current 
      });
      return;
    }

    console.log('🚀 Starting matchmaking...', { category, mode, userId: user?.id });
    hasStartedSearch.current = true;
    searchStartTime.current = Date.now();

    // Register user with socket
    if (user?.id) {
      console.log('👤 Registering user:', user.id);
      socket.emit('register_user', user.id);
    }

    // Start timer
    timerRef.current = setInterval(() => {
      setMatchmakingState(prev => ({
        ...prev,
        timeElapsed: Math.floor((Date.now() - searchStartTime.current) / 1000)
      }));
    }, 1000);

    // Emit matchmaking request
    console.log('📡 Emitting join_matchmaking:', { categoryId: category, mode: mode || 'quick' });
    socket.emit('join_matchmaking', {
      categoryId: category,
      mode: mode || 'quick'
    });

    // Socket event listeners
    socket.on('matchmaking_update', (data: { 
      status: string; 
      estimatedWait?: number; 
      message?: string 
    }) => {
      console.log('📊 Matchmaking update received:', data);
      setMatchmakingState(prev => ({
        ...prev,
        status: data.status as any,
        estimatedWait: data.estimatedWait || prev.estimatedWait
      }));
    });

    socket.on('opponent_found', (data: { opponent: User; category?: string }) => {
      console.log('🎯 OPPONENT FOUND!:', data);
      
      // Enhanced opponent found animation
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true })
      ]).start();
      
      setMatchmakingState(prev => ({
        ...prev,
        status: 'found',
        opponent: data.opponent,
        category: data.category
      }));
      
      // Enhanced success animation
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.3, duration: 400, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 300, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      ]).start();
    });

    socket.on('match_starting', (data: { countdown: number }) => {
      console.log('⚡ Match starting:', data);
      
      // Enhanced match starting animation
      Animated.timing(slideAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      
      setMatchmakingState(prev => ({
        ...prev,
        status: 'starting'
      }));
    });

    socket.on('match_ready', (data: { matchId: string; roomCode?: string }) => {
      console.log('🎮 Match ready:', data);
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Navigate to battle
      if (data.roomCode) {
        console.log('🏠 Navigating to battle room:', data.roomCode);
        router.push({
          pathname: '/(tabs)/battle-room',
          params: { roomCode: data.roomCode }
        } as any);
      } else {
        console.log('⚔️ Navigating to battle:', data.matchId);
        router.push({
          pathname: '/(tabs)/battle-room',
          params: { matchId: data.matchId }
        } as any);
      }
    });

    socket.on('matchmaking_error', (data: { message: string }) => {
      console.error('❌ Matchmaking error:', data);
      setError(data.message);
      setMatchmakingState(prev => ({ ...prev, status: 'error' }));
    });

    socket.on('opponent_cancelled', () => {
      console.log('🚫 Opponent cancelled matchmaking');
      setMatchmakingState(prev => ({ ...prev, status: 'searching' }));
    });

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Clean up socket listeners
      socket.off('matchmaking_update');
      socket.off('opponent_found');
      socket.off('match_starting');
      socket.off('match_ready');
      socket.off('matchmaking_error');
      socket.off('opponent_cancelled');
    };
  }, [socket, isConnected, category, mode, router, user?.id]);

  // Enhanced animations
  useEffect(() => {
    console.log('🎨 Starting enhanced animations...');
    
    // Radar scan animation
    Animated.loop(
      Animated.timing(radarAnim, { 
        toValue: 1, 
        duration: 3000, 
        useNativeDriver: true,
        easing: Easing.inOut(Easing.sin)
      })
    ).start();
    
    // Scanning wave animation
    Animated.loop(
      Animated.timing(scanAnim, { 
        toValue: 1, 
        duration: 2000, 
        useNativeDriver: true,
        easing: Easing.inOut(Easing.sin)
      })
    ).start();
    
    // Search animation with particles
    Animated.loop(
      Animated.sequence([
        Animated.timing(searchAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(searchAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
    
    // Enhanced pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();

    // Glow animation
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

    // Wave animation
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.sin),
      })
    ).start();

    // Particle animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(particleAnim1, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(particleAnim1, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(particleAnim2, { toValue: 1, duration: 3500, useNativeDriver: true }),
        Animated.timing(particleAnim2, { toValue: 0, duration: 3500, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(particleAnim3, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(particleAnim3, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();

    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();
  }, []);
  // 🧹 Cleanup on component unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Matchmaking component unmounting - cleaning up...');
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Reset state
      hasStartedSearch.current = false;
      
      // Disconnect socket if needed
      if (socket && socket.connected) {
        console.log('🔌 Disconnecting socket on unmount...');
        socket.disconnect();
      }
    };
  }, [socket]);
  const handleCancelSearch = () => {
    console.log('❌ Cancelling search...');
    setMatchmakingState({
      status: 'searching',
      timeElapsed: 0,
      estimatedWait: 30
    });
    hasStartedSearch.current = false;
    if (socket && isConnected) {
      socket.emit('cancel_matchmaking');
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    router.back();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryName = (categoryId?: string | null) => {
    if (!categoryId || categoryId === 'any') return 'Any Category';
    return categoryId;
  };

  console.log('🔄 Current matchmaking state:', matchmakingState);

  if (error) {
    return (
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
        style={styles.container}
      >
        <View style={styles.errorContainer}>
          <Animated.View style={[styles.errorIconContainer, { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons name="alert-circle" size={80} color="#ef4444" />
          </Animated.View>
          <Text style={styles.errorTitle}>Matchmaking Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          
          <View style={styles.errorButtons}>
            <TouchableOpacity
              style={styles.errorButton}
              onPress={() => router.back()}
            >
              <LinearGradient
                colors={['#3b82f6', '#1d4ed8']}
                style={styles.errorButtonGradient}
              >
                <Ionicons name="arrow-back" size={16} color="#fff" />
                <Text style={styles.errorButtonText}>Go Back</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.errorButtonOutline}
              onPress={() => {
                hasStartedSearch.current = false;
                setError(null);
                setMatchmakingState({
                  status: 'searching',
                  timeElapsed: 0,
                  estimatedWait: 30
                });
              }}
            >
              <Text style={styles.errorButtonOutlineText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#FF6B6B', '#FF8E53', '#FFD93D', '#4ECDC4']}
      style={styles.container}
    >
      {/* Exciting Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleCancelSearch}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)']}
            style={styles.backButtonGradient}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Animated.Text 
            style={[
              styles.headerTitle,
              {
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1]
                })
              }
            ]}
          >
            🚀 Battle Finder
          </Animated.Text>
          <View style={styles.timerContainer}>
            <Ionicons name="time" size={18} color="rgba(255,255,255,1)" />
            <Text style={styles.headerSubtitle}>
              {formatTime(matchmakingState.timeElapsed)} elapsed
            </Text>
          </View>
        </View>
      </View>

      {/* Exciting Main Content */}
      <View style={styles.content}>
        {/* Exciting Searching State */}
        {matchmakingState.status === 'searching' && (
          <View style={styles.searchingContainer}>
            {/* Amazing Animated Background */}
            <View style={styles.animatedBackground}>
              {/* Exciting Glowing Orbs */}
              <Animated.View 
                style={[
                  styles.bgCircle1,
                  { 
                    transform: [{ scale: pulseAnim }],
                    opacity: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.4, 0.9]
                    })
                  }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.bgCircle2,
                  { 
                    transform: [{ scale: pulseAnim }],
                    opacity: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0.7]
                    })
                  }
                ]} 
              />
              
              {/* Exciting Radar Scan */}
              <Animated.View 
                style={[
                  styles.radarScan,
                  {
                    transform: [{
                      scale: radarAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.4, 2.8]
                      })
                    }],
                    opacity: radarAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.9, 0.5, 0]
                    })
                  }
                ]}
              />
              
              {/* Exciting Scanning Wave */}
              <Animated.View 
                style={[
                  styles.scanWave,
                  {
                    transform: [{
                      scale: scanAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1.2, 2.5]
                      })
                    }],
                    opacity: scanAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.8, 0.4, 0]
                    })
                  }
                ]}
              />
              
              {/* Exciting Floating Elements */}
              <Animated.View 
                style={[
                  styles.particle1,
                  {
                    opacity: particleAnim1,
                    transform: [{
                      translateY: particleAnim1.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -80]
                      })
                    }]
                  }
                ]}
              />
              <Animated.View 
                style={[
                  styles.particle2,
                  {
                    opacity: particleAnim2,
                    transform: [{
                      translateY: particleAnim2.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -70]
                      })
                    }]
                  }
                ]}
              />
              <Animated.View 
                style={[
                  styles.particle3,
                  {
                    opacity: particleAnim3,
                    transform: [{
                      translateY: particleAnim3.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -90]
                      })
                    }]
                  }
                ]}
              />
            </View>
            
            {/* Exciting Match Animation */}
            <View style={styles.matchAnimation}>
              {/* You - Exciting Design */}
              <View style={styles.playerContainer}>
                <Animated.View 
                  style={[
                    styles.playerGlow,
                    {
                      opacity: glowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1]
                      })
                    }
                  ]}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                    style={styles.playerGlowGradient}
                  />
                </Animated.View>
                <View style={styles.playerAvatar}>
                  <LinearGradient
                    colors={['#FF6B6B', '#FF8E53']}
                    style={styles.playerAvatarGradient}
                  >
                    <Text style={styles.playerInitial}>Y</Text>
                  </LinearGradient>
                </View>
                <Text style={styles.playerName}>You</Text>
                <View style={styles.statusBadge}>
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.statusBadgeGradient}
                  >
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    <Text style={styles.statusText}>Ready</Text>
                  </LinearGradient>
                </View>
              </View>
              
              {/* Exciting VS Badge */}
              <Animated.View 
                style={[
                  styles.vsContainer,
                  { 
                    transform: [
                      { scale: pulseAnim },
                      {
                        rotate: rotateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg']
                        })
                      }
                    ]
                  }
                ]}
              >
                <LinearGradient
                  colors={['#FF6B6B', '#FF8E53', '#FFD93D']}
                  style={styles.vsGradient}
                >
                  <Text style={styles.vsText}>⚔️ VS</Text>
                </LinearGradient>
              </Animated.View>
              
              {/* Exciting Opponent Search */}
              <Animated.View 
                style={[
                  styles.playerContainer,
                  {
                    transform: [
                      {
                        translateY: searchAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-40, 40]
                        })
                      },
                      {
                        scale: searchAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [1, 1.3, 1]
                        })
                      }
                    ]
                  }
                ]}
              >
                <View style={styles.playerAvatar}>
                  <Animated.View
                    style={{
                      transform: [{
                        rotate: rotateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg']
                        })
                      }]
                    }}
                  >
                    <LinearGradient
                      colors={['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.2)']}
                      style={styles.opponentAvatarGradient}
                    >
                      <Ionicons name="person" size={36} color="#fff" />
                    </LinearGradient>
                  </Animated.View>
                </View>
                <Text style={styles.playerName}>Finding...</Text>
                <View style={styles.searchingBadge}>
                  <Animated.View
                    style={{
                      opacity: searchAnim
                    }}
                  >
                    <Ionicons name="radio" size={16} color="#FF6B6B" />
                  </Animated.View>
                  <Text style={styles.searchingText}>Searching</Text>
                </View>
              </Animated.View>
            </View>
            
            {/* Exciting Status Info */}
            <View style={styles.statusInfo}>
              <Animated.Text 
                style={[
                  styles.statusTitle,
                  {
                    opacity: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1]
                    })
                  }
                ]}
              >
                🔍 Searching for Opponent
              </Animated.Text>
              <View style={styles.categoryInfo}>
                <View style={styles.categoryBadge}>
                  <Ionicons name="book" size={18} color="#667eea" />
                  <Text style={styles.categoryText}>{getCategoryName(category)}</Text>
                </View>
                <View style={styles.modeBadge}>
                  <Ionicons name="flash" size={18} color="#f093fb" />
                  <Text style={styles.modeText}>{(mode || 'quick').toUpperCase()}</Text>
                </View>
              </View>
              
              {/* Exciting Progress Indicator */}
              <View style={styles.progressContainer}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)']}
                  style={styles.progressBackground}
                >
                  <Animated.View 
                    style={[
                      styles.progressBar,
                      {
                        width: searchAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%']
                        })
                      }
                    ]}
                  />
                </LinearGradient>
              </View>
            </View>
            
            {/* Exciting Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelSearch}
            >
              <LinearGradient
                colors={['rgba(239, 68, 68, 0.5)', 'rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0.2)']}
                style={styles.cancelButtonGradient}
              >
                <Ionicons name="close-circle" size={20} color="#fff" />
                <Text style={styles.cancelButtonText}>Cancel Search</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Exciting Opponent Found State */}
        {matchmakingState.status === 'found' && matchmakingState.opponent && (
          <View style={styles.foundContainer}>
            {/* Exciting Success Animation */}
            <Animated.View 
              style={[
                styles.successIcon,
                { transform: [{ scale: scaleAnim }] }
              ]}
            >
              <LinearGradient
                colors={['#10B981', '#059669', '#047857']}
                style={styles.successIconGradient}
              >
                <Ionicons name="checkmark-circle" size={80} color="#fff" />
              </LinearGradient>
            </Animated.View>
            
            <Text style={styles.statusTitle}>🎯 Opponent Found!</Text>
            
            {/* Exciting Matchup */}
            <View style={styles.matchupContainer}>
              {/* You */}
              <View style={styles.playerCard}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)']}
                  style={styles.playerCardGradient}
                >
                  <View style={styles.playerAvatar}>
                    <LinearGradient
                      colors={['#FF6B6B', '#FF8E53']}
                      style={styles.playerAvatarGradient}
                    >
                      <Text style={styles.playerInitial}>Y</Text>
                    </LinearGradient>
                  </View>
                  <Text style={styles.playerName}>You</Text>
                  <View style={styles.readyBadge}>
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      style={styles.readyBadgeGradient}
                    >
                      <Ionicons name="checkmark-circle" size={16} color="#fff" />
                      <Text style={styles.readyText}>Ready</Text>
                    </LinearGradient>
                  </View>
                </LinearGradient>
              </View>
              
              {/* VS */}
              <View style={styles.vsContainer}>
                <LinearGradient
                  colors={['#FF6B6B', '#FF8E53', '#FFD93D']}
                  style={styles.vsGradient}
                >
                  <Text style={styles.vsText}>⚔️ VS</Text>
                </LinearGradient>
              </View>
              
              {/* Opponent */}
              <View style={styles.playerCard}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)']}
                  style={styles.playerCardGradient}
                >
                  <View style={styles.playerAvatar}>
                    <LinearGradient
                      colors={['#4ECDC4', '#44A08D']}
                      style={styles.playerAvatarGradient}
                    >
                      <Text style={styles.playerInitial}>
                        {matchmakingState.opponent.name.charAt(0).toUpperCase()}
                      </Text>
                    </LinearGradient>
                  </View>
                  <Text style={styles.playerName}>{matchmakingState.opponent.name}</Text>
                  <View style={styles.levelBadge}>
                    <LinearGradient
                      colors={['#8B5CF6', '#7C3AED']}
                      style={styles.levelBadgeGradient}
                    >
                      <Ionicons name="trophy" size={16} color="#fff" />
                      <Text style={styles.levelText}>Level {matchmakingState.opponent.level}</Text>
                    </LinearGradient>
                  </View>
                </LinearGradient>
              </View>
            </View>
          </View>
        )}

        {/* Exciting Match Starting State */}
        {matchmakingState.status === 'starting' && (
          <View style={styles.startingContainer}>
            <Animated.View 
              style={[
                styles.gameIcon,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53', '#FFD93D']}
                style={styles.gameIconGradient}
              >
                <Ionicons name="game-controller" size={80} color="#fff" />
              </LinearGradient>
            </Animated.View>
            
            <Text style={styles.statusTitle}>🎮 Battle Starting!</Text>
            <Text style={styles.statusSubtitle}>Get ready to compete...</Text>
            
            <View style={styles.countdownCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)']}
                style={styles.countdownGradient}
              >
                <Text style={styles.countdownNumber}>3</Text>
                <Text style={styles.countdownText}>Battle begins in...</Text>
              </LinearGradient>
            </View>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  backButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerContent: {
    flex: 1,
    marginLeft: 20,
  },
  headerInfo: {
    flex: 1,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  timerLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  searchingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchAnimationContainer: {
    width: 120,
    height: 120,
    position: 'relative',
    marginBottom: 30,
  },
  userContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  userLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  vsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.8)',
  },
  opponentScrollContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opponentAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  opponentInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  opponentLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorIconContainer: {
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 30,
    textAlign: 'center',
  },
  errorButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  errorButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  errorButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  errorButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  errorButtonOutline: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  errorButtonOutlineText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 30,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 300,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIconContainer: {
    width: 30,
    alignItems: 'center',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  foundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 30,
  },
  successIconGradient: {
    borderRadius: 32,
    padding: 10,
  },
  matchupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 300,
  },
  userCard: {
    flex: 1,
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  userStatus: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  opponentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  opponentLevel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  startingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameIcon: {
    marginBottom: 30,
  },
  gameIconGradient: {
    borderRadius: 32,
    padding: 10,
  },
  countdownCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 30,
    width: '100%',
    maxWidth: 200,
  },
  countdownNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  countdownText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cancelButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  tipsContainer: {
    marginBottom: 40,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  tipsGrid: {
    gap: 16,
  },
  tipCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  tipText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 16,
  },
  matchAnimation: {
    width: 120,
    height: 120,
    position: 'relative',
    marginBottom: 30,
  },
  playerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerName: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  playerStatus: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  statusInfo: {
    marginBottom: 30,
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  searchingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginLeft: 4,
  },
  playerGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 35,
    opacity: 0.5,
    zIndex: -1,
  },
  playerGlowGradient: {
    flex: 1,
    borderRadius: 35,
  },
  vsGradient: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  readyBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginTop: 8,
  },
  readyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  levelBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginTop: 8,
  },
  levelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerCard: {
    flex: 1,
    alignItems: 'center',
  },
  playerCardGradient: {
    borderRadius: 16,
    padding: 15,
    width: '100%',
    maxWidth: 120,
  },
  countdownGradient: {
    borderRadius: 16,
    padding: 15,
    width: '100%',
    maxWidth: 120,
  },
  animatedBackground: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    zIndex: -1,
  },
  bgCircle1: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  bgCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  radarScan: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    transform: [{ translateX: -50 }, { translateY: -50 }],
  },
  scanWave: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.05)',
    transform: [{ translateX: -75 }, { translateY: -75 }],
  },
  progressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    marginTop: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  progressBackground: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  particle1: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.5)',
    top: -10,
    left: 10,
  },
  particle2: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    top: 20,
    right: 15,
  },
  particle3: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.6)',
    bottom: 10,
    left: 20,
  },
  opponentAvatarGradient: {
    borderRadius: 30,
    padding: 5,
  },
  statusBadgeGradient: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  readyBadgeGradient: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  levelBadgeGradient: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  playerAvatarGradient: {
    borderRadius: 30,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 4,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  modeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 4,
  },
}); 