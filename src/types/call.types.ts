/**
 * TalkChat WebRTC 1-to-1 Calling Domain Types.
 * 
 * Defines schemas for audio/video call signaling, session state machine,
 * and persistent call history logs.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
 */

export type CallType = 'AUDIO' | 'VIDEO';

export type CallStatus =
  | 'INITIATED'
  | 'RINGING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'MISSED'
  | 'ENDED'
  | 'BUSY';

export type CallSessionState =
  | 'IDLE'
  | 'OUTGOING_RINGING'
  | 'INCOMING_RINGING'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'ENDED';

export interface CallParticipant {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string | null;
}

export interface CallLog {
  id: string;
  callerId: string;
  receiverId: string;
  conversationId?: string | null;
  type: CallType;
  status: CallStatus;
  startedAt?: string | null;
  answeredAt?: string | null;
  endedAt?: string | null;
  duration?: number | null;
  endReason?: string | null;
  caller: CallParticipant;
  receiver: CallParticipant;
  createdAt: string;
}

export interface CallHistoryResponse {
  calls: CallLog[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface IncomingCallPayload {
  callId: string;
  caller: CallParticipant;
  type: CallType;
  offerSdp: RTCSessionDescriptionInit;
  conversationId?: string;
}
