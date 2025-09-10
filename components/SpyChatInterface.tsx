import { LinearGradient } from 'expo-linear-gradient';
import { Crown, MessageSquare, Play, Send, Users, Volume2, Mic, MicOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Share, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import Constants from 'expo-constants';
import { WebView } from 'react-native-webview';
import { BlurView } from 'expo-blur';

type ChatMessage = {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string | number | Date;
  type: 'chat' | 'description' | 'system';
};

type Player = { userId: string; name: string; isHost: boolean };

type SpyChatInterfaceProps = {
  game: { id: string; roomCode: string; players: Player[] } | null;
  user: { id?: string; name?: string } | null;
  isConnected?: boolean;
  currentPhase: string;
  myWord?: string;
  isSpy?: boolean;
  currentTurn?: number;
  timeLeft?: number;
  isMyTurn?: boolean;
  results?: any;
  // Optional: pass a socket instance; if omitted, we try to get it from utils/websocket
  socket?: any;
};

type CategoryOption = { id: string; name: string; description?: string };

function generateUniqueId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function SpyChatInterface({
  game,
  user,
  isConnected = true,
  currentPhase,
  myWord,
  isSpy,
  currentTurn = 0,
  timeLeft = 20,
  isMyTurn = false,
  results,
  socket: socketProp,
}: SpyChatInterfaceProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [votingActive, setVotingActive] = useState(false);
  const [revealData, setRevealData] = useState<any>(null);
  const [showVoice, setShowVoice] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [categoryVoteActive, setCategoryVoteActive] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [myCategoryVote, setMyCategoryVote] = useState<string | null>(null);

  const socket = useMemo(() => {
    if (socketProp) return socketProp;
    try {
      const ws = require('../utils/websocket').default.getSocket();
      return ws;
    } catch {
      return null;
    }
  }, [socketProp]);

  // Daily Prebuilt URL from env (Expo Go friendly)
  const dailyDomain = (process as any)?.env?.EXPO_PUBLIC_DAILY_DOMAIN || (Constants?.expoConfig as any)?.extra?.dailyDomain; // e.g. your-subdomain.daily.co
  const dailyRoomUrlEnv = (process as any)?.env?.EXPO_PUBLIC_DAILY_ROOM_URL || (Constants?.expoConfig as any)?.extra?.dailyRoomUrl; // e.g. https://sub.daily.co/room
  const dailyUrl = useMemo(() => {
    const displayName = encodeURIComponent(user?.name || 'Player');
    if (dailyRoomUrlEnv) {
      const hasQuery = String(dailyRoomUrlEnv).includes('?');
      return `${dailyRoomUrlEnv}${hasQuery ? '&' : '?'}embed=1&startVideoOff=1&startAudioOff=1&hideLeaveButton=1&hideFullscreenButton=1&showLeaveButton=0&displayName=${displayName}`;
    }
    if (!dailyDomain) return null;
    const roomName = `spy-${game?.id || 'demo'}`;
    return `https://${dailyDomain}/${roomName}?embed=1&startVideoOff=1&startAudioOff=1&hideLeaveButton=1&hideFullscreenButton=1&showLeaveButton=0&displayName=${displayName}`;
  }, [dailyDomain, dailyRoomUrlEnv, game?.id, user?.name]);

  const webViewRef = useRef<WebView>(null);
  const INPUT_BAR_HEIGHT = 64;

  // Turn-based mic gating for Daily Prebuilt (best-effort; user may still need to tap inside WebView)
  useEffect(() => {
    if (!dailyUrl) return;
    if (currentPhase !== 'DESCRIBING') return;
    const js = (isMyTurn && micOn)
      ? "try{(window.callFrame&&window.callFrame.setLocalAudio(true))||(window.daily&&window.daily.setLocalAudio&&window.daily.setLocalAudio(true));}catch(e){}"
      : "try{(window.callFrame&&window.callFrame.setLocalAudio(false))||(window.daily&&window.daily.setLocalAudio&&window.daily.setLocalAudio(false));}catch(e){}";
    try {
      webViewRef.current?.injectJavaScript(js);
    } catch {}
  }, [dailyUrl, currentPhase, isMyTurn, micOn]);

  const toggleMic = () => {
    if (!dailyUrl) return;
    if (!isMyTurn) return;
    const next = !micOn;
    setMicOn(next);
    const js = next
      ? "try{(window.callFrame&&window.callFrame.setLocalAudio(true))||(window.daily&&window.daily.setLocalAudio&&window.daily.setLocalAudio(true));}catch(e){}"
      : "try{(window.callFrame&&window.callFrame.setLocalAudio(false))||(window.daily&&window.daily.setLocalAudio&&window.daily.setLocalAudio(false));}catch(e){}";
    try { webViewRef.current?.injectJavaScript(js); } catch {}
  };

  // Push-to-talk handlers
  const pttDown = () => {
    if (!dailyUrl || !isMyTurn) return;
    setMicOn(true);
    try { webViewRef.current?.injectJavaScript("try{(window.callFrame&&window.callFrame.setLocalAudio(true))||(window.daily&&window.daily.setLocalAudio&&window.daily.setLocalAudio(true));}catch(e){}"); } catch {}
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
  };
  const pttUp = () => {
    if (!dailyUrl) return;
    setMicOn(false);
    try { webViewRef.current?.injectJavaScript("try{(window.callFrame&&window.callFrame.setLocalAudio(false))||(window.daily&&window.daily.setLocalAudio&&window.daily.setLocalAudio(false));}catch(e){}"); } catch {}
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
  };

  // Listen to socket events
  useEffect(() => {
    if (!socket) return;
    const onChat = (data: ChatMessage) => {
      const safeId = data?.id || generateUniqueId();
      setChatMessages((prev) => [...prev, { ...data, id: safeId }]);
    };
    const onDescription = (data: { playerId: string; description: string }) => {
      if (!game) return;
      const playerName = game.players.find((p) => p.userId === data.playerId)?.name || 'Unknown';
      const msg: ChatMessage = {
        id: generateUniqueId(),
        userId: data.playerId,
        userName: playerName,
        message: data.description,
        timestamp: Date.now(),
        type: 'description',
      };
      setChatMessages((prev) => [...prev, msg]);
    };
    const onVotingStarted = () => {
      setMyVote(null);
      setVotingActive(true);
    };
    const onVoteSubmitted = (data: { voterId: string; votedForId: string }) => {
      if (data.voterId === user?.id) {
        setMyVote(data.votedForId);
      }
    };
    const onDescriptionPhase = () => {
      setVotingActive(false);
      setMyVote(null);
    };
    const onGameEnded = (data: any) => {
      setVotingActive(false);
      setRevealData(data);
    };

    // Category vote flow
    const onCategoryVoteStarted = (data: { categories?: CategoryOption[]; timeoutSec?: number }) => {
      setCategoryOptions(Array.isArray(data?.categories) ? data.categories : []);
      setCategoryVoteActive(true);
      setMyCategoryVote(null);
    };
    const onCategoryVoteSubmitted = (data: { userId: string; categoryId: string }) => {
      if (data?.userId && data.userId === user?.id) {
        setMyCategoryVote(data.categoryId);
      }
    };
    const onCategoryVoteResult = (_data: { categoryId: string; categoryName?: string }) => {
      setCategoryVoteActive(false);
      setMyCategoryVote(null);
    };

    socket.on('chat_message_received', onChat);
    socket.on('description_submitted', onDescription);
    socket.on('voting_started', onVotingStarted);
    socket.on('vote_submitted', onVoteSubmitted);
    socket.on('description_phase_started', onDescriptionPhase);
    socket.on('spy_game_ended', onGameEnded);
    socket.on('category_vote_started', onCategoryVoteStarted);
    socket.on('category_vote_submitted', onCategoryVoteSubmitted);
    socket.on('category_vote_result', onCategoryVoteResult);

    return () => {
      socket.off('chat_message_received', onChat);
      socket.off('description_submitted', onDescription);
      socket.off('voting_started', onVotingStarted);
      socket.off('vote_submitted', onVoteSubmitted);
      socket.off('description_phase_started', onDescriptionPhase);
      socket.off('spy_game_ended', onGameEnded);
      socket.off('category_vote_started', onCategoryVoteStarted);
      socket.off('category_vote_submitted', onCategoryVoteSubmitted);
      socket.off('category_vote_result', onCategoryVoteResult);
    };
  }, [socket, game, user?.id]);

  const formatTime = (ts: string | number | Date) => {
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const sendMessage = () => {
    if (!socket || !game || !newMessage.trim()) return;
    socket.emit('send_chat_message', { gameId: game.id, message: newMessage.trim() });
    setNewMessage('');
  };

  const sendDescription = () => {
    if (!socket || !game || !newMessage.trim()) return;
    socket.emit('submit_description', { gameId: game.id, description: newMessage.trim() });
    // Optimistic add as description-type message
    const name = user?.name || 'Me';
    const msg: ChatMessage = {
      id: generateUniqueId(),
      userId: user?.id || 'me',
      userName: name,
      message: newMessage.trim(),
      timestamp: Date.now(),
      type: 'description',
    };
    setChatMessages((prev) => [...prev, msg]);
    setNewMessage('');
  };

  const handleTyping = () => {
    if (!socket || !game) return;
    socket.emit('typing', { gameId: game.id, userId: user?.id, userName: user?.name });
  };
  const handleStopTyping = () => {
    if (!socket || !game) return;
    socket.emit('stop_typing', { gameId: game.id, userId: user?.id, userName: user?.name });
  };

  const shareRoomCode = async () => {
    if (!game) return;
    try {
      await Share.share({ message: `Join my Spy room ${game.roomCode}` });
    } catch {}
  };

  const isHost = useMemo(() => !!game?.players.find((p) => p.userId === user?.id && p.isHost), [game?.players, user?.id]);
  const currentSpeakerId = useMemo(() => (currentPhase === 'DESCRIBING' ? game?.players?.[currentTurn]?.userId : undefined), [currentPhase, currentTurn, game?.players]);

  return (
    <LinearGradient colors={[ '#4c1d95', '#7c3aed' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      {/* Header */}
      <LinearGradient colors={[ '#5b21b6', '#9333ea' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: 'white', fontWeight: '900' }}>WHO'S THE SPY</Text>
          {!!game && (
            <View style={{ marginTop: 8, backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#93c5fd', fontSize: 10, marginRight: 8 }}>ROOM</Text>
              <Text style={{ color: 'white', fontWeight: '900', letterSpacing: 3 }}>{game.roomCode}</Text>
            </View>
          )}
          {/* Header word chip removed for a cleaner look */}
        </View>
      </LinearGradient>

      {/* Players & Word Card */}
      <View style={{ backgroundColor: 'rgba(0,0,0,0.15)', padding: 16 }}>
        {/* Players */}
        <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Users color="#94a3b8" size={18} />
            <Text style={{ color: 'white', fontWeight: '800', marginLeft: 8 }}>Players ({game?.players?.length || 0})</Text>
          </View>
          {game?.players?.map((player, index) => {
            const isMe = user?.id && player.userId === user.id;
            const isActive = isMyTurn && isMe;
            return (
              <View key={player.userId} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, backgroundColor: isActive ? 'rgba(34,197,94,0.12)' : 'transparent', borderRadius: 10, paddingHorizontal: 6 }}>
                <View style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: isActive ? 'rgba(34,197,94,0.35)' : 'rgba(59,130,246,0.35)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: 'white', fontWeight: '800' }}>{player.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                </View>
                <View style={{ marginLeft: 10, flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: 'white', fontWeight: '700' }}>{player.name}</Text>
                  {isMe && (
                    <View style={{ marginLeft: 8, backgroundColor: 'rgba(59,130,246,0.25)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
                      <Text style={{ color: '#bfdbfe', fontSize: 10, fontWeight: '800' }}>You</Text>
                    </View>
                  )}
                </View>
                {currentPhase === 'VOTING' || votingActive ? (
                  <TouchableOpacity
                    onPress={() => {
                      if (!socket || !game || myVote) return;
                      socket.emit('submit_vote', { gameId: game.id, votedForId: player.userId });
                      setMyVote(player.userId);
                    }}
                    disabled={!!myVote}
                    style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: myVote === player.userId ? 'transparent' : 'rgba(255,255,255,0.15)', backgroundColor: myVote === player.userId ? '#16a34a' : 'rgba(255,255,255,0.08)' }}
                  >
                    <Text style={{ color: 'white', fontWeight: '800' }}>{myVote === player.userId ? 'Voted' : 'Vote'}</Text>
                  </TouchableOpacity>
                ) : (
                  player.isHost ? <Crown color="#fbbf24" size={16} /> : <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: isActive ? '#22c55e' : '#94a3b8' }} />
                )}
              </View>
            );
          })}

          {/* Host Controls (optional) */}
          {currentPhase === 'LOBBY' && isHost && (
            <View style={{ marginTop: 12, borderRadius: 12, overflow: 'hidden' }}>
              <TouchableOpacity
                onPress={() => socket?.emit('start_spy_game', { gameId: game?.id })}
                disabled={!isConnected || (game?.players?.length || 0) < 2}
                activeOpacity={0.9}
                style={{ opacity: !isConnected || (game?.players?.length || 0) < 2 ? 0.6 : 1 }}
              >
                <LinearGradient colors={[ '#16a34a', '#059669' ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', borderRadius: 10 }}>
                  <Play color="#fff" size={18} />
                  <Text style={{ color: 'white', fontWeight: '900', marginLeft: 8 }}>Start Game</Text>
                </LinearGradient>
              </TouchableOpacity>
              <Text style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', marginTop: 6 }}>
                {(game?.players?.length || 0) < 2 ? 'Need at least 2 players' : 'Ready to start!'}
              </Text>
            </View>
          )}
        </View>

        {/* Word card removed as requested */}
      </View>

      {/* Chat + Input */}
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        {(currentPhase === 'REVEAL' || !!revealData) && (results || revealData) && (
          <View style={{ padding: 12, backgroundColor: 'rgba(5,150,105,0.15)', borderBottomWidth: 1, borderBottomColor: 'rgba(5,150,105,0.35)' }}>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '900', textAlign: 'center' }}>
              {(results || revealData)?.winner === 'VILLAGERS' ? 'Villagers Win! 🎉' : (results || revealData)?.winner === 'SPY' ? 'Spy Wins! 🕵️‍♂️' : 'Results'}
            </Text>
          </View>
        )}

        {/* Turn / Timer strip */}
        {currentPhase === 'DESCRIBING' && (
          <View style={{ padding: 12, backgroundColor: 'rgba(109,40,217,0.15)', borderBottomWidth: 1, borderBottomColor: 'rgba(109,40,217,0.35)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: '#22c55e', marginRight: 8 }} />
                <Text style={{ color: 'white', fontWeight: '700' }}>{isMyTurn ? 'Your Turn' : `Player ${currentTurn + 1}'s Turn`}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: 'white', fontWeight: '800', marginRight: 8 }}>{timeLeft}s</Text>
                <View style={{ width: 100, height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999, overflow: 'hidden' }}>
                  <LinearGradient
                    colors={[ '#22c55e', '#3b82f6' ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: `${Math.max(0, Math.min(100, (timeLeft / 20) * 100))}%`, height: '100%' }}
                  />
                </View>
              </View>
            </View>
            {/* Voice controls */}
            <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'center' }}>
              <TouchableOpacity onPress={() => { setShowVoice(true); if (isMyTurn) { setMicOn(true); try { webViewRef.current?.injectJavaScript("try{(window.callFrame&&window.callFrame.setLocalAudio(true))||(window.daily&&window.daily.setLocalAudio&&window.daily.setLocalAudio(true));}catch(e){}"); } catch {} } }} style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, marginRight: 8 }}>
                <Volume2 color="#fff" size={16} />
                <Text style={{ color: 'white', marginLeft: 6 }}>Connect Voice</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!isMyTurn}
                onPress={toggleMic}
                onPressIn={pttDown}
                onPressOut={pttUp}
                style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: isMyTurn ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, opacity: isMyTurn ? 1 : 0.5 }}
              >
                {micOn ? <Mic color="#fff" size={16} /> : <MicOff color="#fff" size={16} />}
                <Text style={{ color: 'white', marginLeft: 6 }}>{micOn ? 'Mic On' : 'Mic Off'}</Text>
              </TouchableOpacity>
            </View>
            {/* Inline input under Connect Voice */}
            <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                placeholder={isMyTurn ? 'Type your description…' : 'Type a message…'}
                placeholderTextColor="#9ca3af"
                value={newMessage}
                onChangeText={(t) => {
                  setNewMessage(t);
                  handleTyping();
                }}
                onBlur={handleStopTyping}
                style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.10)', color: 'white', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}
              />
              <TouchableOpacity
                onPress={isMyTurn ? sendDescription : sendMessage}
                disabled={!newMessage.trim() || !isConnected}
                style={{ marginLeft: 8, backgroundColor: !newMessage.trim() || !isConnected ? 'rgba(255,255,255,0.12)' : '#2563eb', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 }}
              >
                {(!newMessage.trim() || !isConnected) ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Send color="#fff" size={18} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Voting full-height banner so input stays visible at bottom */}
        {(currentPhase === 'VOTING' || votingActive) && (
          <View style={{ flex: 1, paddingHorizontal: 12, paddingTop: 12, paddingBottom: INPUT_BAR_HEIGHT + 12, backgroundColor: 'rgba(251,191,36,0.10)', borderBottomWidth: 1, borderBottomColor: 'rgba(251,191,36,0.35)' }}>
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: '900', fontSize: 16, marginBottom: 8 }}>Tap Vote on a player</Text>
            <Text style={{ color: '#fde68a', textAlign: 'center' }}>Voting in progress… chat is still available below</Text>
          </View>
        )}

        {/* Avatars strip (hidden during voting to keep layout clean) */}
        {!(currentPhase === 'VOTING' || votingActive) && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12 }}>
            {game?.players?.map((p) => {
              const isMe = p.userId === user?.id;
              const isSpeaking = p.userId === currentSpeakerId;
              return (
                <View key={p.userId} style={{ marginRight: 10, alignItems: 'center' }}>
                  <View style={{ width: 44, height: 44, borderRadius: 999, backgroundColor: 'rgba(99,102,241,0.35)', alignItems: 'center', justifyContent: 'center', borderWidth: isMe ? 2 : (isSpeaking ? 2 : 0), borderColor: isSpeaking ? '#22c55e' : '#60a5fa', shadowColor: isSpeaking ? '#22c55e' : undefined, shadowOpacity: isSpeaking ? 0.6 : 0, shadowRadius: isSpeaking ? 8 : 0, shadowOffset: isSpeaking ? { width: 0, height: 0 } : undefined }}>
                    <Text style={{ color: 'white', fontWeight: '900' }}>{p.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                  </View>
                  {isSpeaking && (
                    <View style={{ marginTop: 4, backgroundColor: '#22c55e', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 }}>
                      <Text style={{ color: '#0b1020', fontSize: 9, fontWeight: '900' }}>SPEAKING</Text>
                    </View>
                  )}
                  <Text numberOfLines={1} style={{ color: '#9ca3af', fontSize: 10, marginTop: 4, maxWidth: 60 }}>{p.name}</Text>
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* System Log (compact) - removed to declutter */}

        {/* Messages (hidden during voting for a focused layout) */}
        {!(currentPhase === 'VOTING' || votingActive) && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 12 }}>
          {chatMessages.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 24 }}>
              <MessageSquare color="#9ca3af" size={48} />
              <Text style={{ color: '#9ca3af', marginTop: 8 }}>No messages yet. Start the conversation!</Text>
            </View>
          ) : (
            chatMessages.map((m) => {
              const mine = m.userId === user?.id;
              const bg = mine ? '#2563eb' : m.type === 'description' ? '#7c3aed' : m.type === 'system' ? '#4b5563' : '#374151';
              const fg = '#fff';
              return (
                <View key={m.id} style={{ flexDirection: 'row', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                  <View style={{ maxWidth: '85%', backgroundColor: bg, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 }}>
                    <Text style={{ color: fg, opacity: 0.8, fontSize: 12, marginBottom: 2 }}>
                      {m.userName}
                      {m.type === 'description' ? '  📝' : ''}
                    </Text>
                    <Text style={{ color: fg }}>{m.message}</Text>
                    <Text style={{ color: fg, opacity: 0.8, fontSize: 10, marginTop: 4 }}>{formatTime(m.timestamp)}</Text>
                  </View>
                </View>
              );
            })
          )}
          {typingUsers.length > 0 && (
            <Text style={{ color: '#9ca3af', fontStyle: 'italic' }}>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…</Text>
          )}
          </ScrollView>
        )}

        {/* Input area for non-describing phases */}
        {currentPhase !== 'DESCRIBING' && (
          <View style={{ paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(2,6,23,0.30)', flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              placeholder={'Type a message…'}
              placeholderTextColor="#9ca3af"
              value={newMessage}
              onChangeText={(t) => {
                setNewMessage(t);
                handleTyping();
              }}
              onBlur={handleStopTyping}
              style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.10)', color: 'white', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!newMessage.trim() || !isConnected}
              style={{ marginLeft: 8, backgroundColor: !newMessage.trim() || !isConnected ? 'rgba(255,255,255,0.12)' : '#2563eb', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 }}
            >
              {(!newMessage.trim() || !isConnected) ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Send color="#fff" size={18} />
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
      {/* Removed absolute bottom input; input is now inline under Connect Voice or below messages */}
      {/* Invisible Daily audio bridge (auto-join, hidden UI) */}
      {dailyUrl && (
        <WebView
          source={{ uri: dailyUrl }}
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
          javaScriptEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          mediaCapturePermissionGrantType="grant"
          ref={webViewRef}
        />
      )}
      {/* Category Vote Modal */}
      {categoryVoteActive && (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <View style={{ width: '92%', maxWidth: 420, backgroundColor: '#111827', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16 }}>
            <Text style={{ color: 'white', fontWeight: '800', fontSize: 16, marginBottom: 6 }}>Select a Category</Text>
            <Text style={{ color: '#d1d5db', fontSize: 12, marginBottom: 12 }}>Everyone votes. Majority wins. Random picks a random category.</Text>
            {categoryOptions.map((opt) => {
              const selected = myCategoryVote === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  disabled={!!myCategoryVote}
                  onPress={() => {
                    if (!socket || !game || myCategoryVote) return;
                    socket.emit('submit_category_vote', { gameId: game.id, categoryId: opt.id });
                    setMyCategoryVote(opt.id);
                  }}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: selected ? 'transparent' : 'rgba(255,255,255,0.12)',
                    backgroundColor: selected ? '#16a34a' : 'rgba(255,255,255,0.05)',
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '800' }}>{opt.name}</Text>
                  {!!opt.description && <Text style={{ color: '#cbd5e1', fontSize: 12, marginTop: 2 }}>{opt.description}</Text>}
                </TouchableOpacity>
              );
            })}
            {!!myCategoryVote && (
              <Text style={{ color: '#9ca3af', textAlign: 'center', marginTop: 6 }}>Vote submitted. Waiting for others…</Text>
            )}
          </View>
        </View>
      )}
    </LinearGradient>
  );
}


