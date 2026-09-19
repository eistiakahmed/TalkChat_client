/**
 * TalkChat User and Authentication Domain Types.
 * 
 * Defines schemas for active user sessions, token rotation,
 * and API responses conforming to the backend response structure.
 * 
 * @see https://www.typescriptlang.org/docs/handbook/2/objects.html
 */

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  phoneNumber?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: string;
}

export interface AuthResult {
  user: User;
  tokens: AuthTokens;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message?: string;
  data?: T;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errorCode?: string;
  errors?: Array<{ field?: string; message: string }>;
}
