'use client';

import { WifiOff } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

/**
 * PWA Offline Indicator Banner Component.
 * 
 * Informs the user when network connectivity is lost.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine
 */
export function OfflineBanner() {
  const { isOnline } = usePWA();

  if (isOnline) {
    return null;
  }

  return (
    <aside
      aria-label="Offline status warning"
      className="bg-amber-500/15 border-b border-amber-500/30 text-amber-600 dark:text-amber-400 px-4 py-2 text-xs font-medium flex items-center justify-center gap-2 transition-all duration-300"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>You are currently offline. Showing cached messages &amp; media.</span>
    </aside>
  );
}
