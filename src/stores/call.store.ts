import { create } from 'zustand';
import type {
  CallType,
  CallSessionState,
  CallParticipant,
} from '../types/call.types';
import { soundUtil } from '../utils/sound.util';

export interface CallStoreState {
  sessionState: CallSessionState;
  callId: string | null;
  peerUser: CallParticipant | null;
  callType: CallType;
  incomingOffer: RTCSessionDescriptionInit | null;
  conversationId?: string | null;

  localStream: MediaStream | null;
  remoteStream: MediaStream | null;

  isMuted: boolean;
  isVideoOff: boolean;
  durationSeconds: number;

  // Actions
  setIncomingCall: (params: {
    callId: string;
    caller: CallParticipant;
    type: CallType;
    offerSdp: RTCSessionDescriptionInit;
    conversationId?: string;
  }) => void;
  setOutgoingCall: (params: {
    callId: string;
    recipient: CallParticipant;
    type: CallType;
    conversationId?: string;
  }) => void;
  updateCallId: (callId: string) => void;
  setRinging: () => void;
  setConnecting: () => void;
  setConnected: (streams?: {
    localStream?: MediaStream | null;
    remoteStream?: MediaStream | null;
  }) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  incrementDuration: () => void;
  resetCall: () => void;
}

/**
 * WebRTC Calling State Store.
 * 
 * Central state machine managing active call status, audio/video media streams,
 * hardware mute/camera switches, and ringtone orchestration.
 */
export const useCallStore = create<CallStoreState>((set, get) => ({
  sessionState: 'IDLE',
  callId: null,
  peerUser: null,
  callType: 'AUDIO',
  incomingOffer: null,
  conversationId: null,

  localStream: null,
  remoteStream: null,

  isMuted: false,
  isVideoOff: false,
  durationSeconds: 0,

  setIncomingCall: ({ callId, caller, type, offerSdp, conversationId }) => {
    soundUtil.playCallRing();
    set({
      sessionState: 'INCOMING_RINGING',
      callId,
      peerUser: caller,
      callType: type,
      incomingOffer: offerSdp,
      conversationId,
      durationSeconds: 0,
    });
  },

  setOutgoingCall: ({ callId, recipient, type, conversationId }) => {
    set({
      sessionState: 'OUTGOING_RINGING',
      callId,
      peerUser: recipient,
      callType: type,
      conversationId,
      durationSeconds: 0,
    });
  },

  updateCallId: (callId: string) => {
    set({ callId });
  },

  setRinging: () => {
    set({ sessionState: 'OUTGOING_RINGING' });
  },

  setConnecting: () => {
    soundUtil.stopCallRing();
    set({ sessionState: 'CONNECTING' });
  },

  setConnected: (streams) => {
    soundUtil.stopCallRing();
    set({
      sessionState: 'CONNECTED',
      ...(streams?.localStream !== undefined && { localStream: streams.localStream }),
      ...(streams?.remoteStream !== undefined && { remoteStream: streams.remoteStream }),
    });
  },

  setLocalStream: (stream) => {
    set({ localStream: stream });
  },

  setRemoteStream: (stream) => {
    set({ remoteStream: stream });
  },

  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted; // Toggle enabled state
      });
    }
    set({ isMuted: !isMuted });
  },

  toggleVideo: () => {
    const { localStream, isVideoOff } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff; // Toggle enabled state
      });
    }
    set({ isVideoOff: !isVideoOff });
  },

  incrementDuration: () => {
    set((state) => ({ durationSeconds: state.durationSeconds + 1 }));
  },

  resetCall: () => {
    soundUtil.stopCallRing();
    const { localStream } = get();
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    set({
      sessionState: 'IDLE',
      callId: null,
      peerUser: null,
      incomingOffer: null,
      conversationId: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isVideoOff: false,
      durationSeconds: 0,
    });
  },
}));
