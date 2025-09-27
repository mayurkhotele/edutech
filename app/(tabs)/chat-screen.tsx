import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useWebSocket } from '@/context/WebSocketContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface User {
  id: string;
  name: string;
  profilePhoto?: string | null;
  course?: string | null;
  year?: number | null;
}

interface Message {
  id: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE';
  fileUrl?: string | null;
  isRead: boolean;
  createdAt: string;
  sender: User;
  receiver: User;
  isRequest?: boolean;
  requestId?: string;
}

interface MessageRequest {
  id: string;
  content: string;
  messageType: string;
  fileUrl: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  sender: User;
  receiver: User;
}

interface ChatScreenProps {
  route: {
    params: {
      userId: string;
      userName: string;
      userProfilePhoto?: string;
      isFollowing: boolean;
    };
  };
}

const ChatScreen: React.FC<ChatScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const userId = params.userId as string || '';
  const userName = params.userName as string || 'User';
  const userProfilePhoto = params.userProfilePhoto as string || '';
  const isFollowing = params.isFollowing === 'true';
  
  // Debug: Log received parameters
  console.log('🔍 Chat Screen Parameters:', { userId, userName, userProfilePhoto, isFollowing });
  console.log('🔍 Raw params:', params);
  console.log('🔍 Params type:', typeof params);
  console.log('🔍 Params keys:', Object.keys(params));
  
  // Context hooks
  const { user: currentUser } = useAuth();
  const { isConnected, sendMessage: sendWebSocketMessage, on, off, connect } = useWebSocket();
  
  // Debug WebSocket connection
  useEffect(() => {
    console.log('🔌 WebSocket Connection Status:', isConnected);
    console.log('👤 Current User:', currentUser?.id);
    console.log('🔑 Token available:', !!currentUser?.token);
    
    if (!isConnected && currentUser?.token && currentUser?.id) {
      console.log('🔄 Attempting to connect WebSocket...');
      connect();
    }
  }, [isConnected, currentUser, connect]);
  
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageRequests, setMessageRequests] = useState<MessageRequest[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Debug newMessage state
  useEffect(() => {
    console.log('💬 New message state changed:', newMessage);
    console.log('🔍 Send button should be enabled:', !!newMessage.trim() && !sending);
  }, [newMessage, sending]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch messages when component mounts or userId changes
  useEffect(() => {
    if (userId) {
      fetchMessages(userId);
      fetchMessageRequests();
    }
  }, [userId]);

  // WebSocket event listeners for real-time messaging
  useEffect(() => {
    if (!isConnected) {
      console.log('🔌 WebSocket not connected, skipping event listeners');
      return;
    }

    console.log('🔌 Setting up WebSocket event listeners for chat...');

    // Listen for new messages
    const handleNewMessage = (message: Message) => {
      console.log('📨 Received new message via WebSocket:', message);
      console.log('📨 Current userId:', userId);
      console.log('📨 Message sender:', message.sender.id);
      console.log('📨 Message receiver:', message.receiver.id);
      
      // Check if this message is for the current chat
      const isForCurrentChat = (
        (message.sender.id === userId && message.receiver.id === currentUser?.id) ||
        (message.sender.id === currentUser?.id && message.receiver.id === userId)
      );

      if (isForCurrentChat) {
        console.log('📨 Message is for current chat, adding to messages');
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          const messageExists = prev.some(msg => msg.id === message.id);
          if (messageExists) {
            console.log('📨 Message already exists, skipping');
            return prev;
          }
          console.log('📨 Adding new message to chat');
          return [...prev, message];
        });
      } else {
        console.log('📨 Message is not for current chat, ignoring');
      }
    };

    // Listen for message sent confirmation
    const handleMessageSent = (message: Message) => {
      console.log('✅ Message sent confirmation via WebSocket:', message);
      setMessages(prev => prev.map(msg => 
        msg.id.startsWith('temp-') && msg.content === message.content 
          ? message 
          : msg
      ));
    };

    // Listen for messages read
    const handleMessagesRead = ({ readerId }: { readerId: string }) => {
      console.log('👁️ Messages read by:', readerId);
      if (userId && userId === readerId) {
        setMessages(prev =>
          prev.map(msg => 
            msg.sender.id === currentUser?.id ? { ...msg, isRead: true } : msg
          )
        );
      }
    };

    // Listen for typing indicators
    const handleUserTyping = (typingUserId: string, isTyping: boolean) => {
      console.log('⌨️ User typing:', typingUserId, isTyping);
      if (typingUserId === userId) {
        setIsTyping(isTyping);
      }
    };

    // Set up event listeners
    on('onMessageReceived', handleNewMessage);
    on('onMessageSent', handleMessageSent);
    on('onMessagesRead', handleMessagesRead);
    on('onUserTyping', handleUserTyping);

    // Join the chat room for this conversation
    if (userId && currentUser?.id) {
      const chatId = [currentUser.id, userId].sort().join('-');
      console.log('🔌 Joining chat room:', chatId);
      // Note: joinChat method should be available from WebSocket context
    }

    // Cleanup event listeners
    return () => {
      console.log('🔌 Cleaning up WebSocket event listeners');
      off('onMessageReceived');
      off('onMessageSent');
      off('onMessagesRead');
      off('onUserTyping');
    };
  }, [on, off, userId, currentUser, isConnected]);

  // Effect to mark messages as read when a chat is opened
  useEffect(() => {
    if (isConnected && userId && currentUser) {
      const unreadMessages = messages.filter(
        (msg) => msg.receiver.id === currentUser.id && !msg.isRead
      );

      if (unreadMessages.length > 0) {
        markMessagesAsRead();
      }
    }
  }, [userId, messages, isConnected, currentUser]);

     // Polling fallback for real-time messages (when WebSocket is not working)
   useEffect(() => {
     if (!isConnected && userId) {
       console.log('🔌 WebSocket not connected, setting up polling fallback');
       
       const pollInterval = setInterval(() => {
         console.log('🔄 Polling for new messages...');
         fetchMessages(userId, true);
       }, 3000); // Poll every 3 seconds

       return () => {
         console.log('🔄 Clearing polling interval');
         clearInterval(pollInterval);
       };
     } else if (isConnected) {
       console.log('✅ WebSocket connected, polling disabled');
     }
   }, [isConnected, userId]);

  // Fetch messages from API
  const fetchMessages = async (targetUserId: string, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoadingMessages(true);
      }
      
      if (!currentUser?.token) {
        throw new Error('No authentication token');
      }

      console.log('📡 Fetching messages for user:', targetUserId);
      const response = await apiFetchAuth(`/student/messages/${targetUserId}`, currentUser.token);
      
      if (response.data) {
        // Messages ko time ke according sort karo (oldest first)
        const sortedMessages = [...response.data].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        console.log('📨 Fetched messages count:', sortedMessages.length);
        
        // Only update if we have new messages or different count
        setMessages(prev => {
          if (prev.length !== sortedMessages.length) {
            console.log('📨 Message count changed, updating messages');
            return sortedMessages;
          }
          
          // Check if any messages are different
          const hasChanges = sortedMessages.some((newMsg, index) => {
            const oldMsg = prev[index];
            return !oldMsg || oldMsg.id !== newMsg.id || oldMsg.content !== newMsg.content;
          });
          
          if (hasChanges) {
            console.log('📨 Messages changed, updating');
            return sortedMessages;
          }
          
          console.log('📨 No new messages, keeping current state');
          return prev;
        });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (!isRefresh) {
        Alert.alert('Error', 'Failed to load messages');
      }
    } finally {
      setLoadingMessages(false);
      setRefreshing(false);
    }
  };

  // Handle pull to refresh
  const onRefresh = () => {
    if (userId) {
      fetchMessages(userId, true);
      fetchMessageRequests();
    }
  };

  // Fetch message requests
  const fetchMessageRequests = async () => {
    try {
      if (!currentUser?.token) return;

      const response = await apiFetchAuth('/student/message-requests', currentUser.token);
      
      if (response.data) {
        setMessageRequests(response.data);
      }
    } catch (error) {
      console.error('Error fetching message requests:', error);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async () => {
    try {
      if (!currentUser?.token || !userId) return;

      await apiFetchAuth('/student/messages/read', currentUser.token, {
        method: 'POST',
        body: { otherUserId: userId },
      });

      // Update messages locally
      setMessages(prev => 
        prev.map(msg => 
          msg.receiver.id === currentUser.id ? { ...msg, isRead: true } : msg
        )
      );

    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Handle accept message request
  const handleAcceptRequest = async (requestId: string) => {
    try {
      if (!currentUser?.token) return;

      const response = await apiFetchAuth('/student/message-requests', currentUser.token, {
        method: 'POST',
        body: {
          requestId,
          action: 'accept'
        },
      });

      if (response.data) {
        setMessageRequests(prev => prev.filter(req => req.id !== requestId));
        
        if (response.data.message) {
          setMessages(prev => prev.map(msg => 
            msg.requestId === requestId ? response.data.message : msg
          ));
        }
      }
    } catch (error) {
      console.error('Error accepting message request:', error);
    }
  };

  // Handle reject message request
  const handleRejectRequest = async (requestId: string) => {
    try {
      if (!currentUser?.token) return;

      const response = await apiFetchAuth('/student/message-requests', currentUser.token, {
        method: 'POST',
        body: {
          requestId,
          action: 'reject'
        },
      });

      if (response.ok) {
        setMessageRequests(prev => prev.filter(req => req.id !== requestId));
        setMessages(prev => prev.filter(msg => msg.requestId !== requestId));
      }
    } catch (error) {
      console.error('Error rejecting message request:', error);
    }
  };

    // Send message function
  const sendMessage = async () => {
    console.log('🚀 Send message function called');
    console.log('🔍 Validation check - userId:', userId, 'newMessage:', newMessage.trim(), 'currentUser:', !!currentUser);
    
    // Validation check
    if (!userId || !newMessage.trim() || !currentUser) {
      console.log('❌ Validation failed - not sending message');
      return;
    }

    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    // Create optimistic message for immediate display
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: content,
      messageType: 'TEXT',
      fileUrl: null,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: currentUser.id,
        name: currentUser.name || 'You',
        profilePhoto: currentUser.profilePhoto,
      },
      receiver: {
        id: userId,
        name: userName,
        profilePhoto: userProfilePhoto,
      },
    };

    // Add optimistic message to UI immediately
    setMessages(prev => [...prev, optimisticMessage]);

         try {
       // Force REST API for now (WebSocket can be enabled later)
       console.log('🔌 Using REST API for message sending');

       // Fallback to REST API if WebSocket is not available
       console.log('📤 Sending message via REST API...');
      if (!currentUser.token) {
        throw new Error('No authentication token');
      }

      const messagePayload = {
        receiverId: userId,
        content: content,
        messageType: 'TEXT'
      };

      console.log('📤 Sending message payload:', messagePayload);

      const response = await apiFetchAuth('/student/messages', currentUser.token, {
        method: 'POST',
        body: messagePayload,
      });

      console.log('📥 API Response:', response);

      if (response.data) {
        const result = response.data;

        if (result.type === 'direct') {
          // Replace optimistic message with real message from server
          if (result.message) {
            setMessages(prev => prev.map(msg => 
              msg.id === optimisticMessage.id ? result.message : msg
            ));
          }
          
          // Emit socket event for real-time delivery
          if (isConnected) {
            const chatId = [currentUser.id, userId].sort().join('-');
            // WebSocket will handle this automatically
          }
          
          console.log('Message sent successfully');
           
        } else if (result.type === 'request') {
          // Remove optimistic message since it was sent as request
          setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
          
          Alert.alert(
            'Message Request', 
            'Message sent as request. The recipient will need to accept it to start the conversation.'
          );
        }
      }

    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setNewMessage(content);
      
      if (error.message?.includes('follow')) {
        Alert.alert('Follow Required', 'You need to follow this user first before you can message them.');
      } else {
        Alert.alert('Error', `Message failed: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setSending(false);
    }
  };

  // Handle typing indicator
  const handleTypingChange = (text: string) => {
    console.log('⌨️ Typing change:', text);
    setNewMessage(text);

    // Send typing indicator via WebSocket
    if (isConnected && userId && currentUser) {
      const chatId = [currentUser.id, userId].sort().join('-');
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        // Stop typing indicator after 2 seconds
      }, 2000);
    }
  };

  // Handle enter key press
  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

    const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender.id === currentUser?.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer
      ]}>
        {/* Avatar for other person's messages */}
        {!isMyMessage && (
          <View style={styles.messageAvatar}>
            {userProfilePhoto ? (
              <Image source={{ uri: userProfilePhoto }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {userName && userName.length > 0 ? userName.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            )}
          </View>
        )}
        
        {/* Message Bubble */}
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble
        ]}>
          {/* File/Image Message */}
          {item.fileUrl && item.messageType === 'IMAGE' ? (
            <Image 
              source={{ uri: item.fileUrl }} 
              style={styles.messageImage}
              resizeMode="cover"
            />
          ) : item.fileUrl ? (
            <View style={styles.fileMessage}>
              <Ionicons name="document" size={20} color={isMyMessage ? "#fff" : "#1877f2"} />
              <Text style={[
                styles.fileText,
                isMyMessage ? styles.myMessageText : styles.theirMessageText
              ]}>
                {item.content}
              </Text>
            </View>
          ) : (
            <Text style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.theirMessageText
            ]}>
              {item.content}
            </Text>
          )}
          
          {/* Message Footer */}
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.theirMessageTime
            ]}>
              {new Date(item.createdAt).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
            
            {/* Read Status for my messages */}
            {isMyMessage && (
              <View style={styles.readStatus}>
                <Ionicons 
                  name={item.isRead ? "checkmark-done" : "checkmark"} 
                  size={14} 
                  color={item.isRead ? "#4CAF50" : "#999"} 
                />
              </View>
            )}
          </View>

          {/* Accept/Reject buttons for message requests */}
          {item.isRequest && !isMyMessage && (
            <View style={styles.requestButtons}>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAcceptRequest(item.requestId!)}
              >
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => handleRejectRequest(item.requestId!)}
              >
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1877f2" />
        </TouchableOpacity>
        
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            {userProfilePhoto ? (
              <Image source={{ uri: userProfilePhoto }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {userName && userName.length > 0 ? userName.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            )}
          </View>
                   <View style={styles.userDetails}>
           <Text style={styles.userName}>{userName}</Text>
           <Text style={styles.userStatus}>
             {isFollowing ? 'Following' : 'Not Following'}
             {!isConnected && ' • Offline'}
           </Text>
         </View>
        </View>
        
                 <TouchableOpacity 
           style={styles.moreButton}
           onPress={() => {
             console.log('🔄 Manual refresh triggered');
             fetchMessages(userId, true);
           }}
         >
           <Ionicons name="refresh" size={24} color="#1877f2" />
         </TouchableOpacity>
         
         <TouchableOpacity 
           style={styles.moreButton}
           onPress={() => {
             console.log('🔌 Manual WebSocket connect triggered');
             connect();
           }}
         >
           <Ionicons name="wifi" size={24} color={isConnected ? "#4CAF50" : "#f39c12"} />
         </TouchableOpacity>
      </View>


       {/* Messages */}
       <View style={styles.messagesContainer}>
        {loadingMessages ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1877f2" />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubble-outline" size={80} color="#bdc3c7" />
            </View>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>
              {isFollowing 
                ? 'Start a conversation with this user!' 
                : 'Send a message request to start chatting'
              }
            </Text>
            <TouchableOpacity style={styles.startConversationButton}>
              <LinearGradient
                colors={['#1877f2', '#42a5f5']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {isFollowing ? 'Send a message' : 'Send message request'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
                     <FlatList
             ref={flatListRef}
             data={messages}
             keyExtractor={(item) => item.id}
             renderItem={renderMessage}
             showsVerticalScrollIndicator={false}
             contentContainerStyle={styles.messagesList}
             style={styles.messagesFlatList}
             refreshControl={
               <RefreshControl
                 refreshing={refreshing}
                 onRefresh={onRefresh}
                 colors={['#1877f2']}
                 tintColor="#1877f2"
               />
             }
           />
        )}
      </View>

      {/* Message Input */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="add-circle-outline" size={24} color="#1877f2" />
          </TouchableOpacity>
          
          <View style={styles.textInputWrapper}>
            <TextInput
              style={styles.messageInput}
              placeholder={isFollowing ? "Message..." : "Message request..."}
              placeholderTextColor="#999"
              multiline
              value={newMessage}
              onChangeText={handleTypingChange}
              onKeyPress={handleKeyPress}
              editable={!sending}
              maxLength={1000}
            />
          </View>
          
          <TouchableOpacity
            style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
            onPress={() => {
              console.log('🔘 Send button pressed');
              console.log('🔍 Button state - newMessage:', newMessage.trim(), 'sending:', sending);
              console.log('🔍 Button disabled state:', !newMessage.trim() || sending);
              sendMessage();
            }}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
        

         {/* Typing Indicator */}
         {isTyping && (
           <View style={styles.typingIndicator}>
             <View style={styles.typingDots}>
               <View style={[styles.typingDot, { animationDelay: '0ms' }]} />
               <View style={[styles.typingDot, { animationDelay: '100ms' }]} />
               <View style={[styles.typingDot, { animationDelay: '200ms' }]} />
             </View>
             <Text style={styles.typingText}>{userName} is typing...</Text>
           </View>
         )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#1877f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  userStatus: {
    fontSize: 14,
    color: '#65676b',
  },
  moreButton: {
    padding: 8,
    marginLeft: 12,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 40,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  startConversationButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
     messagesList: {
     paddingVertical: 16,
     paddingBottom: 20, // Extra padding at bottom of messages
   },
  messagesFlatList: {
    flex: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  theirMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    position: 'relative',
  },
  myMessageBubble: {
    backgroundColor: '#1877f2',
    borderBottomRightRadius: 6,
  },
  theirMessageBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
  myMessageText: {
    color: '#fff',
  },
  theirMessageText: {
    color: '#1a1a1a',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.8)',
  },
  theirMessageTime: {
    color: '#999',
  },
  readStatus: {
    marginLeft: 8,
  },
     inputContainer: {
     backgroundColor: '#fff',
     borderTopWidth: 1,
     borderTopColor: '#f0f0f0',
     paddingBottom: Platform.OS === 'ios' ? 80 : 120, // Much more padding to move input higher
     marginBottom: 50, // Additional margin to move input higher
   },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  attachButton: {
    padding: 8,
    marginRight: 12,
  },
  textInputWrapper: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    minHeight: 40,
    maxHeight: 120,
  },
  messageInput: {
    fontSize: 16,
    color: '#1a1a1a',
    padding: 0,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#1877f2',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  messageRequestIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
     messageRequestText: {
     fontSize: 14,
     color: '#f39c12',
     marginLeft: 8,
   },
   messageImage: {
     width: 200,
     height: 150,
     borderRadius: 12,
     marginBottom: 8,
   },
   fileMessage: {
     flexDirection: 'row',
     alignItems: 'center',
     marginBottom: 8,
   },
   fileText: {
     fontSize: 16,
     lineHeight: 22,
     marginLeft: 8,
   },
   requestButtons: {
     flexDirection: 'row',
     marginTop: 12,
     gap: 8,
   },
   acceptButton: {
     backgroundColor: '#4CAF50',
     paddingHorizontal: 16,
     paddingVertical: 8,
     borderRadius: 16,
   },
   acceptButtonText: {
     color: '#fff',
     fontSize: 14,
     fontWeight: '600',
   },
   rejectButton: {
     backgroundColor: '#f44336',
     paddingHorizontal: 16,
     paddingVertical: 8,
     borderRadius: 16,
   },
   rejectButtonText: {
     color: '#fff',
     fontSize: 14,
     fontWeight: '600',
   },
   typingIndicator: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 16,
     paddingTop: 8,
     paddingBottom: 4,
   },
   typingDots: {
     flexDirection: 'row',
     marginRight: 8,
   },
   typingDot: {
     width: 8,
     height: 8,
     borderRadius: 4,
     backgroundColor: '#999',
     marginRight: 4,
   },
   typingText: {
     fontSize: 14,
     color: '#666',
   },
   websocketStatus: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     backgroundColor: '#fff3cd',
     paddingVertical: 8,
     paddingHorizontal: 16,
     borderBottomWidth: 1,
     borderBottomColor: '#ffeaa7',
   },
   websocketStatusText: {
     fontSize: 12,
     color: '#856404',
     marginLeft: 8,
   },
 });

export default ChatScreen;
