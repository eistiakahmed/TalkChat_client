'use client';

import * as React from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { Avatar, Button } from '../ui';
import { useCallStore } from '../../stores/call.store';
import { useWebRTC } from '../../hooks/useWebRTC';

/**
 * Incoming WebRTC Call Alert Modal.
 * 
 * Pops up with caller metadata, ringing alert, and one-tap Accept/Decline triggers.
 */
export function IncomingCallModal() {
  const { sessionState, peerUser, callType } = useCallStore();
  const { acceptCall, rejectCall } = useWebRTC();

  if (sessionState !== 'INCOMING_RINGING' || !peerUser) {
    return null;
  }

  const isVideo = callType === 'VIDEO';

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Incoming Call"
      className="fixed inset-x-0 top-6 z-50 flex justify-center px-4 animate-bounce-in select-none"
    >
      <div className="w-full max-w-sm rounded-3xl bg-card/95 border border-brand-500/40 shadow-2xl p-5 backdrop-blur-xl flex flex-col items-center text-center space-y-4">
        {/* Caller Avatar with Pulse Ring */}
        <div className="relative">
          <div className="absolute -inset-1.5 rounded-full bg-brand-500/30 animate-ping" />
          <Avatar
            src={peerUser.avatarUrl}
            name={peerUser.fullName || peerUser.username}
            size="xl"
            className="relative"
          />
        </div>

        {/* Call Info */}
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-foreground">
            {peerUser.fullName || peerUser.username}
          </h3>
          <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
            {isVideo ? (
              <Video className="w-3.5 h-3.5" />
            ) : (
              <Phone className="w-3.5 h-3.5" />
            )}
            <span>Incoming {isVideo ? 'Video' : 'Audio'} Call</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-6 pt-2">
          {/* Decline Button */}
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => rejectCall('DECLINED')}
              className="w-14 h-14 rounded-full bg-danger hover:bg-danger/90 text-white flex items-center justify-center shadow-lg shadow-danger/30 hover:scale-105 transition-all"
              aria-label="Decline Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <span className="text-[11px] font-medium text-muted-foreground">Decline</span>
          </div>

          {/* Accept Button */}
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => acceptCall()}
              className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-105 transition-all animate-pulse"
              aria-label="Accept Call"
            >
              <Phone className="w-6 h-6" />
            </button>
            <span className="text-[11px] font-medium text-muted-foreground">Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
}
