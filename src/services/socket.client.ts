import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/auth.store';
import { useSocketStore } from '../stores/socket.store';

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
  'http://localhost:5000';

class SocketClient {
  private socket: Socket | null = null;
  private currentConversationId: string | null = null;
  private currentToken: string | null = null;

  /**
   * Connect or retrieve existing Socket.io connection.
   */
  connect(): Socket {
    const accessToken = useAuthStore.getState().accessToken;

    if (this.socket) {
      // If token changed, reset connection with new token
      if (accessToken && this.currentToken && this.currentToken !== accessToken) {
        this.socket.disconnect();
        this.socket = null;
        this.currentToken = null;
      } else {
        return this.socket;
      }
    }

    if (!accessToken) {
      return (this.socket as any) || null;
    }

    this.currentToken = accessToken;

    this.socket = io(SOCKET_URL, {
      auth: {
        token: accessToken,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    // Handle lifecycle events
    this.socket.on('connect', () => {
      useSocketStore.getState().setConnected(true);
      if (this.currentConversationId) {
        this.socket?.emit('conversation:join', { conversationId: this.currentConversationId });
      }
    });

    this.socket.on('disconnect', (reason) => {
      useSocketStore.getState().setConnected(false);
      if (reason === 'io server disconnect') {
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.warn('[SocketClient] Connection error:', error.message);
      useSocketStore.getState().setConnected(false);
    });

    return this.socket;
  }

  /**
   * Disconnect active socket session.
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentConversationId = null;
      this.currentToken = null;
      useSocketStore.getState().setConnected(false);
    }
  }

  /**
   * Retrieve active socket instance.
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Join a conversation real-time room.
   */
  joinConversation(conversationId: string) {
    const socket = this.connect();

    if (this.currentConversationId && this.currentConversationId !== conversationId) {
      this.leaveConversation(this.currentConversationId);
    }

    this.currentConversationId = conversationId;
    socket.emit('conversation:join', { conversationId });
  }

  /**
   * Leave a conversation real-time room.
   */
  leaveConversation(conversationId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('conversation:leave', { conversationId });
    }
    if (this.currentConversationId === conversationId) {
      this.currentConversationId = null;
    }
  }

  /**
   * Broadcast start typing indicator.
   */
  startTyping(conversationId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('typing:start', { conversationId });
    }
  }

  /**
   * Broadcast stop typing indicator.
   */
  stopTyping(conversationId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('typing:stop', { conversationId });
    }
  }
}

export const socketClient = new SocketClient();
