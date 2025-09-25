import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { HelpCircle, KeyRound, Layers3, Play, Sparkles, Users } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useWebSocket } from '../../context/WebSocketContext';

interface SpyGamePlayer {
  userId: string;
  socketId: string;
  isHost: boolean;
  name: string;
  position?: number;
}

interface SpyGame {
  id: string;
  roomCode: string;
  hostId: string;
  maxPlayers: number;
  players: SpyGamePlayer[];
  status: string;
  currentPhase: string;
  currentTurn: number;
}

export default function SpyGameLobby() {
  const router = useRouter();
  const { user } = useAuth();
  const { isConnected, on, off } = useWebSocket();
  const { showError, showSuccess } = useToast();

  const [game, setGame] = useState<SpyGame | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const createTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const joinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const createCardAnim = useRef(new Animated.Value(0)).current;
  const ctaScale = useRef(new Animated.Value(1)).current;
  const tileScale6 = useRef(new Animated.Value(1)).current;
  const tileScale8 = useRef(new Animated.Value(1)).current;
  const sparkleRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(createCardAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ctaScale, { toValue: 1.04, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(ctaScale, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    // Stagger tiles in
    try { tileScale6.setValue(0.92); tileScale8.setValue(0.92); } catch {}
    Animated.stagger(140, [
      Animated.spring(tileScale6, { toValue: 1, useNativeDriver: true }),
      Animated.spring(tileScale8, { toValue: 1, useNativeDriver: true }),
    ]).start();
    // Rotate sparkles icon
    const spin = Animated.loop(Animated.timing(sparkleRotate, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true }));
    spin.start();
    return () => { try { (loop as any).stop?.(); } catch {} };
  }, [createCardAnim, ctaScale]);

  // Register socket listeners via WebSocketService passthrough
  useEffect(() => {
    // Client expects the following server events as per user's web page
    const handleCreated = (data: { gameId: string; roomCode: string; game: SpyGame }) => {
      if (createTimeoutRef.current) {
        clearTimeout(createTimeoutRef.current);
        createTimeoutRef.current = null;
      }
      setGame(data.game);
      setIsCreating(false);
      showSuccess(`Game created! Room: ${data.roomCode}`);
      router.push({ pathname: '/(tabs)/spy-room', params: { id: data.gameId, roomCode: data.roomCode, game: JSON.stringify(data.game) } });
    };

    const handleError = (data: { message: string }) => {
      if (createTimeoutRef.current) {
        clearTimeout(createTimeoutRef.current);
        createTimeoutRef.current = null;
      }
      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current);
        joinTimeoutRef.current = null;
      }
      setIsCreating(false);
      setIsJoining(false);
      showError(data.message || 'An error occurred');
    };

    const handleJoined = (data: { gameId: string; game: SpyGame }) => {
      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current);
        joinTimeoutRef.current = null;
      }
      setIsJoining(false);
      setGame(data.game);
      showSuccess(`Joined game! Room: ${data.game.roomCode}`);
      router.push({ pathname: '/(tabs)/spy-room', params: { id: data.gameId, roomCode: data.game.roomCode, game: JSON.stringify(data.game) } });
    };

    // Bind
    on('spy_game_created' as any, handleCreated);
    on('spy_game_error' as any, handleError);
    on('spy_game_join_error' as any, handleError);
    on('spy_game_joined' as any, handleJoined);

    return () => {
      if (createTimeoutRef.current) clearTimeout(createTimeoutRef.current);
      if (joinTimeoutRef.current) clearTimeout(joinTimeoutRef.current);
      off('spy_game_created' as any);
      off('spy_game_error' as any);
      off('spy_game_join_error' as any);
      off('spy_game_joined' as any);
    };
  }, [on, off, router, showError, showSuccess]);

  const createGame = () => {
    if (!isConnected) {
      showError('Not connected to server');
      return;
    }
    if (!user?.id) {
      showError('User not authenticated');
      return;
    }
    setIsCreating(true);
    createTimeoutRef.current = setTimeout(() => {
      setIsCreating(false);
      showError('Game creation timed out. Please try again.');
    }, 10000);

    // Emit via raw socket
    try {
      const socket = require('../../utils/websocket').default.getSocket();
      if (!socket?.connected) {
        throw new Error('Socket not connected');
      }
      socket.emit('create_spy_game', { userId: user.id, maxPlayers });
    } catch (e: any) {
      setIsCreating(false);
      showError(e?.message || 'Failed to create game');
    }
  };

  const joinGame = () => {
    if (!isConnected) {
      showError('Not connected to server');
      return;
    }
    if (!user?.id) {
      showError('User not authenticated');
      return;
    }
    if (!roomCode.trim()) {
      showError('Please enter a room code');
      return;
    }
    setIsJoining(true);
    joinTimeoutRef.current = setTimeout(() => {
      setIsJoining(false);
      showError('Join game timed out. Please try again.');
    }, 10000);

    try {
      const socket = require('../../utils/websocket').default.getSocket();
      if (!socket?.connected) throw new Error('Socket not connected');
      socket.emit('join_spy_game', { userId: user.id, roomCode: roomCode.trim().toUpperCase() });
    } catch (e: any) {
      setIsJoining(false);
      showError(e?.message || 'Failed to join game');
    }
  };


  return (
    <LinearGradient colors={[ '#4F46E5', '#7C3AED', '#8B5CF6', '#A855F7' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>

        {/* Enhanced Section Heading */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <LinearGradient colors={[ '#FFFFFF', '#F8FAFC', '#E2E8F0' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginBottom: 8, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}>
            <Text style={{ color: '#4F46E5', fontSize: 24, fontWeight: '900', textShadowColor: 'rgba(255,255,255,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>🕵️ SPY GAME</Text>
          </LinearGradient>
          <View style={{ width: 100, height: 3, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 4, borderRadius: 999 }} />
          <View style={{ width: 60, height: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 2, borderRadius: 999 }} />
        </View>

        {/* Enhanced Create Game */}
        <LinearGradient colors={[ '#FFFFFF', '#F8FAFC', '#E2E8F0' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 20, padding: 2, marginBottom: 20, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 }}>
        <Animated.View style={{ backgroundColor: '#FFFFFF', borderRadius: 18, padding: 20, opacity: createCardAnim, transform: [{ translateY: createCardAnim.interpolate({ inputRange: [0,1], outputRange: [16, 0] }) }] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <LinearGradient colors={[ '#4F46E5', '#7C3AED' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 8, borderRadius: 12, marginRight: 12 }}>
              <Layers3 color="white" size={20} />
            </LinearGradient>
            <Text style={{ color: '#4F46E5', fontSize: 20, fontWeight: '900', textShadowColor: 'rgba(79,70,229,0.1)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>Create New Game</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Animated.View style={{ transform: [{ rotate: sparkleRotate.interpolate({ inputRange: [0,1], outputRange: ['0deg','360deg'] }) }] }}>
              <Sparkles color="#4F46E5" size={16} />
            </Animated.View>
            <Text style={{ color: '#6B7280', textAlign: 'center', fontSize: 14, marginLeft: 8, fontWeight: '600' }}>Select Number of Players</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
            {[6, 8].map((num) => {
              const active = maxPlayers === num;
              const tileGradient = num === 6 ? ['#4F46E5', '#7C3AED'] : ['#8B5CF6', '#A855F7'];
              const tileScale = num === 6 ? tileScale6 : tileScale8;
              return (
                <Animated.View key={num} style={{ flex: 1, marginRight: num !== 8 ? 16 : 0, transform: [{ scale: tileScale }] }}>
                  <TouchableOpacity
                    onPress={() => setMaxPlayers(num)}
                    onPressIn={() => Animated.spring(tileScale, { toValue: 0.95, useNativeDriver: true }).start()}
                    onPressOut={() => Animated.spring(tileScale, { toValue: 1, useNativeDriver: true }).start()}
                  >
                    <LinearGradient 
                      colors={active ? tileGradient : ['rgba(107,114,128,0.1)', 'rgba(75,85,99,0.1)']} 
                      start={{ x: 0, y: 0 }} 
                      end={{ x: 1, y: 1 }} 
                    style={{
                        paddingVertical: 16, 
                        paddingHorizontal: 20, 
                        borderRadius: 16, 
                      alignItems: 'center',
                        shadowColor: active ? (num === 6 ? '#4F46E5' : '#8B5CF6') : 'transparent',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 4,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Users color={active ? "white" : "#6b7280"} size={20} />
                        <Text style={{ color: active ? 'white' : '#6b7280', fontWeight: '900', marginLeft: 8, fontSize: 18 }}>{num}</Text>
                    </View>
                      <Text style={{ color: active ? 'rgba(255,255,255,0.9)' : '#9ca3af', fontSize: 12, fontWeight: '600' }}>Players</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>


          <TouchableOpacity
            onPress={createGame}
            disabled={!isConnected || isCreating}
            activeOpacity={0.8}
            style={{ 
              marginTop: 20, 
              borderRadius: 16, 
              overflow: 'hidden', 
              opacity: !isConnected || isCreating ? 0.6 : 1,
              shadowColor: '#4F46E5',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
            <LinearGradient colors={[ '#4F46E5', '#7C3AED', '#8B5CF6' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
              {isCreating ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <>
                  <LinearGradient colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 8, borderRadius: 12, marginRight: 12 }}>
                    <Play color="#fff" size={20} />
                  </LinearGradient>
                  <Text style={{ color: 'white', fontWeight: '900', fontSize: 16, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>Create Game</Text>
                </>
              )}
            </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
        </LinearGradient>

        {/* Enhanced Join Game */}
        <LinearGradient colors={[ '#FFFFFF', '#F8FAFC', '#E2E8F0' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 20, padding: 2, marginTop: 8, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }}>
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 18, padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <LinearGradient colors={[ '#8B5CF6', '#A855F7' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 8, borderRadius: 12, marginRight: 12 }}>
              <Users color="white" size={20} />
            </LinearGradient>
            <Text style={{ color: '#4F46E5', fontSize: 20, fontWeight: '900', textShadowColor: 'rgba(79,70,229,0.1)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>Join Game</Text>
          </View>

          <Text style={{ color: '#4F46E5', marginBottom: 12, fontWeight: '700', fontSize: 14 }}>Room Code</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              placeholder="Enter room code"
              placeholderTextColor="#a0aec0"
              value={roomCode}
              onChangeText={(t) => setRoomCode(t.toUpperCase())}
              style={{ flex: 1, backgroundColor: 'rgba(79,70,229,0.1)', color: '#4F46E5', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, letterSpacing: 4, fontWeight: '800', fontSize: 16, borderWidth: 2, borderColor: 'rgba(79,70,229,0.3)' }}
              maxLength={6}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              onPress={joinGame}
              disabled={!isConnected || isJoining || !roomCode.trim()}
              style={{ marginLeft: 12, borderRadius: 12, opacity: !isConnected || isJoining || !roomCode.trim() ? 0.6 : 1, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
            >
              <LinearGradient colors={[ '#8B5CF6', '#A855F7' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12 }}>
                {isJoining ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: 'white', fontWeight: '900', fontSize: 14 }}>Join</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 16, backgroundColor: 'rgba(79,70,229,0.1)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(79,70,229,0.2)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <LinearGradient colors={[ '#4F46E5', '#7C3AED' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 6, borderRadius: 8, marginRight: 8 }}>
                <KeyRound color="white" size={14} />
              </LinearGradient>
              <Text style={{ color: '#4F46E5', fontWeight: '800', fontSize: 14 }}>How to join</Text>
            </View>
            <Text style={{ color: '#6B7280', fontSize: 13, marginBottom: 4, fontWeight: '600' }}>• Ask the host for the 6-letter room code</Text>
            <Text style={{ color: '#6B7280', fontSize: 13, marginBottom: 4, fontWeight: '600' }}>• Enter the code above</Text>
            <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '600' }}>• Tap Join to enter the lobby</Text>
          </View>
        </View>
        </LinearGradient>

        {/* Enhanced How to play */}
        <LinearGradient colors={[ '#FFFFFF', '#F8FAFC', '#E2E8F0' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 20, padding: 2, marginTop: 20, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }}>
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 18, padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <LinearGradient colors={[ '#8B5CF6', '#A855F7' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 8, borderRadius: 12, marginRight: 12 }}>
              <HelpCircle color="white" size={20} />
            </LinearGradient>
            <Text style={{ color: '#4F46E5', fontSize: 20, fontWeight: '900', textShadowColor: 'rgba(79,70,229,0.1)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>How to Play</Text>
          </View>
          <View style={{ backgroundColor: 'rgba(79,70,229,0.1)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(79,70,229,0.2)' }}>
            <Text style={{ color: '#4F46E5', marginBottom: 8, fontSize: 14, fontWeight: '700', lineHeight: 20 }}>1. Most players share a word; the spy gets a different word.</Text>
            <Text style={{ color: '#4F46E5', marginBottom: 8, fontSize: 14, fontWeight: '700', lineHeight: 20 }}>2. Describe your word without saying it. Keep it vague but credible.</Text>
            <Text style={{ color: '#4F46E5', fontSize: 14, fontWeight: '700', lineHeight: 20 }}>3. Vote for the spy. Catch them to win — or fool everyone as the spy!</Text>
          </View>
        </View>
        </LinearGradient>
      </ScrollView>
    </LinearGradient>
  );
}



