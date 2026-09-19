'use client';

import * as React from 'react';
import { socketClient } from '../services/socket.client';
import { useAuthStore } from '../stores/auth.store';
import { useCallStore } from '../stores/call.store';
import { callAudio } from '../utils/callAudio';
import type { CallParticipant, CallType } from '../types/call.types';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

// Module-level singletons for active media and peer connection
let peerConnection: RTCPeerConnection | null = null;
let localMediaStream: MediaStream | null = null;
let iceCandidateQueue: RTCIceCandidateInit[] = [];

/**
 * Clean up active RTCPeerConnection and stop all hardware media tracks.
 */
function cleanupConnection() {
  callAudio.stopAll();

  if (peerConnection) {
    try {
      peerConnection.close();
    } catch {
      // Ignored
    }
    peerConnection = null;
  }

  if (localMediaStream) {
    try {
      localMediaStream.getTracks().forEach((track) => track.stop());
    } catch {
      // Ignored
    }
    localMediaStream = null;
  }

  iceCandidateQueue = [];
  useCallStore.getState().resetCall();
}

/**
 * Hook for WebRTC Socket Signaling.
 * Mount ONCE globally in CallOverlay to handle all incoming/accepted/rejected/ice events.
 */
export function useWebRTCSignaling() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionState = useCallStore((s) => s.sessionState);

  // Audio tone manager: ringback on calling, ringtone on incoming call, stop on connect/disconnect
  React.useEffect(() => {
    if (sessionState === 'OUTGOING_RINGING') {
      callAudio.playRingback();
    } else if (sessionState === 'INCOMING_RINGING') {
      callAudio.playRingtone();
    } else {
      callAudio.stopAll();
    }

    return () => {
      callAudio.stopAll();
    };
  }, [sessionState]);

  // Active call duration timer (runs only in CallOverlay)
  React.useEffect(() => {
    if (sessionState !== 'CONNECTED') return;

    const interval = setInterval(() => {
      useCallStore.getState().incrementDuration();
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionState]);

  // Bind Socket Signaling Listeners (once per application session)
  React.useEffect(() => {
    if (!isAuthenticated) return;

    const socket = socketClient.connect();

    // 1. Incoming Call Event
    const onIncomingCall = (payload: {
      callId: string;
      caller: CallParticipant;
      type: CallType;
      offerSdp: RTCSessionDescriptionInit;
      conversationId?: string;
    }) => {
      useCallStore.getState().setIncomingCall(payload);
      // Immediately notify caller that our device is actively ringing
      socket.emit('call:ringing', { callId: payload.callId });
    };

    // 2. Call Initiated Acknowledgment Event
    const onCallInitiated = (payload: { callId: string }) => {
      if (payload?.callId) {
        useCallStore.getState().updateCallId(payload.callId);
      }
    };

    // 3. Call Ringing Event (Caller hears ringing alert)
    const onCallRinging = (payload?: { callId?: string; isOnline?: boolean }) => {
      useCallStore.getState().setRinging();
    };

    // 4. Callee Accepted Event (Received by Caller)
    const onCallAccepted = async (payload: {
      callId: string;
      answerSdp?: any;
    }) => {
      console.log('[WebRTC] Remote peer accepted call:', payload);
      if (payload?.callId) {
        useCallStore.getState().updateCallId(payload.callId);
      }

      // Transition caller to CONNECTED state immediately
      useCallStore.getState().setConnected();

      if (
        peerConnection &&
        payload.answerSdp &&
        typeof payload.answerSdp.sdp === 'string' &&
        !payload.answerSdp.sdp.includes('mobile-')
      ) {
        try {
          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(payload.answerSdp)
          );
          // Flush pending queued ICE candidates
          while (iceCandidateQueue.length > 0) {
            const cand = iceCandidateQueue.shift();
            if (cand) {
              await peerConnection.addIceCandidate(new RTCIceCandidate(cand));
            }
          }
        } catch (err) {
          console.warn('[WebRTC] Non-fatal error applying remote answer SDP:', err);
        }
      }
    };

    // 5. ICE Candidate Event
    const onIceCandidate = async (payload: {
      callId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      if (payload.candidate) {
        if (peerConnection && peerConnection.remoteDescription) {
          try {
            await peerConnection.addIceCandidate(
              new RTCIceCandidate(payload.candidate)
            );
          } catch (err) {
            console.warn('[WebRTC] Error adding ICE candidate:', err);
          }
        } else {
          iceCandidateQueue.push(payload.candidate);
        }
      }
    };

    // 6. Call Terminated / Rejected / Missed Events
    const onCallEnded = () => cleanupConnection();
    const onCallRejected = () => cleanupConnection();
    const onCallMissed = () => cleanupConnection();

    socket.on('call:incoming', onIncomingCall);
    socket.on('call:initiated', onCallInitiated);
    socket.on('call:ringing', onCallRinging);
    socket.on('call:accepted', onCallAccepted);
    socket.on('call:ice-candidate', onIceCandidate);
    socket.on('call:ended', onCallEnded);
    socket.on('call:rejected', onCallRejected);
    socket.on('call:missed', onCallMissed);

    return () => {
      socket.off('call:incoming', onIncomingCall);
      socket.off('call:initiated', onCallInitiated);
      socket.off('call:ringing', onCallRinging);
      socket.off('call:accepted', onCallAccepted);
      socket.off('call:ice-candidate', onIceCandidate);
      socket.off('call:ended', onCallEnded);
      socket.off('call:rejected', onCallRejected);
      socket.off('call:missed', onCallMissed);
    };
  }, [isAuthenticated]);
}

/**
 * Custom React Hook for WebRTC 1-to-1 Audio/Video Call Actions.
 * 
 * Provides stable callable triggers (startCall, acceptCall, rejectCall, endCall).
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
 */
export function useWebRTC() {
  const sessionState = useCallStore((s) => s.sessionState);
  const callId = useCallStore((s) => s.callId);
  const peerUser = useCallStore((s) => s.peerUser);
  const callType = useCallStore((s) => s.callType);
  const incomingOffer = useCallStore((s) => s.incomingOffer);

  // Initiate Outgoing Call
  const startCall = React.useCallback(
    async (
      recipient: CallParticipant,
      type: CallType,
      conversationId?: string
    ) => {
      try {
        useCallStore.getState().setConnecting();

        // 1. Acquire local camera / microphone stream
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: type === 'VIDEO',
          });
        } catch (mediaErr: any) {
          console.error('[WebRTC] Media permission error:', mediaErr);
          alert(
            mediaErr?.name === 'NotAllowedError'
              ? 'Microphone & Camera permission was denied. Please allow camera and microphone access in browser settings.'
              : `Unable to access media devices: ${mediaErr?.message || 'Check camera and microphone'}`
          );
          cleanupConnection();
          return;
        }
        localMediaStream = stream;
        useCallStore.getState().setLocalStream(stream);

        // 2. Initialize RTCPeerConnection
        const pc = new RTCPeerConnection(RTC_CONFIG);
        peerConnection = pc;

        // Add local tracks to peer connection
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // Listen for remote audio/video tracks
        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            useCallStore.getState().setRemoteStream(event.streams[0]);
          } else if (event.track) {
            const inboundStream = new MediaStream();
            inboundStream.addTrack(event.track);
            useCallStore.getState().setRemoteStream(inboundStream);
          }
        };

        // Emit Trickle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate && recipient.id) {
            const socket = socketClient.getSocket();
            socket?.emit('call:ice-candidate', {
              callId: useCallStore.getState().callId,
              targetUserId: recipient.id,
              candidate: event.candidate,
            });
          }
        };

        // 3. Create and set local SDP Offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // 4. Set initial outgoing state
        useCallStore.getState().setOutgoingCall({
          callId: 'pending',
          recipient,
          type,
          conversationId,
        });

        // 5. Emit initiation payload to backend
        const socket = socketClient.getSocket();
        socket?.emit(
          'call:initiate',
          {
            recipientId: recipient.id,
            type,
            offerSdp: offer,
            conversationId,
          },
          (res?: { success?: boolean; callId?: string }) => {
            if (res?.callId) {
              useCallStore.getState().updateCallId(res.callId);
            }
          }
        );
      } catch (err) {
        console.error('[WebRTC] Failed to start call:', err);
        cleanupConnection();
      }
    },
    []
  );

  // Accept Incoming Call
  const acceptCall = React.useCallback(async () => {
    const currentCallId = useCallStore.getState().callId;
    const currentOffer = useCallStore.getState().incomingOffer;
    const currentPeer = useCallStore.getState().peerUser;
    const currentType = useCallStore.getState().callType;

    console.log('[WebRTC] User clicked Accept Call:', { currentCallId, peer: currentPeer?.username, hasOffer: !!currentOffer });

    if (!currentPeer) {
      console.warn('[WebRTC] Cannot accept call: missing peerUser');
      return;
    }

    try {
      useCallStore.getState().setConnecting();

      // 1. Acquire local media stream (non-blocking fallback so call always connects)
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: currentType === 'VIDEO',
        });
        localMediaStream = stream;
        useCallStore.getState().setLocalStream(stream);
      } catch (mediaErr: any) {
        console.warn('[WebRTC] Local media capture restricted/denied:', mediaErr);
      }

      // 2. Initialize RTCPeerConnection
      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnection = pc;

      if (stream) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      } else {
        try {
          pc.addTransceiver('audio', { direction: 'recvonly' });
        } catch (e) {}
      }

      pc.ontrack = (event) => {
        console.log('[WebRTC] Remote media track received on Web client');
        if (event.streams && event.streams[0]) {
          useCallStore.getState().setRemoteStream(event.streams[0]);
        } else if (event.track) {
          const ms = new MediaStream();
          ms.addTrack(event.track);
          useCallStore.getState().setRemoteStream(ms);
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && currentPeer.id) {
          const socket = socketClient.getSocket();
          socket?.emit('call:ice-candidate', {
            callId: currentCallId,
            targetUserId: currentPeer.id,
            candidate: event.candidate,
          });
        }
      };

      // 3. Apply Remote SDP Offer & Create SDP Answer
      let answerPayload: any = { type: 'answer', sdp: 'web-answer-sdp' };
      if (
        currentOffer &&
        typeof currentOffer.sdp === 'string' &&
        !currentOffer.sdp.includes('mobile-')
      ) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(currentOffer));

          // Flush any queued candidates
          while (iceCandidateQueue.length > 0) {
            const cand = iceCandidateQueue.shift();
            if (cand) {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            }
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          answerPayload = answer;
        } catch (offerErr) {
          console.warn('[WebRTC] Non-fatal error negotiating SDP offer:', offerErr);
        }
      } else {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          answerPayload = offer;
        } catch (e) {}
      }

      // 4. Emit Call Accepted event with SDP Answer to server
      const socket = socketClient.getSocket() || socketClient.connect();
      socket?.emit('call:accept', {
        callId: currentCallId || undefined,
        answerSdp: answerPayload,
      });

      // 5. Transition receiver immediately to connected state
      useCallStore.getState().setConnected();
    } catch (err) {
      console.error('[WebRTC] Failed to accept call:', err);
      cleanupConnection();
    }
  }, []);

  // Reject Incoming Call
  const rejectCall = React.useCallback(
    (reason: 'DECLINED' | 'BUSY' = 'DECLINED') => {
      const currentCallId = useCallStore.getState().callId;
      if (currentCallId) {
        const socket = socketClient.getSocket();
        socket?.emit('call:reject', { callId: currentCallId, reason });
      }
      cleanupConnection();
    },
    []
  );

  // Terminate Active Call
  const endCall = React.useCallback(() => {
    const currentCallId = useCallStore.getState().callId;
    if (currentCallId) {
      const socket = socketClient.getSocket();
      socket?.emit('call:end', { callId: currentCallId });
    }
    cleanupConnection();
  }, []);

  return {
    sessionState,
    callId,
    peerUser,
    callType,
    incomingOffer,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
  };
}
