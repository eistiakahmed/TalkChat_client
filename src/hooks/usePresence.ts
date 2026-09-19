'use client';

import * as React from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { useAuthStore } from '../stores/auth.store';
import { useSocketStore } from '../stores/socket.store';
import { socketClient } from '../services/socket.client';

/**
 * Format relative last seen string.
 * 
 * Examples:
 * - "Online"
 * - "Last seen today at 10:45 AM"
 * - "Last seen yesterday at 8:12 PM"
 * - "Last seen 9/15/26"
 */
export function formatLastSeen(
  lastSeen?: string | Date | null,
  isOnline = false
): string {
  if (isOnline) return 'Online';
  if (!lastSeen) return 'Offline';

  try {
    const date = typeof lastSeen === 'string' ? new Date(lastSeen) : lastSeen;
    if (isNaN(date.getTime())) return 'Offline';

    if (isToday(date)) {
      return `Last seen today at ${format(date, 'p')}`;
    }
    if (isYesterday(date)) {
      return `Last seen yesterday at ${format(date, 'p')}`;
    }
    return `Last seen on ${format(date, 'M/d/yy')}`;
  } catch {
    return 'Offline';
  }
}

/**
 * Custom React Hook for Managing User Presence and Heartbeats.
 * 
 * Synchronizes browser tab visibility changes with the socket server
 * and maintains active user connectivity.
 */
export function usePresence() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  React.useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityChange = () => {
      const socket = socketClient.getSocket();
      if (!socket || !socket.connected) return;

      if (document.visibilityState === 'visible') {
        socket.emit('presence:status', { status: 'ONLINE' });
      } else {
        socket.emit('presence:status', { status: 'AWAY' });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic heartbeat every 45 seconds
    const heartbeatInterval = setInterval(() => {
      const socket = socketClient.getSocket();
      if (socket && socket.connected) {
        socket.emit('presence:heartbeat');
      }
    }, 45000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(heartbeatInterval);
    };
  }, [isAuthenticated]);
}
