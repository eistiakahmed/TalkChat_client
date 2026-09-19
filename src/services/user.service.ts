import { apiClient } from './api.client';
import type { ApiResponse, User } from '../types/auth.types';
import type { ParticipantUser } from '../types/chat.types';

export interface SearchUsersResult {
  users: ParticipantUser[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ContactRecord {
  id: string;
  userId: string;
  contactId: string;
  status: 'PENDING' | 'ACCEPTED' | 'BLOCKED';
  contact: ParticipantUser;
  createdAt: string;
}

/**
 * User Directory and Contact API Service.
 * 
 * Provides methods for user searching, contact rosters, requests, and profile updates.
 */
export const userService = {
  /**
   * Search users by username, email, or full name.
   */
  async searchUsers(query: string, page = 1, limit = 20): Promise<ParticipantUser[]> {
    if (!query.trim()) return [];

    const encodedQuery = encodeURIComponent(query.trim());
    const response = await apiClient.get<ApiResponse<SearchUsersResult | ParticipantUser[]>>(
      `/users/search?q=${encodedQuery}&page=${page}&limit=${limit}`
    );

    if (!response.data) return [];

    if (Array.isArray(response.data)) {
      return response.data;
    }

    return (response.data as SearchUsersResult).users || [];
  },

  /**
   * Fetch authenticated user's accepted contacts.
   */
  async getContacts(): Promise<ParticipantUser[]> {
    const response = await apiClient.get<ApiResponse<{ contacts: Array<{ contact: ParticipantUser }> | ParticipantUser[] }>>(
      '/users/contacts'
    );

    if (!response.data) return [];

    if (Array.isArray(response.data)) {
      return response.data;
    }

    if (Array.isArray(response.data.contacts)) {
      return response.data.contacts.map((c: any) => c.contact || c);
    }

    return [];
  },

  /**
   * Send a contact request to another user.
   */
  async sendContactRequest(contactId: string): Promise<void> {
    await apiClient.post<ApiResponse<void>>(`/users/contacts/${contactId}`);
  },

  /**
   * Accept or block a received contact request.
   */
  async respondContactRequest(
    contactId: string,
    status: 'ACCEPTED' | 'BLOCKED'
  ): Promise<void> {
    await apiClient.patch<ApiResponse<void>>(`/users/contacts/${contactId}`, {
      status,
    });
  },

  /**
   * Update profile details (full name, bio, avatar).
   */
  async updateProfile(formData: FormData): Promise<User> {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    const { useAuthStore } = await import('../stores/auth.store');
    const accessToken = useAuthStore.getState().accessToken;

    const headers: HeadersInit = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const res = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PATCH',
      headers,
      body: formData,
    });

    const json = await res.json();
    if (!res.ok || !json.data?.user) {
      throw new Error(json.message || 'Failed to update profile');
    }

    return json.data.user;
  },

  /**
   * Block a user.
   */
  async blockUser(targetUserId: string): Promise<void> {
    await apiClient.post<ApiResponse<void>>(`/users/block/${targetUserId}`);
  },

  /**
   * Unblock a user.
   */
  async unblockUser(targetUserId: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/users/block/${targetUserId}`);
  },
};
