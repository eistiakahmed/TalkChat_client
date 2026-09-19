'use client';

import * as React from 'react';
import { useWebRTCSignaling } from '../../hooks/useWebRTC';
import { IncomingCallModal } from './IncomingCallModal';
import { ActiveCallModal } from './ActiveCallModal';

/**
 * Root WebRTC Call Overlay Container.
 * 
 * Mounts in the main layout to activate real-time WebRTC socket signaling
 * listeners and render call presentation modals globally.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
 */
export function CallOverlay() {
  // Activate WebRTC signaling listeners (incoming, accepted, ice-candidates, end)
  useWebRTCSignaling();

  return (
    <>
      <IncomingCallModal />
      <ActiveCallModal />
    </>
  );
}
