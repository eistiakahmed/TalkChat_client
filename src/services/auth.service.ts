import { apiClient } from './api.client';
import type { ApiResponse, AuthResult, User } from '../types/auth.types';

export interface LoginPayload {
  login: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  username: string;
  email: string;
  password: string;
}

/**
 * Frontend Authentication API Service.
 * 
 * Orchestrates login, registration, active profile hydration,
 * and token invalidation using the body-only API client.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication
 */
export const authService = {
  /**
   * Authenticate user with identifier (email/username) and password.
   */
  async login(payload: LoginPayload): Promise<AuthResult> {
    const response = await apiClient.post<ApiResponse<AuthResult>>(
      '/auth/login',
      payload
    );

    if (!response.data) {
      throw new Error(response.message || 'Login failed');
    }

    return response.data;
  },

  /**
   * Register a new user account with credentials.
   */
  async register(payload: RegisterPayload): Promise<AuthResult> {
    const response = await apiClient.post<ApiResponse<AuthResult>>(
      '/auth/register',
      payload
    );

    if (!response.data) {
      throw new Error(response.message || 'Registration failed');
    }

    return response.data;
  },

  /**
   * Terminate active user session and revoke refresh tokens.
   */
  async logout(refreshToken?: string | null): Promise<void> {
    await apiClient.post<ApiResponse<void>>('/auth/logout', {
      refreshToken: refreshToken || undefined,
    });
  },

  /**
   * Fetch currently authenticated user profile.
   */
  async getMe(): Promise<User> {
    const response = await apiClient.get<ApiResponse<{ user: User }>>(
      '/auth/me'
    );

    if (!response.data?.user) {
      throw new Error('Failed to retrieve user profile');
    }

    return response.data.user;
  },
};
