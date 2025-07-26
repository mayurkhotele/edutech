import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { apiFetchAuth } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';

const { width, height } = Dimensions.get('window');

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  isRead: boolean;
  messageType: string;
  sender?: any;
  receiver?: any;
}

export default function ChatScreen() {
  const { user } = useAuth();
  const { 
    isConnected, 
    joinChat, 
    sendMessage: wsSendMessage, 
    sendTypingIndicator, 
    markMessageAsRead,
    on: wsOn,
    off: wsOff
  } = useWebSocket();

  const route = useRoute();
  const { userId, userName, messages: initialMessages } = route.params as { 
    userId: string; 
    userName: string; 
    messages: any[] 
  };
  
  const [messages, setMessages] = useState<Message[]>(() => {
    // Clean and validate initial messages
    const validMessages = (initialMessages || [])
      .filter(msg => msg && msg.senderId && msg.content)
      .map((msg, index) => ({
        id: msg.id || `init-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        content: msg.content,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        createdAt: msg.createdAt || new Date().toISOString(),
        isRead: msg.isRead || false,
        messageType: msg.messageType || 'text',
        sender: msg.sender,
        receiver: msg.receiver
      }));
    
    console.log('🔧 Initial messages loaded:', validMessages.length);
    return validMessages;
  });

  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [chatId, setChatId] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Generate chat ID for WebSocket room
  useEffect(() => {
    if (user?.id && userId) {
      const sortedIds = [user.id, userId].sort();
      const generatedChatId = `${sortedIds[0]}-${sortedIds[1]}`;
      setChatId(generatedChatId);
    }
  }, [user?.id, userId]);

  useEffect(() => {
    if (isConnected) {
      console.log('✅ WebSocket is connected for user:', user?.id);
    } else {
      console.log('❌ WebSocket is NOT connected for user:', user?.id);
    }
  }, [isConnected]);

  // WebSocket connection and event handlers
  useFocusEffect(
    useCallback(() => {
      if (!chatId) return;

      // Join chat room
      if (isConnected) {
        joinChat(chatId);
        console.log('Joining chat room:', chatId, 'as user:', user?.id);
      }

      // Handle new messages from WebSocket
      wsOn('new_message', (wsData: any) => {
        console.log('📨 [WebSocket] New message received:', wsData, 'User:', user?.id);
        
        // Extract message from WebSocket data
        let messageData = wsData;
        if (wsData.message) {
          messageData = {
            ...wsData.message,
            senderId: wsData.senderId || wsData.message.senderId
          };
        }
        
        // Validate message
        if (!messageData || !messageData.senderId || !messageData.content) {
          console.log('❌ Invalid WebSocket message:', messageData);
          return;
        }
        
        // Check if message is for this chat
        const isForThisChat = messageData.senderId === userId || messageData.receiverId === userId;
        if (!isForThisChat) {
          console.log('🚫 Message not for this chat');
          return;
        }
        
        // Don't add our own messages from WebSocket (they're already in UI)
        if (messageData.senderId === user?.id) {
          console.log('🚫 Skipping own message from WebSocket');
          return;
        }
        
        // Create clean message object
        const newMessage: Message = {
          id: messageData.id || `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content: messageData.content,
          senderId: messageData.senderId,
          receiverId: messageData.receiverId,
          createdAt: messageData.createdAt,
          isRead: messageData.isRead || false,
          messageType: messageData.messageType || 'text',
          sender: messageData.sender,
          receiver: messageData.receiver
        };
        
        // Check for duplicates
        setMessages(prev => {
          const exists = prev.some(msg => 
            msg.content === newMessage.content && 
            msg.senderId === newMessage.senderId &&
            Math.abs(new Date(msg.createdAt).getTime() - new Date(newMessage.createdAt).getTime()) < 5000
          );
          
          if (exists) {
            console.log('🚫 Duplicate message, skipping');
            return prev;
          }
          
          console.log('✅ Adding new message from WebSocket');
          return [...prev, newMessage];
        });
        
        // Mark as read
        if (user?.id && messageData.senderId !== user.id) {
          markMessageAsRead(user.id, messageData.senderId);
        }
      });

      // Handle typing indicators
      wsOn('user_typing', (typingUserId: string) => {
        if (typingUserId === userId) {
          setOtherUserTyping(true);
        }
      });

      wsOn('user_stopped_typing', (typingUserId: string) => {
        if (typingUserId === userId) {
          setOtherUserTyping(false);
        }
      });

      // Cleanup
      return () => {
        wsOff('new_message');
        wsOff('user_typing');
        wsOff('user_stopped_typing');
      };
    }, [chatId, userId, isConnected, joinChat, markMessageAsRead, wsOn, wsOff])
  );

  // Handle typing with debounce
  const handleTyping = useCallback((text: string) => {
    setNewMessage(text);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing indicator
    if (text.length > 0 && isConnected) {
      sendTypingIndicator(chatId, true);
    }

    // Stop typing indicator after delay
    typingTimeoutRef.current = setTimeout(() => {
      if (isConnected) {
        sendTypingIndicator(chatId, false);
      }
    }, 1000);
  }, [chatId, isConnected, sendTypingIndicator]);

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Send message function
  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    
    const messageContent = newMessage.trim();
    setSending(true);
    
    // Create temporary message for immediate UI update
    const tempMessage: Message = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: messageContent,
      senderId: user?.id || '',
      receiverId: userId,
      createdAt: new Date().toISOString(),
      isRead: false,
      messageType: 'text',
      sender: {
        id: user?.id,
        name: user?.name,
        profilePhoto: user?.profilePhoto
      },
      receiver: {
        id: userId,
        name: userName,
        profilePhoto: null
      }
    };
    
    // Add to UI immediately (WhatsApp style)
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    
    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Send to API
      const res = await apiFetchAuth('/student/messages', user?.token || '', {
        method: 'POST',
        body: {
          receiverId: userId,
          content: messageContent
        }
      });
      
      if (res.ok) {
        // Update with server data, fallback to original content/createdAt if missing
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessage.id
            ? {
                ...msg, // fallback to original
                ...res.data, // overwrite with API data
                content: res.data.content || msg.content,
                createdAt: res.data.createdAt || msg.createdAt,
                senderId: user?.id
              }
            : msg
        ));
        
        // Send via WebSocket
        if (isConnected) {
          wsSendMessage({
            content: messageContent,
            receiverId: userId,
            messageType: 'text'
          });
        }
      } else {
        console.error('API error:', res);
      }
    } catch (error) {
      console.error('Send message error:', error);
    } finally {
      setSending(false);
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Render message
  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    console.log(`🎨 Rendering message ${index}:`, {
      content: item.content,
      senderId: item.senderId,
      isMyMessage: item.senderId === user?.id,
      user: user?.id
    });
    
    const isMyMessage = item.senderId === user?.id;
    const showTime = index === messages.length - 1 || 
      new Date(messages[index + 1]?.createdAt).getTime() - new Date(item.createdAt).getTime() > 300000;

    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.theirMessage]}>
        {!isMyMessage && (
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarText}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          </View>
        )}
        
        <View style={styles.messageContent}>
          <LinearGradient
            colors={isMyMessage ? ['#667eea', '#764ba2'] : ['#ffffff', '#f8f9fa']}
            style={[styles.messageBubble, isMyMessage ? styles.myBubble : styles.theirBubble]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.theirMessageText]}>
              {item.content}
            </Text>
          </LinearGradient>
          
          {showTime && (
            <View style={styles.timeContainer}>
              <Text style={[styles.messageTime, isMyMessage ? styles.myMessageTime : styles.theirMessageTime]}>
                {formatTime(item.createdAt)}
              </Text>
              {isMyMessage && (
                <Ionicons 
                  name="checkmark-done" 
                  size={12} 
                  color="#667eea" 
                  style={styles.readIndicator}
                />
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  // Render typing indicator
  const renderTypingIndicator = () => {
    if (!otherUserTyping) return null;
    
    return (
      <View style={styles.typingContainer}>
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarText}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
        </View>
        
        <View style={styles.typingBubble}>
          <View style={styles.typingDot} />
          <View style={styles.typingDot} />
          <View style={styles.typingDot} />
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 56}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#667eea" />
        
        {/* Header */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerInfo}>
              <LinearGradient
                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                style={styles.headerAvatarContainer}
              >
                <Text style={styles.headerAvatarText}>
                  {userName.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerName}>{userName}</Text>
                <View style={styles.statusContainer}>
                  <View style={[styles.onlineIndicator, !isConnected && styles.offlineIndicator]} />
                  <Text style={styles.statusText}>
                    {isConnected ? 'Online' : 'Connecting...'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Messages */}
        <View style={styles.messagesContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => item.id || `msg-${index}-${Date.now()}`}
            renderItem={renderMessage}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={() => renderTypingIndicator()}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No messages yet</Text>
              </View>
            )}
          />
        </View>

        {/* Input */}
        <View style={styles.inputContainer}>
          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.98)']}
            style={styles.inputWrapper}
          >
            <View style={styles.inputContent}>
              <TouchableOpacity style={styles.attachButton}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.attachButtonGradient}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
              
              <View style={styles.textInputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Type a message..."
                  placeholderTextColor="#999"
                  value={newMessage}
                  onChangeText={handleTyping}
                  multiline
                  maxLength={500}
                />
              </View>
              
              <TouchableOpacity
                style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
                onPress={sendMessage}
                disabled={!newMessage.trim() || sending}
              >
                <LinearGradient
                  colors={newMessage.trim() ? ['#667eea', '#764ba2'] : ['#ccc', '#ccc']}
                  style={styles.sendButtonGradient}
                >
                  <Ionicons 
                    name="send" 
                    size={18} 
                    color="#fff" 
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  offlineIndicator: {
    backgroundColor: '#999',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  myMessage: {
    justifyContent: 'flex-end',
  },
  theirMessage: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    marginBottom: 4,
  },
  avatarGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageContent: {
    maxWidth: '70%',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    backgroundColor: '#ffffff', // Fallback background
  },
  myBubble: {
    borderBottomRightRadius: 4,
    backgroundColor: '#667eea', // Fallback for your messages
  },
  theirBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#ffffff',
    fontWeight: '400',
  },
  theirMessageText: {
    color: '#000000',
    fontWeight: '400',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    marginRight: 4,
  },
  messageTime: {
    fontSize: 11,
    marginRight: 4,
  },
  myMessageTime: {
    color: '#667eea',
  },
  theirMessageTime: {
    color: '#999',
  },
  readIndicator: {
    marginLeft: 2,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#999',
    marginHorizontal: 1,
    opacity: 0.6,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    paddingBottom: 56,
  },
  inputWrapper: {
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  attachButton: {
    marginRight: 8,
  },
  attachButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInputContainer: {
    flex: 1,
    marginRight: 8,
  },
  textInput: {
    fontSize: 16,
    color: '#000000',
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 