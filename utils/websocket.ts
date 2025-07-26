import { io, Socket } from 'socket.io-client';
import { WEBSOCKET_CONFIG } from '../constants/websocket';

interface Message {
  id: string;
  content: string;
  messageType: string;
  fileUrl?: string | null;
  isRead: boolean;
  createdAt: string;
  senderId: string;
  receiverId: string;
  sender: {
    id: string;
    name: string;
    profilePhoto?: string | null;
  };
  receiver: {
    id: string;
    name: string;
    profilePhoto?: string | null;
  };
}

interface WebSocketEvents {
  onMessageReceived?: (message: Message) => void;
  onMessageSent?: (message: Message) => void;
  onUserTyping?: (userId: string, isTyping: boolean) => void;
  onUserOnline?: (userId: string) => void;
  onUserOffline?: (userId: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private events: WebSocketEvents = {};
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(token: string, userId: string) {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    console.log('🔌 Attempting to connect to WebSocket server...');
    console.log('📍 Server URL:', WEBSOCKET_CONFIG.SERVER_URL);
    console.log('👤 User ID:', userId);
    console.log('🔑 Token available:', !!token);

    try {
      // For React Native, we need to handle connection differently
      this.socket = io(WEBSOCKET_CONFIG.SERVER_URL, {
        auth: {
          token: token,
          userId: userId
        },
        ...WEBSOCKET_CONFIG.CONNECTION_OPTIONS,
        // React Native specific settings
        transports: ['polling', 'websocket'], // Try polling first
        upgrade: true,
        rememberUpgrade: false,
        forceNew: true,
        // Add user agent for React Native
        extraHeaders: {
          ...WEBSOCKET_CONFIG.CONNECTION_OPTIONS.extraHeaders,
          'User-Agent': 'ReactNative-App'
        }
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('❌ WebSocket connection error:', error);
      this.events.onError?.(error);
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected successfully!');
      console.log('🆔 Socket ID:', this.socket?.id);
      console.log('🔗 Transport:', this.socket?.io?.engine?.transport?.name);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.events.onConnect?.();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.isConnected = false;
      this.events.onDisconnect?.();
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        description: (error as any).description,
        context: (error as any).context,
        type: (error as any).type
      });
      this.events.onError?.(error);
    });

    this.socket.on('error', (error) => {
      console.error('❌ WebSocket general error:', error);
      this.events.onError?.(error);
    });

    // Message events - matching your backend
    this.socket.on(WEBSOCKET_CONFIG.EVENTS.NEW_MESSAGE, (message: Message) => {
      console.log('📨 New message received:', message);
      this.events.onMessageReceived?.(message);
    });

    // Typing events
    this.socket.on(WEBSOCKET_CONFIG.EVENTS.USER_TYPING, (data: { userId: string; isTyping: boolean }) => {
      console.log('⌨️ User typing:', data);
      this.events.onUserTyping?.(data.userId, true);
    });

    this.socket.on(WEBSOCKET_CONFIG.EVENTS.USER_STOPPED_TYPING, (data: { userId: string; isTyping: boolean }) => {
      console.log('⌨️ User stopped typing:', data);
      this.events.onUserTyping?.(data.userId, false);
    });

    // Read receipt events
    this.socket.on(WEBSOCKET_CONFIG.EVENTS.MESSAGES_WERE_READ, (data: { readerId: string }) => {
      console.log('✅ Messages were read by:', data.readerId);
      // You can add a callback for this if needed
    });
  }

  // Register user with the WebSocket server
  registerUser(userId: string) {
    if (!this.socket?.connected) {
      console.error('WebSocket not connected');
      return;
    }

    this.socket.emit(WEBSOCKET_CONFIG.EVENTS.REGISTER_USER, userId);
    console.log('👤 User registered:', userId);
  }

  // Join a chat room with another user
  joinChat(chatId: string) {
    if (!this.socket?.connected) {
      console.error('WebSocket not connected');
      return;
    }

    this.socket.emit(WEBSOCKET_CONFIG.EVENTS.JOIN_CHAT, { chatId });
    console.log('Joined chat:', chatId);
  }

  // Send a private message
  sendMessage(message: {
    content: string;
    receiverId: string;
    messageType?: string;
    fileUrl?: string;
  }) {
    if (!this.socket?.connected) {
      console.error('WebSocket not connected');
      return false;
    }

    const messageData = {
      message: {
        content: message.content,
        receiver: { id: message.receiverId },
        messageType: message.messageType || 'text',
        fileUrl: message.fileUrl
      }
    };

    this.socket.emit(WEBSOCKET_CONFIG.EVENTS.PRIVATE_MESSAGE, messageData);
    console.log('📤 Private message sent via WebSocket:', messageData);
    return true;
  }

  // Send typing indicator
  sendTypingIndicator(chatId: string, isTyping: boolean) {
    if (!this.socket?.connected) return;

    if (isTyping) {
      this.socket.emit(WEBSOCKET_CONFIG.EVENTS.START_TYPING, { chatId });
    } else {
      this.socket.emit(WEBSOCKET_CONFIG.EVENTS.STOP_TYPING, { chatId });
    }
  }

  // Mark messages as read
  markMessageAsRead(readerId: string, otherUserId: string) {
    if (!this.socket?.connected) return;

    this.socket.emit(WEBSOCKET_CONFIG.EVENTS.NOTIFY_MESSAGES_READ, {
      readerId,
      otherUserId
    });
  }

  // Set event handlers
  on(event: keyof WebSocketEvents, handler: any) {
    this.events[event] = handler;
  }

  // Remove event handler
  off(event: keyof WebSocketEvents) {
    delete this.events[event];
  }

  // Get connection status
  isSocketConnected(): boolean {
    return this.isConnected;
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('WebSocket disconnected');
    }
  }

  // Get socket instance (for advanced usage)
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Create a singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;
export type { Message, WebSocketEvents };

