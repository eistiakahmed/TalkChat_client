import { apiClient } from './api.client';
import type { ApiResponse } from '../types/auth.types';
import type { CallLog, CallHistoryResponse } from '../types/call.types';

/**
 * WebRTC Call History and Log API Service.
 * 
 * Retrieves call history logs and details strictly using body-only payloads.
 * 
 * @see https://github.com/eistiakahmed/TalkChat_server
 */
export const callService = {
  /**
   * Retrieve paginated call history logs for the user.
   */
  async getCallHistory(payload: {
    limit?: number;
    cursor?: string;
    type?: 'AUDIO' | 'VIDEO';
    status?: string;
  } = {}): Promise<CallHistoryResponse> {
    const response = await apiClient.post<ApiResponse<CallHistoryResponse>>(
      '/calls/history',
      payload
    );

    return (
      response.data || {
        calls: [],
        nextCursor: null,
        hasMore: false,
      }
    );
  },

  /**
   * Retrieve single call log details.
   */
  async getCallDetails(callId: string): Promise<CallLog> {
    const response = await apiClient.post<ApiResponse<{ call: CallLog }>>(
      '/calls/details',
      { callId }
    );

    if (!response.data?.call) {
      throw new Error(response.message || 'Call log not found');
    }

    return response.data.call;
  },
};
