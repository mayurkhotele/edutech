import { apiFetchAuth } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useWebSocket } from '@/context/WebSocketContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Keyboard,
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

const ChatScreen = ({ route }: ChatScreenProps) => {
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    fileName: string;
    fileType: 'IMAGE' | 'PDF' | 'EXCEL';
    uploadedUrl?: string;
  } | null>(null);
  const [showFileOptions, setShowFileOptions] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const textInputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper function to check if two dates are the same day
  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // Format message time to relative format (Today, Yesterday, etc.)
  const formatMessageTime = (dateString: string) => {
    const messageDate = new Date(dateString);
    const now = new Date();
    
    // Set to midnight for date comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());

    // Check if it's today
    if (messageDay.getTime() === today.getTime()) {
      return messageDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }
    
    // Check if it's yesterday
    if (messageDay.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    }
    
    // Check if it's within last 7 days
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    if (messageDay >= oneWeekAgo) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[messageDate.getDay()];
    }
    
    // If older than a week, show date
    return messageDate.toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Common emojis list
  const commonEmojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
    '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
    '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜',
    '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐',
    '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬',
    '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒',
    '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😶‍🌫️', '😵',
    '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟',
    '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦',
    '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖',
    '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡',
    '😠', '🤬', '👍', '👎', '👏', '🙏', '💪', '❤️',
    '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎',
    '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘',
    '💝', '✨', '⭐', '🌟', '💫', '🔥', '💯', '✅',
  ];

  // Insert emoji into text
  const insertEmoji = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textInputRef.current?.focus();
  };

  // Handle document selection
  const handleDocumentSelect = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        const fileType = file.mimeType?.includes('pdf') ? 'PDF' : 'EXCEL';
        
        setSelectedFile({
          uri: file.uri,
          fileName: file.name || `file.${fileType.toLowerCase()}`,
          fileType: fileType
        });

        setIsUploading(true);
        await handleFileUpload(file);
      }
    } catch (error) {
      console.error('Error selecting document:', error);
      Alert.alert('Error', 'Failed to select document. Please try again.');
    } finally {
      setShowFileOptions(false);
    }
  };

  // Handle image selection
  const handleImageSelect = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets[0]) {
        const fileUri = result.assets[0].uri;
        const fileName = fileUri.split('/').pop() || 'image.jpg';
        
        setSelectedFile({
          uri: fileUri,
          fileName: fileName,
          fileType: 'IMAGE'
        });

        setIsUploading(true);
        await handleFileUpload({
          uri: fileUri,
          name: fileName,
          type: 'image/jpeg'
        });
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setShowFileOptions(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (file: { uri: string; type?: string | null; name?: string }) => {
    try {
      const formData = new FormData();
      const fileToUpload = {
        uri: file.uri,
        type: file.type || 'application/octet-stream',
        name: file.name || file.uri.split('/').pop() || 'file'
      } as any;
      formData.append('file', fileToUpload);

      if (!currentUser?.token) {
        throw new Error('No authentication token');
      }

      const uploadResponse = await fetch('http://192.168.1.6:3000/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${currentUser.token}`,
        },
      });

      const uploadData = await uploadResponse.json();

      if (uploadData.url) {
        setSelectedFile(prev => prev ? {
          ...prev,
          uploadedUrl: uploadData.url
        } : null);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setSelectedFile(null);
      
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        Alert.alert(
          'Network Error',
          'Failed to connect to server. Please check your internet connection and try again.'
        );
      } else {
        Alert.alert(
          'Upload Failed',
          'Failed to upload file. Please try again later.'
        );
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Handle sending message with file
  const sendFileMessage = async () => {
    if (!selectedFile?.uploadedUrl || !currentUser?.token) return;

    try {
      const messagePayload = {
        receiverId: userId,
        content: selectedFile.fileName,
        messageType: selectedFile.fileType,
        fileUrl: selectedFile.uploadedUrl,
      };

      const response = await apiFetchAuth('/student/messages', currentUser.token, {
        method: 'POST',
        body: messagePayload,
      });

      if (response.data) {
        const result = response.data;
        if (result.type === 'direct' && result.message) {
          setMessages(prev => [...prev, result.message]);
        }
      }

      setSelectedFile(null);
    } catch (error) {
      console.error('Error sending file message:', error);
      Alert.alert('Error', 'Failed to send file. Please try again.');
    }
  };

  // Handle keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      if (messages.length > 0) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    return () => {
      keyboardDidShowListener.remove();
    };
  }, [messages]);

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

    // Render date separator
    const renderDateSeparator = (date: string) => (
      <View style={styles.dateSeparator}>
        <View style={styles.dateSeparatorLine} />
        <Text style={styles.dateSeparatorText}>{formatMessageTime(date)}</Text>
        <View style={styles.dateSeparatorLine} />
      </View>
    );

    const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = item.sender.id === currentUser?.id;
    
    // Check if we need to show date separator
    const showDateSeparator = index === 0 || (
      index > 0 && !isSameDay(new Date(messages[index - 1].createdAt), new Date(item.createdAt))
    );
    
    return (
      <>
        {showDateSeparator && renderDateSeparator(item.createdAt)}
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
        
        <View style={{ flex: 1 }}>
          {/* Message Bubble */}
          <LinearGradient
            colors={isMyMessage ? ['#4F46E5', '#7C3AED'] : ['#f8f9fa', '#e9ecef']}
            style={[
              styles.enhancedMessageBubble,
              isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble
            ]}
          >
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
          </LinearGradient>

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
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Enhanced Professional Header */}
      <LinearGradient
        colors={['#4F46E5', '#7C3AED']}
        style={styles.enhancedHeader}
      >
        <View style={styles.headerContent}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
            <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
            {userProfilePhoto ? (
                <Image 
                  source={{ uri: userProfilePhoto }} 
                  style={styles.enhancedAvatar}
                />
            ) : (
                <View style={styles.enhancedAvatarPlaceholder}>
                  <Text style={styles.enhancedAvatarInitials}>
                  {userName && userName.length > 0 ? userName.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            )}
              {isConnected && <View style={styles.onlineIndicator} />}
          </View>
            
                   <View style={styles.userDetails}>
              <Text style={styles.enhancedUserName}>{userName}</Text>
              <Text style={styles.enhancedUserStatus}>
                {isConnected ? 'Online' : 'Offline'}
           </Text>
         </View>
        </View>
        
          <View style={styles.headerActions}>
                 <TouchableOpacity 
              style={styles.headerAction}
           onPress={() => {
             fetchMessages(userId, true);
           }}
         >
              <Ionicons name="refresh" size={22} color="#fff" />
         </TouchableOpacity>
      </View>
        </View>
      </LinearGradient>


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
             onLayout={() => {
               if (messages.length > 0) {
                 flatListRef.current?.scrollToEnd({ animated: false });
               }
             }}
             onContentSizeChange={() => {
               if (messages.length > 0) {
                 flatListRef.current?.scrollToEnd({ animated: true });
               }
             }}
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 160 : 150}
        style={[
          styles.inputContainer,
          Platform.OS === 'android' && { paddingBottom: 150, marginBottom: 150 }
        ]}
      >
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <View style={styles.emojiPickerContainer}>
            <View style={styles.emojiPickerHeader}>
              <Text style={styles.emojiPickerTitle}>Choose an emoji</Text>
              <TouchableOpacity onPress={() => setShowEmojiPicker(false)}>
                <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
            </View>
            <FlatList
              data={commonEmojis}
              keyExtractor={(item, index) => `emoji-${index}`}
              numColumns={8}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.emojiButton}
                  onPress={() => insertEmoji(item)}
                >
                  <Text style={styles.emojiText}>{item}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.emojiGrid}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        <View style={styles.enhancedInputWrapper}>
          <View style={styles.enhancedInputRow}>
            {/* Emoji Button */}
            <TouchableOpacity
              style={styles.emojiPickerButton}
              onPress={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Text style={styles.emojiPickerButtonText}>😊</Text>
            </TouchableOpacity>
            
            <View style={styles.enhancedTextInputWrapper}>
              <TextInput
                ref={textInputRef}
                style={styles.enhancedMessageInput}
                placeholder="Send message..."
                placeholderTextColor="#999"
                multiline
                value={newMessage}
                onChangeText={handleTypingChange}
                onKeyPress={handleKeyPress}
                editable={!sending}
                maxLength={1000}
              />
            </View>

            {/* Attach Button */}
            <TouchableOpacity 
              style={styles.enhancedAttachButton}
              onPress={() => setShowFileOptions(true)}
              disabled={isUploading}
            >
              <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
                style={styles.attachButtonGradient}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="attach" size={24} color="#fff" />
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Send Button */}
            <TouchableOpacity
              style={[
                styles.enhancedSendButton, 
                (!newMessage.trim() && !selectedFile?.uploadedUrl || sending) && styles.enhancedSendButtonDisabled
              ]}
              onPress={() => {
                if (selectedFile?.uploadedUrl) {
                  sendFileMessage();
                } else if (newMessage.trim()) {
                  sendMessage();
                }
              }}
              disabled={!newMessage.trim() && !selectedFile?.uploadedUrl || sending}
            >
              <LinearGradient
                colors={(!newMessage.trim() && !selectedFile?.uploadedUrl || sending) ? ['#ccc', '#999'] : ['#4F46E5', '#7C3AED']}
                style={styles.sendButtonGradient}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={20} color="#fff" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* File Options Modal */}
          {showFileOptions && (
            <View style={styles.fileOptionsContainer}>
              <TouchableOpacity 
                style={styles.fileOption}
                onPress={handleImageSelect}
              >
                <Ionicons name="image-outline" size={24} color="#4F46E5" />
                <Text style={styles.fileOptionText}>Image</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.fileOption}
                onPress={handleDocumentSelect}
              >
                <Ionicons name="document-outline" size={24} color="#4F46E5" />
                <Text style={styles.fileOptionText}>PDF/Excel</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* File Preview */}
          {selectedFile && (
            <View style={styles.filePreviewContainer}>
              {selectedFile.fileType === 'IMAGE' ? (
                <Image 
                  source={{ uri: selectedFile.uri }} 
                  style={styles.filePreview} 
                />
              ) : (
                <View style={styles.documentPreview}>
                  <Ionicons 
                    name={selectedFile.fileType === 'PDF' ? 'document-text' : 'document'} 
                    size={24} 
                    color="#4F46E5" 
                  />
                </View>
              )}
              <TouchableOpacity 
                style={styles.removeFileButton}
                onPress={() => setSelectedFile(null)}
              >
                <Ionicons name="close-circle" size={24} color="#FF4444" />
              </TouchableOpacity>
            </View>
          )}
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
  enhancedHeader: {
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAction: {
    padding: 8,
    marginLeft: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  enhancedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  enhancedAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  enhancedAvatarInitials: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  enhancedUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  enhancedUserStatus: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
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
    paddingBottom: Platform.OS === 'android' ? 180 : 120, // Much more padding for input box and navigation bar
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
  enhancedMessageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginTop: 1,
  },
  myMessageBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
    marginLeft: 50, // Give some space on left for my messages
  },
  theirMessageBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    marginRight: 50, // Give some space on right for their messages
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
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
    position: 'absolute',
    right: 4,
    bottom: 4,
  },
     inputContainer: {
    position: 'relative',
     backgroundColor: '#fff',
     borderTopWidth: 1,
     borderTopColor: '#f0f0f0',
    paddingBottom: Platform.OS === 'ios' ? 60 : 50,
    marginBottom: Platform.OS === 'ios' ? 60 : 90,
    zIndex: 1,
  },
  enhancedInputWrapper: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 25,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  enhancedInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  enhancedAttachButton: {
    marginRight: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  attachButtonGradient: {
    padding: 8,
    borderRadius: 20,
  },
  enhancedTextInputWrapper: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  enhancedMessageInput: {
    fontSize: 16,
    color: '#333',
    maxHeight: 100,
    textAlignVertical: 'center',
  },
  enhancedSendButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  enhancedSendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    padding: 10,
    borderRadius: 20,
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
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dateSeparatorText: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 12,
    fontWeight: '600',
  },
    emojiPickerContainer: {
      backgroundColor: '#fff',
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 20,
      maxHeight: 300,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
      borderWidth: 1,
      borderColor: '#e0e0e0',
    },
    emojiPickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    emojiPickerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
    },
    emojiGrid: {
      padding: 8,
    },
    emojiButton: {
      width: '12.5%',
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 4,
    },
    emojiText: {
      fontSize: 28,
    },
    emojiPickerButton: {
      padding: 8,
      marginLeft: 4,
      marginRight: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emojiPickerButtonText: {
      fontSize: 26,
    },
    fileOptionsContainer: {
      position: 'absolute',
      bottom: '100%',
      right: 48,
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 8,
      marginBottom: 8,
      flexDirection: 'row',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
      borderWidth: 1,
      borderColor: '#e0e0e0',
    },
    fileOption: {
      flexDirection: 'column',
      alignItems: 'center',
      padding: 12,
      marginHorizontal: 4,
    },
    fileOptionText: {
      fontSize: 12,
      color: '#4F46E5',
      marginTop: 4,
    },
    filePreviewContainer: {
      position: 'absolute',
      bottom: '100%',
      right: 48,
      marginBottom: 8,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#e0e0e0',
    },
    filePreview: {
      width: 40,
      height: 40,
      borderRadius: 12,
    },
    documentPreview: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: '#f3f4f6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    removeFileButton: {
      position: 'absolute',
      top: -8,
      right: -8,
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 0,
    },
 });

export default ChatScreen;
