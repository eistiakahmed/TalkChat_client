import { useAuthStore } from '../stores/auth.store';
import type { ApiResponse } from '../types/auth.types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

/**
 * Standardized Application API Error.
 * 
 * Extracts status code, backend error codes, and field validation errors.
 */
export class ApiError extends Error {
  statusCode: number;
  errorCode?: string;
  details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    errorCode?: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

// Queue mechanism for handling token refresh concurrency
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

/**
 * Internal fetch wrapper supporting Bearer authorization and token rotation.
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const normalizedEndpoint = endpoint.startsWith('/')
    ? endpoint
    : `/${endpoint}`;
  const url = `${API_BASE_URL}${normalizedEndpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Inject active Access Token
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  try {
    let response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - Attempt Silent Refresh Token Rotation
    if (response.status === 401 && !endpoint.includes('/auth/refresh-token') && !endpoint.includes('/auth/login')) {
      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        useAuthStore.getState().logout();
        throw new ApiError('Session expired. Please log in again.', 401, 'auth.unauthorized');
      }

      if (isRefreshing) {
        // Wait in queue while token is being refreshed
        await new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });

        // Retry original request with newly refreshed access token
        const newAccessToken = useAuthStore.getState().accessToken;
        headers.set('Authorization', `Bearer ${newAccessToken}`);
        response = await fetch(url, { ...options, headers });
      } else {
        isRefreshing = true;

        try {
          // Strictly conform to Zero URL Params: pass refreshToken in request body
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          const refreshData: ApiResponse<{ tokens: { accessToken: string; refreshToken: string } }> =
            await refreshRes.json();

          if (!refreshRes.ok || !refreshData.success || !refreshData.data?.tokens) {
            throw new Error(refreshData.message || 'Token refresh failed');
          }

          const { tokens } = refreshData.data;
          useAuthStore.getState().setTokens(tokens);

          // Retry the failed request with new access token
          headers.set('Authorization', `Bearer ${tokens.accessToken}`);
          processQueue(null);

          response = await fetch(url, { ...options, headers });
        } catch (refreshErr) {
          processQueue(
            refreshErr instanceof Error
              ? refreshErr
              : new Error('Failed to refresh authentication session')
          );
          useAuthStore.getState().logout();
          throw new ApiError(
            'Your session has expired. Please sign in again.',
            401,
            'auth.session_expired'
          );
        } finally {
          isRefreshing = false;
        }
      }
    }

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        json?.message ||
        json?.error?.message ||
        `Request failed with status ${response.status}`;
      const errorCode = json?.error?.code || json?.errorCode;
      const details = json?.error?.details || json?.errors;
      throw new ApiError(message, response.status, errorCode, details);
    }

    return json as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error occurred',
      0,
      'network_error'
    );
  }
}

/**
 * Enterprise TalkChat HTTP API Client.
 * 
 * Implements:
 * 1. Zero URL Parameters: All query filters and command payloads transmit strictly via HTTP body.
 * 2. Automatic JWT refresh token rotation with failed request queue replay.
 * 3. Typed API error normalization.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 */
export const apiClient = {
  /**
   * Perform HTTP POST request passing parameters exclusively via JSON body.
   */
  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : JSON.stringify({}),
    });
  },

  /**
   * Perform HTTP GET request (for static or header-authenticated endpoints).
   */
  get<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, {
      method: 'GET',
    });
  },

  /**
   * Perform HTTP PUT request with body payload.
   */
  put<T>(endpoint: string, data?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: 'PUT',
      body: data !== undefined ? JSON.stringify(data) : JSON.stringify({}),
    });
  },

  /**
   * Perform HTTP PATCH request with body payload.
   */
  patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: 'PATCH',
      body: data !== undefined ? JSON.stringify(data) : JSON.stringify({}),
    });
  },

  /**
   * Perform HTTP DELETE request passing target identifiers strictly in JSON body.
   */
  delete<T>(endpoint: string, data?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: 'DELETE',
      body: data !== undefined ? JSON.stringify(data) : JSON.stringify({}),
    });
  },
};
