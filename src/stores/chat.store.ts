import { create } from 'zustand';
import type { Conversation } from '../types/chat.types';

export type ChatFilterTab = 'all' | 'direct' | 'groups' | 'unread';

export interface ChatStoreState {
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  filterTab: ChatFilterTab;
  searchQuery: string;
  isNewChatModalOpen: boolean;
  isMobileSidebarOpen: boolean;

  // Actions
  setActiveConversation: (conversation: Conversation | null) => void;
  setActiveConversationId: (id: string | null) => void;
  setFilterTab: (tab: ChatFilterTab) => void;
  setSearchQuery: (query: string) => void;
  setNewChatModalOpen: (open: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
}

/**
 * TalkChat Client Active Conversation & Navigation Store.
 * 
 * Manages the current conversation selection, filter tab states,
 * modal visibility, and mobile sidebar navigation.
 * 
 * @see https://docs.pmnd.rs/zustand/getting-started/introduction
 */
export const useChatStore = create<ChatStoreState>((set) => ({
  activeConversationId: null,
  activeConversation: null,
  filterTab: 'all',
  searchQuery: '',
  isNewChatModalOpen: false,
  isMobileSidebarOpen: true,

  setActiveConversation: (conversation) => {
    set({
      activeConversation: conversation,
      activeConversationId: conversation?.id || null,
      isMobileSidebarOpen: false, // Close sidebar on mobile when chat opens
    });
  },

  setActiveConversationId: (id) => {
    set({ activeConversationId: id });
  },

  setFilterTab: (tab) => {
    set({ filterTab: tab });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setNewChatModalOpen: (open) => {
    set({ isNewChatModalOpen: open });
  },

  setMobileSidebarOpen: (open) => {
    set({ isMobileSidebarOpen: open });
  },
}));
