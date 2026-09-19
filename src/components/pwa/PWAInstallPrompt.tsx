'use client';

import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

/**
 * PWA Install Prompt Banner Component.
 * 
 * Renders an unobtrusive floating prompt when the browser emits the `beforeinstallprompt` event,
 * inviting the user to add TalkChat to their home screen or desktop application list.
 * 
 * @see https://web.dev/learn/pwa/installation
 */
export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, installPWA } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isInstallable || isInstalled || isDismissed) {
    return null;
  }

  return (
    <aside
      aria-label="Install TalkChat Application"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 bg-surface border border-border-strong p-4 rounded-2xl shadow-modal flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent text-accent-fg flex items-center justify-center shrink-0 shadow-sm">
          <Download className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-txt-primary">Install TalkChat</h4>
          <p className="text-xs text-txt-secondary">
            Install on your device for native speeds &amp; offline access.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => installPWA()}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-accent hover:bg-accent-hover text-accent-fg transition-colors shadow-xs"
        >
          Install
        </button>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded-lg text-txt-muted hover:text-txt-primary hover:bg-card-hover transition-colors"
          aria-label="Dismiss installation prompt"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
