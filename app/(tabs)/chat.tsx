import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
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

const { width, height } = Dimensions.get('window');

export default function ChatScreen() {
  const { user } = useAuth();
  const route = useRoute();
  const { userId, userName, messages: initialMessages } = route.params as { 
    userId: string; 
    userName: string; 
    messages: any[] 
  };
  
  const [messages, setMessages] = useState(initialMessages || []);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingAnimation = useRef(new Animated.Value(0)).current;
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const inputAnimation = useRef(new Animated.Value(0)).current;

  // Header entrance animation
  useEffect(() => {
    Animated.timing(headerAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Input focus animation
  const animateInput = (focused: boolean) => {
    Animated.timing(inputAnimation, {
      toValue: focused ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Typing animation
  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(typingAnimation, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      typingAnimation.setValue(0);
    }
  }, [isTyping]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    
    setSending(true);
    try {
      const res = await apiFetchAuth('/student/messages', user?.token || '', {
        method: 'POST',
        body: {
          recipientId: userId,
          content: newMessage.trim()
        }
      });
      
      if (res.ok) {
        // Add the new message to the list
        const newMsg = {
          id: Date.now().toString(),
          content: newMessage.trim(),
          senderId: user?.id,
          recipientId: userId,
          createdAt: new Date().toISOString(),
          sender: {
            id: user?.id,
            name: user?.name
          }
        };
        
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
        
        // Scroll to bottom with animation
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

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

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isMyMessage = item.senderId === user?.id;
    const showAvatar = !isMyMessage;
    const showTime = index === messages.length - 1 || 
      new Date(messages[index + 1]?.createdAt).getTime() - new Date(item.createdAt).getTime() > 300000;

    return (
      <Animated.View 
        style={[
          styles.messageContainer, 
          isMyMessage ? styles.myMessage : styles.theirMessage,
          {
            opacity: headerAnimation,
            transform: [{
              translateY: headerAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              })
            }]
          }
        ]}
      >
        {showAvatar && (
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.avatarGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarText}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          </View>
        )}
        
        <View style={styles.messageContent}>
          <LinearGradient
            colors={isMyMessage ? ['#667eea', '#764ba2'] : ['#fff', '#f8f9fa']}
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
      </Animated.View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    
    return (
      <Animated.View 
        style={[
          styles.typingContainer,
          {
            opacity: typingAnimation,
            transform: [{
              scale: typingAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              })
            }]
          }
        ]}
      >
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.avatarGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.avatarText}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
        </View>
        
        <View style={styles.typingBubble}>
          <Animated.View style={[styles.typingDot, { opacity: typingAnimation }]} />
          <Animated.View style={[styles.typingDot, { opacity: typingAnimation }]} />
          <Animated.View style={[styles.typingDot, { opacity: typingAnimation }]} />
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      {/* Premium Header */}
      <Animated.View
        style={[
          styles.headerContainer,
          {
            opacity: headerAnimation,
            transform: [{
              translateY: headerAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              })
            }]
          }
        ]}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
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
                  <View style={styles.onlineIndicator} />
                  <Text style={styles.statusText}>Online</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerButton}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                  style={styles.headerButtonGradient}
                >
                  <Ionicons name="call-outline" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.headerButton}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                  style={styles.headerButtonGradient}
                >
                  <Ionicons name="videocam-outline" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.headerButton}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                  style={styles.headerButtonGradient}
                >
                  <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Messages with Background Pattern */}
      <View style={styles.messagesContainer}>
        <LinearGradient
          colors={['rgba(102, 126, 234, 0.05)', 'rgba(118, 75, 162, 0.02)']}
          style={styles.messagesBackground}
        />
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          inverted={false}
          ListFooterComponent={renderTypingIndicator}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      </View>

      {/* Premium Input Area */}
      <Animated.View
        style={[
          styles.inputContainer,
          {
            transform: [{
              translateY: inputAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -10],
              })
            }]
          }
        ]}
      >
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
                onChangeText={setNewMessage}
                multiline
                maxLength={500}
                onFocus={() => {
                  setIsTyping(true);
                  animateInput(true);
                }}
                onBlur={() => {
                  setIsTyping(false);
                  animateInput(false);
                }}
              />
            </View>
            
            <TouchableOpacity
              style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <LinearGradient
                  colors={['#ccc', '#ccc']}
                  style={styles.sendButtonGradient}
                >
                  <Ionicons name="hourglass-outline" size={18} color="#fff" />
                </LinearGradient>
              ) : (
                <LinearGradient
                  colors={newMessage.trim() ? ['#667eea', '#764ba2', '#f093fb'] : ['#ccc', '#ccc']}
                  style={styles.sendButtonGradient}
                >
                  <Ionicons 
                    name="send" 
                    size={18} 
                    color="#fff" 
                  />
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    zIndex: 1000,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  headerAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginRight: 6,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 2,
  },
  statusText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 8,
  },
  headerButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  messagesContainer: {
    flex: 1,
    position: 'relative',
  },
  messagesBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 20,
    flexDirection: 'row',
  },
  myMessage: {
    justifyContent: 'flex-end',
  },
  theirMessage: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    marginTop: 4,
  },
  avatarGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  messageContent: {
    maxWidth: '75%',
  },
  messageBubble: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  myBubble: {
    borderBottomRightRadius: 8,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  theirBubble: {
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
  },
  myMessageText: {
    color: '#fff',
  },
  theirMessageText: {
    color: '#333',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  messageTime: {
    fontSize: 12,
    opacity: 0.8,
    fontWeight: '500',
  },
  myMessageTime: {
    color: '#667eea',
    textAlign: 'right',
  },
  theirMessageTime: {
    color: '#999',
    textAlign: 'left',
  },
  readIndicator: {
    marginLeft: 4,
  },
  typingContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  typingBubble: {
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 24,
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#667eea',
    marginHorizontal: 2,
  },
  inputContainer: {
    backgroundColor: 'transparent',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  inputWrapper: {
    margin: 16,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  attachButton: {
    marginRight: 12,
  },
  attachButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: 'rgba(248, 249, 250, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  textInput: {
    fontSize: 16,
    color: '#333',
    maxHeight: 100,
    paddingVertical: 4,
    lineHeight: 20,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
}); 