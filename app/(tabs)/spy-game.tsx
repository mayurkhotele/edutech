import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { HelpCircle, KeyRound, Layers3, Play, Sparkles, Users } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useWebSocket } from '../../context/WebSocketContext';

interface SpyGamePlayer {
  userId: string;
  socketId: string;
  isHost: boolean;
  name: string;
}

interface SpyGame {
  id: string;
  roomCode: string;
  hostId: string;
  maxPlayers: number;
  wordPack: string;
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
  const [wordPack, setWordPack] = useState('default');
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
      socket.emit('create_spy_game', { userId: user.id, maxPlayers, wordPack });
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

  const wordPacks = [
    { id: 'default', name: 'Default', description: 'General words' },
    { id: 'funny', name: 'Funny', description: 'Humorous words' },
    { id: 'hard', name: 'Hard', description: 'Challenging words' },
  ];

  return (
    <LinearGradient colors={[ '#1e1b4b', '#312e81', '#0b1020' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <LinearGradient colors={[ '#4c1d95', '#1e1b4b' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 18, padding: 1, marginBottom: 16 }}>
        <LinearGradient
          colors={[ '#1e1b4b', '#312e81', '#0b1020' ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 16, padding: 20 }}
        >
          <Text style={{ color: '#cbd5e1', marginTop: 8 }}>
            Spot the spy without revealing your word. Blend in, outsmart, and win.
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, marginRight: 8 }}>
              <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: isConnected ? '#22c55e' : '#ef4444', marginRight: 8 }} />
              <Text style={{ color: 'white', fontSize: 12 }}>{isConnected ? 'Online' : 'Offline'}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, marginRight: 8 }}>
              <Users color="#fff" size={16} />
              <Text style={{ color: 'white', fontSize: 12, marginLeft: 6 }}>{user ? 'Signed in' : 'Guest'}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 }}>
              <Sparkles color="#fde68a" size={16} />
              <Text style={{ color: 'white', fontSize: 12, marginLeft: 6 }}>Quick & Fun</Text>
            </View>
          </View>
        </LinearGradient>
        </LinearGradient>

        {/* Section Heading */}
        <View style={{ alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '900' }}>Spy Game</Text>
          <View style={{ width: 80, height: 2, backgroundColor: 'rgba(255,255,255,0.15)', marginTop: 4, borderRadius: 999 }} />
        </View>

        {/* Create Game */}
        <LinearGradient colors={[ 'rgba(167,139,250,0.35)', 'rgba(30,64,175,0.35)' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 18, padding: 1, marginBottom: 16 }}>
        <Animated.View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 16, opacity: createCardAnim, transform: [{ translateY: createCardAnim.interpolate({ inputRange: [0,1], outputRange: [16, 0] }) }] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Layers3 color="#a78bfa" size={18} />
            <Text style={{ color: '#111827', fontSize: 18, fontWeight: '800', marginLeft: 8 }}>Create New Game</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            <Animated.View style={{ transform: [{ rotate: sparkleRotate.interpolate({ inputRange: [0,1], outputRange: ['0deg','360deg'] }) }] }}>
              <Sparkles color="#a78bfa" size={14} />
            </Animated.View>
            <Text style={{ color: '#6b7280', textAlign: 'center', fontSize: 12, marginLeft: 6 }}>Select Number of Players</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
            {[6, 8].map((num) => {
              const active = maxPlayers === num;
              const tileColor = num === 6 ? '#ec4899' : '#3b82f6';
              const tileScale = num === 6 ? tileScale6 : tileScale8;
              return (
                <Animated.View key={num} style={{ flex: 1, marginRight: num !== 8 ? 12 : 0, transform: [{ scale: tileScale }] }}>
                  <TouchableOpacity
                    onPress={() => setMaxPlayers(num)}
                    onPressIn={() => Animated.spring(tileScale, { toValue: 0.97, useNativeDriver: true }).start()}
                    onPressOut={() => Animated.spring(tileScale, { toValue: 1, useNativeDriver: true }).start()}
                    style={{
                      backgroundColor: active ? tileColor : 'rgba(17,24,39,0.06)',
                      borderWidth: 0,
                      paddingVertical: 14,
                      borderRadius: 14,
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOpacity: 0.15,
                      shadowRadius: 10,
                      shadowOffset: { width: 0, height: 6 },
                      elevation: 3,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Users color="#fff" size={18} />
                      <Text style={{ color: 'white', fontWeight: '900', marginLeft: 6, fontSize: 16 }}>{num}</Text>
                    </View>
                    <Text style={{ color: 'white', opacity: 0.95, fontSize: 12, marginTop: 2 }}>Players</Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          <Text style={{ color: '#374151', marginBottom: 8, fontWeight: '700' }}>Word Pack</Text>
          <View>
            {wordPacks.map((pack, idx) => (
              <TouchableOpacity
                key={pack.id}
                onPress={() => setWordPack(pack.id)}
                style={{
                  backgroundColor: wordPack === pack.id ? 'rgba(79,70,229,0.12)' : 'transparent',
                  borderWidth: 1,
                  borderColor: wordPack === pack.id ? '#4F46E5' : '#e5e7eb',
                  padding: 12,
                  borderRadius: 12,
                  marginBottom: idx === wordPacks.length - 1 ? 0 : 8,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
              >
                <Sparkles color="#a78bfa" size={16} />
                <View style={{ marginLeft: 8 }}>
                  <Text style={{ color: '#111827', fontWeight: '700' }}>{pack.name}</Text>
                  <Text style={{ color: '#6b7280', fontSize: 12 }}>{pack.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={createGame}
            disabled={!isConnected || isCreating}
            activeOpacity={0.9}
            style={{ marginTop: 12, borderRadius: 12, overflow: 'hidden', opacity: !isConnected || isCreating ? 0.6 : 1 }}
          >
            <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
            <LinearGradient colors={[ '#6D28D9', '#4F46E5' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
              {isCreating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Play color="#fff" size={18} />
                  <Text style={{ color: 'white', fontWeight: '800', marginLeft: 8 }}>Create Game</Text>
                </>
              )}
            </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
        </LinearGradient>

        {/* Join Game */}
        <LinearGradient colors={[ 'rgba(34,197,94,0.35)', 'rgba(56,189,248,0.35)' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 18, padding: 1 }}>
        <View style={{ backgroundColor: 'rgba(15,23,42,0.85)', borderRadius: 16, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Users color="#22d3ee" size={18} />
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '700', marginLeft: 8 }}>Join Game</Text>
          </View>

          <Text style={{ color: '#cbd5e1', marginBottom: 8 }}>Room Code</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              placeholder="Enter room code"
              placeholderTextColor="#94a3b8"
              value={roomCode}
              onChangeText={(t) => setRoomCode(t.toUpperCase())}
              style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', color: 'white', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, letterSpacing: 4, fontWeight: '700' }}
              maxLength={6}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              onPress={joinGame}
              disabled={!isConnected || isJoining || !roomCode.trim()}
              style={{ marginLeft: 8, backgroundColor: '#059669', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, opacity: !isConnected || isJoining || !roomCode.trim() ? 0.6 : 1 }}
            >
              {isJoining ? <ActivityIndicator color="#fff" /> : <Text style={{ color: 'white', fontWeight: '800' }}>Join</Text>}
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 12, backgroundColor: 'rgba(255,255,255,0.06)', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <KeyRound color="#93c5fd" size={16} />
              <Text style={{ color: 'white', fontWeight: '700', marginLeft: 6 }}>How to join</Text>
            </View>
            <Text style={{ color: '#cbd5e1', fontSize: 12 }}>• Ask the host for the 6-letter room code</Text>
            <Text style={{ color: '#cbd5e1', fontSize: 12 }}>• Enter the code above</Text>
            <Text style={{ color: '#cbd5e1', fontSize: 12 }}>• Tap Join to enter the lobby</Text>
          </View>
        </View>
        </LinearGradient>

        {/* How to play */}
        <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 16, marginTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <HelpCircle color="#a3e635" size={18} />
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '700', marginLeft: 8 }}>How to Play</Text>
          </View>
          <Text style={{ color: '#cbd5e1', marginBottom: 6 }}>1. Most players share a word; the spy gets a different word.</Text>
          <Text style={{ color: '#cbd5e1', marginBottom: 6 }}>2. Describe your word without saying it. Keep it vague but credible.</Text>
          <Text style={{ color: '#cbd5e1' }}>3. Vote for the spy. Catch them to win — or fool everyone as the spy!</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}



