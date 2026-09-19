'use client';

import * as React from 'react';
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Avatar } from '../ui';
import { useCallStore } from '../../stores/call.store';
import { useWebRTC } from '../../hooks/useWebRTC';
import { cn } from '../../utils/cn';

function formatCallDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Active WebRTC Call Presentation Window.
 * 
 * Supports full-screen high-definition video streaming and audio waveform calling
 * with mute/camera hardware controls.
 */
export function ActiveCallModal() {
  const {
    sessionState,
    peerUser,
    callType,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    durationSeconds,
    toggleMute,
    toggleVideo,
  } = useCallStore();

  const { endCall } = useWebRTC();

  const localVideoRef = React.useRef<HTMLVideoElement>(null);
  const remoteVideoRef = React.useRef<HTMLVideoElement>(null);
  const remoteAudioRef = React.useRef<HTMLAudioElement>(null);

  // Attach local video stream
  React.useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote video and audio stream
  React.useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch((err) => {
        console.warn('[ActiveCallModal] Remote audio play prevented by browser autoplay policy:', err);
      });
    }
  }, [remoteStream]);

  const isOpen =
    sessionState === 'OUTGOING_RINGING' ||
    sessionState === 'CONNECTING' ||
    sessionState === 'CONNECTED';

  if (!isOpen || !peerUser) return null;

  const isVideo = callType === 'VIDEO';
  const isConnected = sessionState === 'CONNECTED';

  const statusSubtitle =
    sessionState === 'OUTGOING_RINGING'
      ? 'Ringing...'
      : sessionState === 'CONNECTING'
      ? 'Connecting...'
      : formatCallDuration(durationSeconds);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Active Call Window"
      className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-6 select-none animate-fadeIn backdrop-blur-md"
    >
      {/* Remote Audio Track Element (Audio Only) */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* 1. Header (Peer Info & Timer) */}
      <div className="flex flex-col items-center text-center space-y-1 z-20 pt-4">
        <h2 className="text-xl font-bold text-white tracking-tight">
          {peerUser.fullName || peerUser.username}
        </h2>
        <p className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
          {statusSubtitle}
        </p>
      </div>

      {/* 2. Media Canvas */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden my-4">
        {isVideo ? (
          <div className="relative w-full h-full max-w-4xl max-h-[70vh] rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl">
            {/* Remote Video Stream */}
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center space-y-3">
                <Avatar
                  src={peerUser.avatarUrl}
                  name={peerUser.fullName || peerUser.username}
                  size="2xl"
                />
                <span className="text-xs text-zinc-400 animate-pulse">
                  Waiting for video feed...
                </span>
              </div>
            )}

            {/* Local Video Stream Pip */}
            {localStream && (
              <div className="absolute top-4 right-4 w-28 h-36 sm:w-36 sm:h-48 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl bg-black">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={cn(
                    'w-full h-full object-cover -scale-x-100',
                    isVideoOff && 'hidden'
                  )}
                />
                {isVideoOff && (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-400">
                    <VideoOff className="w-6 h-6" />
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Audio Call Visualizer */
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              {isConnected && (
                <div className="absolute -inset-4 rounded-full bg-brand-500/20 animate-ping" />
              )}
              <Avatar
                src={peerUser.avatarUrl}
                name={peerUser.fullName || peerUser.username}
                size="2xl"
                className="relative ring-4 ring-brand-500/30 shadow-2xl"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Bottom Controls Toolbar */}
      <div className="flex items-center justify-center gap-5 z-20 pb-4">
        {/* Mute Mic Toggle */}
        <button
          type="button"
          onClick={toggleMute}
          className={cn(
            'w-13 h-13 rounded-full flex items-center justify-center transition-all shadow-lg',
            isMuted
              ? 'bg-danger text-white'
              : 'bg-white/15 hover:bg-white/25 text-white'
          )}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Video Camera Toggle (for video calls) */}
        {isVideo && (
          <button
            type="button"
            onClick={toggleVideo}
            className={cn(
              'w-13 h-13 rounded-full flex items-center justify-center transition-all shadow-lg',
              isVideoOff
                ? 'bg-danger text-white'
                : 'bg-white/15 hover:bg-white/25 text-white'
            )}
            aria-label={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isVideoOff ? (
              <VideoOff className="w-5 h-5" />
            ) : (
              <Video className="w-5 h-5" />
            )}
          </button>
        )}

        {/* End Call Hangup Button */}
        <button
          type="button"
          onClick={endCall}
          className="w-16 h-16 rounded-full bg-danger hover:bg-danger/90 text-white flex items-center justify-center shadow-2xl shadow-danger/40 hover:scale-105 transition-all"
          aria-label="Hang up call"
        >
          <PhoneOff className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
}
