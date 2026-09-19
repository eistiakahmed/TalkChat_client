import { apiClient } from './api.client';
import type { ApiResponse } from '../types/auth.types';

export interface SafetyNumberResponse {
  targetUserId: string;
  safetyNumber: string;
  displayFingerprint: string;
}

export interface KeyBundleUploadPayload {
  registrationId: number;
  identityKey: string;
  signedPreKeyId: number;
  signedPreKey: string;
  signedPreKeySignature: string;
  oneTimePreKeys: Array<{ keyId: number; publicKey: string }>;
  deviceId?: number;
}

export interface PreKeyBundleResponse {
  userId: string;
  deviceId: number;
  identityKey: string;
  signedPreKey: {
    keyId?: number;
    publicKey: string;
    signature: string;
  };
  oneTimePreKey?: {
    keyId: number;
    publicKey: string;
  } | null;
}

/**
 * End-to-End Encryption (E2EE) & Safety Numbers API Service.
 * 
 * Interacts with Signal Protocol X3DH key distribution and 60-digit
 * safety number fingerprint endpoints strictly using body-only payloads.
 * 
 * @see https://signal.org/docs/specifications/x3dh/
 */
export const e2eeService = {
  /**
   * Derive symmetrical 60-digit safety number fingerprint between two users.
   */
  async getSafetyNumber(targetUserId: string): Promise<SafetyNumberResponse> {
    const response = await apiClient.post<ApiResponse<SafetyNumberResponse>>(
      '/e2ee/safety-number',
      { targetUserId }
    );

    if (!response.data) {
      throw new Error(response.message || 'Failed to generate safety number');
    }

    return response.data;
  },

  /**
   * Upload user public key bundle to the distribution server.
   */
  async uploadKeyBundle(payload: KeyBundleUploadPayload): Promise<void> {
    await apiClient.post<ApiResponse<void>>('/e2ee/keys/upload', payload);
  },

  /**
   * Fetch recipient prekey bundle (consumes one OPK atomically).
   */
  async getPreKeyBundle(recipientId: string, deviceId = 1): Promise<PreKeyBundleResponse> {
    const response = await apiClient.post<ApiResponse<PreKeyBundleResponse>>(
      '/e2ee/keys/bundle',
      { recipientId, deviceId }
    );

    if (!response.data) {
      throw new Error(response.message || 'Failed to fetch recipient prekey bundle');
    }

    return response.data;
  },
};
