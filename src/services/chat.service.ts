import { apiClient } from './api.client';
import type { ApiResponse } from '../types/auth.types';
import type {
  Conversation,
  ConversationsListResponse,
  CreateDirectChatPayload,
  CreateGroupChatPayload,
  UpdateDisappearingTimerPayload,
  ConversationType,
} from '../types/chat.types';

/**
 * Chat and Conversation API Service.
 * 
 * Interacts with TalkChat chat endpoints, strictly sending all identifiers
 * and parameters inside HTTP request bodies.
 * 
 * @see https://github.com/eistiakahmed/TalkChat_server
 */
export const chatService = {
  /**
   * Retrieve paginated conversations for authenticated user.
   */
  async getConversations(payload: {
    page?: number;
    limit?: number;
    type?: ConversationType;
  } = {}): Promise<Conversation[]> {
    const response = await apiClient.post<ApiResponse<Conversation[] | { items: Conversation[] }>>(
      '/chats/list',
      payload
    );

    if (!response.data) return [];

    if (Array.isArray(response.data)) {
      return response.data;
    }

    return (response.data as { items: Conversation[] }).items || [];
  },

  /**
   * Retrieve full conversation details and active member roster.
   */
  async getConversationDetails(conversationId: string): Promise<Conversation> {
    const response = await apiClient.post<ApiResponse<{ conversation: Conversation }>>(
      '/chats/details',
      { conversationId }
    );

    if (!response.data?.conversation) {
      throw new Error(response.message || 'Failed to fetch conversation details');
    }

    return response.data.conversation;
  },

  /**
   * Start or retrieve existing 1-to-1 direct chat.
   */
  async createDirectChat(payload: CreateDirectChatPayload): Promise<Conversation> {
    const response = await apiClient.post<ApiResponse<{ conversation: Conversation }>>(
      '/chats/direct',
      payload
    );

    if (!response.data?.conversation) {
      throw new Error(response.message || 'Failed to create direct chat');
    }

    return response.data.conversation;
  },

  /**
   * Create new group conversation.
   */
  async createGroupChat(payload: CreateGroupChatPayload): Promise<Conversation> {
    const response = await apiClient.post<ApiResponse<{ conversation: Conversation }>>(
      '/chats/group',
      payload
    );

    if (!response.data?.conversation) {
      throw new Error(response.message || 'Failed to create group chat');
    }

    return response.data.conversation;
  },

  /**
   * Mark conversation as read to reset unread message counter.
   */
  async markAsRead(conversationId: string): Promise<void> {
    await apiClient.patch<ApiResponse<void>>('/chats/read', {
      conversationId,
    });
  },

  /**
   * Toggle mute notifications for a conversation.
   */
  async toggleMute(
    conversationId: string,
    isMuted: boolean,
    mutedUntil?: string | null
  ): Promise<void> {
    await apiClient.patch<ApiResponse<void>>('/chats/mute', {
      conversationId,
      isMuted,
      mutedUntil,
    });
  },

  /**
   * Update message auto-delete expiration lifespan in seconds (0 = disabled).
   */
  async updateDisappearingTimer(
    payload: UpdateDisappearingTimerPayload
  ): Promise<void> {
    await apiClient.post<ApiResponse<void>>(
      '/chats/disappearing',
      payload
    );
  },
};
