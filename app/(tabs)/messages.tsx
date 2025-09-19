import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { apiFetchAuth } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';

interface User {
  id: string;
  name: string;
  profilePhoto: string | null;
  course?: string | null;
  year?: number | null;
}

interface Message {
  id: string;
  content: string;
  messageType: string;
  fileUrl: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileType?: string | null;
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

interface Conversation {
  user: User;
  latestMessage: Message | null;
  unreadCount: number;
}

export default function MessagesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageRequests, setMessageRequests] = useState<MessageRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('chats');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Socket connection state
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);

  // Step 1: Page Initialization - Like React website
  useEffect(() => {
    // 1. JWT token se current user ko decode karta hai
    const token = user?.token;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentUserData: User = {
          id: payload.userId,
          name: payload.name || 'User',
          profilePhoto: null,
          course: null,
          year: null
        };
        setCurrentUser(currentUserData);
        console.log('👤 Current user set from JWT:', currentUserData);
      } catch (error) {
        console.error('❌ Error decoding JWT token:', error);
      }
    }

    // 2. Initial conversations aur message requests fetch karta hai
    fetchConversations();
    fetchMessageRequests();
  }, [user?.token]);

  // Refresh conversations every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?.token) {
        console.log('📱 Messages screen focused - refreshing conversations...');
        fetchConversations();
        fetchMessageRequests();
      }
    }, [user?.token])
  );

  // Step 2: User Selection - Like React website
  useEffect(() => {
    if (selectedUser && currentUser) {
      // 1. Previous messages clear karta hai
      setMessages([]);
      
      // 2. Selected user ke messages fetch karta hai
      fetchMessages(selectedUser.id);
      
      // 3. Socket room join karta hai real-time messaging ke liye
      if (socket && isConnected) {
        const chatId = [currentUser.id, selectedUser.id].sort().join('-');
        console.log('🔗 Joining chat room:', chatId);
        socket.emit('join_chat', chatId);
        socket.emit('join_typing_room', chatId);
      }
    }
  }, [selectedUser, currentUser, socket, isConnected]);

  // Initialize socket connection - Similar to matchmaking screen
  useEffect(() => {
    console.log('🔌 Messages Socket connection useEffect triggered');
    console.log('🔑 User token available:', !!user?.token);
    console.log('👤 User object:', { id: user?.id, hasToken: !!user?.token });
    
    if (user?.token) {
      console.log('🚀 Initializing socket connection for messages...');
      const newSocket = io('http://192.168.1.3:3001', {
        auth: {
          token: user.token
        },
        transports: ['polling', 'websocket'],
        path: '/api/socket',
        timeout: 20000,
        forceNew: true
      });

      newSocket.on('connect', () => {
        console.log('✅ Messages Socket connected:', newSocket.id);
        console.log('🔗 Socket connection details:');
        console.log('   - Socket ID:', newSocket.id);
        console.log('   - Connected:', newSocket.connected);
        console.log('   - Transport:', newSocket.io.engine.transport.name);
        console.log('   - Auth token:', !!user?.token);
        console.log('   - User ID:', user?.id);
        setIsConnected(true);
        setSocketError(null);
        
        // Register user immediately after connection
        if (user?.id) {
          console.log('👤 Registering user for messages:', user.id);
          newSocket.emit('register_user', user.id);
        }
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Messages Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('🔥 Messages Socket connection error:', error);
        setSocketError('Connection failed. Please check your internet connection and try again.');
        setIsConnected(false);
      });

      newSocket.on('pong', () => {
        console.log('🏓 Received pong from server - messages socket connection is working');
      });

      setSocket(newSocket);

      return () => {
        console.log('🧹 Cleaning up messages socket connection...');
        newSocket.disconnect();
      };
    } else {
      console.log('❌ No user token available for messages socket connection');
      setSocketError('Authentication required. Please login again.');
    }
  }, [user?.token]);

  // Socket event listeners for real-time messaging
  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log('🎧 Setting up socket event listeners for messages...');

    const handleNewMessage = (newMessage: any) => {
      console.log('📨 Received new message via socket:', newMessage);
      
      // Add null checks to prevent the error
      if (!newMessage || !newMessage.sender || !newMessage.sender.id) {
        console.log('❌ Invalid message format received:', newMessage);
        return;
      }
      
      setMessages(prev => {
        const exists = prev.some(msg => msg.sender?.id === newMessage.sender.id);
        if (!exists) {
          return [...prev, newMessage];
        }
        return prev;
      });
    };

    const handleMessageRead = ({ readerId }: { readerId: string }) => {
      console.log('👁️ Messages read by:', readerId);
      if (selectedUser && selectedUser.id === readerId) {
        setMessages(prev =>
          prev.map(msg => 
            msg.sender.id === currentUser?.id ? { ...msg, isRead: true } : msg
          )
        );
      }
    };

    const handleTypingStart = (data: { userId: string; chatId: string }) => {
      console.log('⌨️ User started typing:', data);
      // Handle typing indicator
    };

    const handleTypingStop = (data: { userId: string; chatId: string }) => {
      console.log('⏹️ User stopped typing:', data);
      // Handle typing indicator
    };

    socket.on('new_message', handleNewMessage);
    socket.on('messages_were_read', handleMessageRead);

    // Test socket connection
    setTimeout(() => {
      console.log('🏓 Testing messages socket connection...');
      socket.emit('ping');
    }, 1000);

    return () => {
      console.log('🧹 Cleaning up messages socket event listeners...');
      socket.off('new_message', handleNewMessage);
      socket.off('messages_were_read', handleMessageRead);
    };
      }, [socket, isConnected, selectedUser, currentUser]);

  // Step 3: Messages Fetch - Like React website
  const fetchMessages = async (userId: string) => {
    try {
      console.log('📡 Fetching messages for user:', userId);
      
      const response = await apiFetchAuth(`/student/messages/${userId}`, user?.token || '');
      
      console.log('📡 Response status:', response.ok);
      
             if (response.ok) {
         // Handle both response.data and response.json() cases
         const data = response.data || response;
         console.log('📨 Fetched messages data:', data);
        
        if (data && Array.isArray(data)) {
          console.log('📨 Processing array of messages...');
          
          // Messages ko chronological order mai sort karta hai
          const sortedMessages: Message[] = [...data].sort((a: Message, b: Message) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          
          console.log('📨 Sorted messages count:', sortedMessages.length);
          setMessages(sortedMessages);
          
          if (data.length === 0) {
            console.log('📨 No messages found, checking for pending requests...');
            const pendingRequest = messageRequests.find(req => 
              req.sender.id === userId && req.status === 'PENDING'
            );
            if (pendingRequest) {
              console.log('📨 Found pending request:', pendingRequest);
              setMessages([{
                id: `request-${pendingRequest.id}`,
                content: pendingRequest.content,
                messageType: pendingRequest.messageType,
                fileUrl: pendingRequest.fileUrl,
                isRead: false,
                createdAt: pendingRequest.createdAt,
                sender: pendingRequest.sender,
                receiver: pendingRequest.receiver,
                isRequest: true,
                requestId: pendingRequest.id
              }]);
            } else {
              console.log('📨 No pending requests either, setting empty messages');
              setMessages([]);
            }
          }
        } else {
          console.log('❌ No messages data or not an array');
          setMessages([]);
        }
      } else {
        console.log('❌ Response not ok:', response.status);
        setMessages([]);
      }
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      setMessages([]);
    }
  };

  const fetchMessageRequests = async () => {
    try {
      console.log('📨 Fetching message requests...');
      const response = await apiFetchAuth('/student/message-requests', user?.token || '');
      if (response.ok) {
        // Handle both response.data and response.json() cases
        const data = response.data || response;
        console.log('📨 Message requests data:', data);
        setMessageRequests(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching message requests:', error);
      setMessageRequests([]);
    }
  };

  const fetchConversations = async () => {
    setLoading(true);
    try {
      console.log('📡 Fetching conversations...');
      const response = await apiFetchAuth('/student/messages', user?.token || '');
      console.log('📡 Conversations response:', response);
      
      if (response.ok) {
        // Handle both response.data and direct response cases
        const data = response.data || response;
        console.log('📡 Conversations data:', data);
        
        if (Array.isArray(data)) {
          console.log('📡 Setting conversations:', data.length, 'items');
          setConversations(data);
        } else {
          console.log('❌ Conversations data is not an array:', data);
          setConversations([]);
        }
      } else {
        console.log('❌ Conversations response not ok:', response.status);
        setConversations([]);
      }
    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
      // Sample data for testing UI
      setConversations([
        {
          user: {
            id: 'user1',
            name: 'Sarah Johnson',
            profilePhoto: null
          },
          latestMessage: {
            id: 'msg1',
            content: 'Hey, check out this photo I took yesterday!',
            messageType: 'IMAGE',
            fileUrl: null,
            fileName: null,
            fileSize: null,
            fileType: null,
            isRead: false,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            sender: {
              id: 'user1',
              name: 'Sarah Johnson',
              profilePhoto: null
            },
            receiver: {
              id: 'currentUser',
              name: 'Current User',
              profilePhoto: null
            }
          },
          unreadCount: 3
        },
        {
          user: {
            id: 'user2',
            name: 'Mike Chen',
            profilePhoto: null
          },
          latestMessage: {
            id: 'msg2',
            content: 'I\'ve sent you the project proposal',
            messageType: 'DOCUMENT',
            fileUrl: null,
            fileName: null,
            fileSize: null,
            fileType: null,
            isRead: true,
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            sender: {
              id: 'user2',
              name: 'Mike Chen',
              profilePhoto: null
            },
            receiver: {
              id: 'currentUser',
              name: 'Current User',
              profilePhoto: null
            }
          },
          unreadCount: 0
        },
        {
          user: {
            id: 'user3',
            name: 'Emma Wilson',
            profilePhoto: null
          },
          latestMessage: {
            id: 'msg3',
            content: 'Voice message (0:37)',
            messageType: 'VOICE',
            fileUrl: null,
            fileName: null,
            fileSize: null,
            fileType: null,
            isRead: false,
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            sender: {
              id: 'user3',
              name: 'Emma Wilson',
              profilePhoto: null
            },
            receiver: {
              id: 'currentUser',
              name: 'Current User',
              profilePhoto: null
            }
          },
          unreadCount: 1
        },
        {
          user: {
            id: 'group1',
            name: 'Design Team',
            profilePhoto: null
          },
          latestMessage: {
            id: 'msg4',
            content: 'Alex: Let\'s meet at 3 PM to discuss the new features',
            messageType: 'TEXT',
            fileUrl: null,
            fileName: null,
            fileSize: null,
            fileType: null,
            isRead: true,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            sender: {
              id: 'alex',
              name: 'Alex Thompson',
              profilePhoto: null
            },
            receiver: {
              id: 'currentUser',
              name: 'Current User',
              profilePhoto: null
            }
          },
          unreadCount: 0
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Messages screen pull-to-refresh triggered');
      await fetchConversations();
      await fetchMessageRequests();
    } catch (error) {
      console.error('Error refreshing messages:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 86400) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diff < 172800) {
      return 'Yesterday';
    } else if (diff < 604800) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getMessageIcon = (messageType: string) => {
    switch (messageType?.toUpperCase()) {
      case 'IMAGE':
        return <Ionicons name="image" size={16} color="#6B7280" />;
      case 'DOCUMENT':
        return <Ionicons name="document" size={16} color="#6B7280" />;
      case 'VOICE':
        return <Ionicons name="mic" size={16} color="#6B7280" />;
      case 'TEXT':
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return '#10B981';
      case 'away':
        return '#F59E0B';
      case 'offline':
      default:
        return '#9CA3AF';
    }
  };

  const filteredConversations = conversations.filter(conversation => {
    const userName = conversation.user.name || '';
    const lastMessage = conversation.latestMessage?.content || '';
    const searchLower = searchQuery.toLowerCase();
    
    return userName.toLowerCase().includes(searchLower) ||
           lastMessage.toLowerCase().includes(searchLower);
  });

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity 
      style={styles.messageItem} 
      activeOpacity={0.7}
             onPress={() => {
         console.log('🔍 Chat item clicked! Navigating to chat with user:', item.user.id);
         setSelectedUser(item.user);
         router.push({
           pathname: '/chat',
           params: {
             userId: item.user.id,
             userName: item.user.name
           }
         });
       }}
     >
       <View style={styles.avatarContainer}>
         {item.user.profilePhoto ? (
           <Image 
             source={{ uri: item.user.profilePhoto }} 
             style={styles.avatarImage} 
           />
         ) : (
          <LinearGradient
            colors={['#4F46E5', '#7C3AED']}
            style={styles.avatarPlaceholder}
          >
             <Text style={styles.avatarInitials}>
               {item.user.name ? item.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
             </Text>
           </LinearGradient>
         )}
         <View 
           style={[
             styles.statusIndicator, 
             { backgroundColor: '#10B981' } // Default to online for now
           ]} 
         />
       </View>

       <View style={styles.messageContent}>
         <View style={styles.messageHeader}>
           <Text style={styles.userName}>{item.user.name}</Text>
           <Text style={styles.timestamp}>
             {item.latestMessage ? formatTimestamp(item.latestMessage.createdAt) : ''}
           </Text>
         </View>
         
         <View style={styles.messagePreview}>
           {item.latestMessage && getMessageIcon(item.latestMessage.messageType)}
           <Text style={styles.lastMessage} numberOfLines={1}>
             {item.latestMessage?.content || 'No messages yet'}
           </Text>
         </View>
       </View>

       {item.unreadCount > 0 && (
         <View style={styles.unreadBadge}>
           <Text style={styles.unreadCount}>{item.unreadCount}</Text>
         </View>
       )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <LinearGradient
          colors={['#4F46E5', '#7C3AED']}
          style={styles.loadingCard}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#4F46E5', '#7C3AED', '#8B5CF6']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={styles.headerActions}>
            {/* Socket Status Indicator */}
            <TouchableOpacity 
              style={[styles.headerButton, { backgroundColor: isConnected ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)' }]}
              onPress={() => {
                if (socketError) {
                  Alert.alert('Connection Error', socketError);
                } else if (!isConnected) {
                  Alert.alert('Connection Status', 'Connecting to server...');
                } else {
                  Alert.alert('Connection Status', 'Connected to server');
                }
              }}
            >
              <Ionicons 
                name={isConnected ? "wifi" : "wifi-outline"} 
                size={20} 
                color={isConnected ? "#22c55e" : "#ef4444"} 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="notifications" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="settings" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search messages..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      </LinearGradient>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'chats' && styles.activeTab]}
          onPress={() => setActiveTab('chats')}
        >
          <Text style={[styles.tabText, activeTab === 'chats' && styles.activeTabText]}>
            Chats
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'groups' && styles.activeTab]}
          onPress={() => setActiveTab('groups')}
        >
          <Text style={[styles.tabText, activeTab === 'groups' && styles.activeTabText]}>
            Groups
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'calls' && styles.activeTab]}
          onPress={() => setActiveTab('calls')}
        >
          <Text style={[styles.tabText, activeTab === 'calls' && styles.activeTabText]}>
            Calls
          </Text>
        </TouchableOpacity>
      </View>


             {/* Conversations List */}
       <FlatList
         data={filteredConversations}
         keyExtractor={(item) => item.user.id}
         renderItem={renderConversation}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#4F46E5']}
            tintColor="#4F46E5"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={['#fff', '#f8f9fa']}
              style={styles.emptyCard}
            >
              <View style={styles.emptyIcon}>
                <Ionicons name="chatbubbles-outline" size={64} color="#4F46E5" />
              </View>
              <Text style={styles.emptyTitle}>No Messages</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'No messages found matching your search.' : 'Start a conversation with your friends!'}
              </Text>
                             <TouchableOpacity 
                 style={styles.refreshButton}
                 onPress={() => onRefresh()}
               >
                <LinearGradient
                  colors={['#4F46E5', '#7C3AED']}
                  style={styles.refreshButtonGradient}
                >
                  <Ionicons name="refresh" size={16} color="#fff" />
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchContainer: {
    marginTop: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 14,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    borderBottomWidth: 3,
    borderBottomColor: '#4F46E5',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.3,
  },
  activeTabText: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  listContainer: {
    paddingBottom: 24,
    paddingTop: 8,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 0.3,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    letterSpacing: 0.2,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  lastMessage: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 6,
    flex: 1,
    lineHeight: 20,
  },
  unreadBadge: {
    backgroundColor: '#4F46E5',
    borderRadius: 11,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingCard: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyCard: {
    padding: 48,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    backgroundColor: '#fff',
  },
  emptyIcon: {
    marginBottom: 20,
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
    letterSpacing: 0.2,
    maxWidth: 280,
  },
  refreshButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  refreshButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

