import { create } from 'zustand';

export interface TypingUser {
  userId: string;
  username: string;
}

export interface SocketState {
  isConnected: boolean;
  typingUsers: Record<string, TypingUser[]>;
  onlineUserIds: string[];

  // Actions
  setConnected: (connected: boolean) => void;
  addTypingUser: (conversationId: string, user: TypingUser) => void;
  removeTypingUser: (conversationId: string, userId: string) => void;
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;
  setOnlineUserIds: (userIds: string[]) => void;
}

/**
 * Real-Time Socket.io Presence and Typing State Store.
 * 
 * Manages WebSocket connectivity status, active typing presence per conversation,
 * and user online/offline roster.
 */
export const useSocketStore = create<SocketState>((set) => ({
  isConnected: false,
  typingUsers: {},
  onlineUserIds: [],

  setConnected: (connected) => {
    set({ isConnected: connected });
  },

  addTypingUser: (conversationId, user) => {
    set((state) => {
      const current = state.typingUsers[conversationId] || [];
      if (current.some((u) => u.userId === user.userId)) {
        return state;
      }
      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: [...current, user],
        },
      };
    });
  },

  removeTypingUser: (conversationId, userId) => {
    set((state) => {
      const current = state.typingUsers[conversationId];
      if (!current || !current.some((u) => u.userId === userId)) {
        return state;
      }
      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: current.filter((u) => u.userId !== userId),
        },
      };
    });
  },

  setUserOnline: (userId) => {
    set((state) => {
      if (state.onlineUserIds.includes(userId)) return state;
      return {
        onlineUserIds: [...state.onlineUserIds, userId],
      };
    });
  },

  setUserOffline: (userId) => {
    set((state) => {
      if (!state.onlineUserIds.includes(userId)) return state;
      return {
        onlineUserIds: state.onlineUserIds.filter((id) => id !== userId),
      };
    });
  },

  setOnlineUserIds: (userIds) => {
    set({ onlineUserIds: userIds });
  },
}));
