import { apiClient, ApiError } from './api.client';
import type { ApiResponse } from '../types/auth.types';
import type {
  Message,
  SendMessagePayload,
  GetMessageHistoryPayload,
  EditMessagePayload,
  DeleteMessagePayload,
  ReactMessagePayload,
  UpdateReceiptPayload,
} from '../types/message.types';
import { useAuthStore } from '../stores/auth.store';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

/**
 * Real-Time Messaging API Service.
 * 
 * Handles message transmission, history retrieval, editing,
 * deletion, reactions, and delivery receipts conforming to the
 * body-only parameter convention.
 * 
 * @see https://github.com/eistiakahmed/TalkChat_server
 */
export const messageService = {
  /**
   * Retrieve cursor-paginated message history for a conversation.
   */
  async getMessageHistory(
    payload: GetMessageHistoryPayload
  ): Promise<{ messages: Message[]; nextCursor?: string; hasMore: boolean }> {
    const response = await apiClient.post<
      ApiResponse<Message[]> & { meta?: { cursor?: string; hasMore?: boolean } }
    >('/messages/list', payload);

    const messages = Array.isArray(response.data) ? response.data : [];
    return {
      messages,
      nextCursor: response.meta?.cursor,
      hasMore: !!response.meta?.hasMore,
    };
  },

  /**
   * Send a new text message or file/media attachment.
   */
  async sendMessage(
    payload: SendMessagePayload,
    attachment?: File
  ): Promise<Message> {
    if (attachment) {
      // Multipart upload for file attachments
      const formData = new FormData();
      formData.append('conversationId', payload.conversationId);
      if (payload.content) formData.append('content', payload.content);
      if (payload.type) formData.append('type', payload.type);
      if (payload.parentMessageId) {
        formData.append('parentMessageId', payload.parentMessageId);
      }
      formData.append('attachment', attachment);

      const accessToken = useAuthStore.getState().accessToken;
      const headers: HeadersInit = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const res = await fetch(`${API_BASE_URL}/messages/send`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.data?.message) {
        throw new ApiError(
          json.message || 'Failed to upload attachment and send message',
          res.status
        );
      }
      return json.data.message;
    }

    // Pure JSON payload for standard text messages
    const response = await apiClient.post<ApiResponse<{ message: Message }>>(
      '/messages/send',
      payload
    );

    if (!response.data?.message) {
      throw new Error(response.message || 'Failed to send message');
    }

    return response.data.message;
  },

  /**
   * Edit a previously sent message.
   */
  async editMessage(payload: EditMessagePayload): Promise<Message> {
    const response = await apiClient.patch<ApiResponse<{ message: Message }>>(
      '/messages/edit',
      payload
    );

    if (!response.data?.message) {
      throw new Error(response.message || 'Failed to edit message');
    }

    return response.data.message;
  },

  /**
   * Delete a message (FOR_ME or FOR_EVERYONE).
   */
  async deleteMessage(payload: DeleteMessagePayload): Promise<void> {
    await apiClient.post<ApiResponse<void>>('/messages/delete', payload);
  },

  /**
   * Toggle emoji reaction on a message.
   */
  async toggleReaction(payload: ReactMessagePayload): Promise<void> {
    await apiClient.post<ApiResponse<void>>('/messages/react', payload);
  },

  /**
   * Bulk acknowledge message delivery or read status.
   */
  async updateReceipts(payload: UpdateReceiptPayload): Promise<void> {
    await apiClient.post<ApiResponse<void>>('/messages/receipt', payload);
  },
};
