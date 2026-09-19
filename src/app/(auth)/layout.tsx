'use client';

import * as React from 'react';
import Link from 'next/link';
import { MessageSquare, ShieldCheck, Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '../../stores/theme.store';
import { Tooltip } from '../../components/ui';

/**
 * Authentication Route Group Layout.
 * 
 * Provides a split-screen or centered minimalist card layout with
 * brand iconography, theme toggle switcher, and security credentials.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/route-groups
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-brand-500/20 selection:text-brand-600">
      {/* Header with Brand Logo & Theme Toggles */}
      <header className="w-full px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <MessageSquare className="w-5 h-5 fill-current" />
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground">
            TalkChat
          </span>
        </Link>

        {/* Minimal Theme Switcher */}
        <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border">
          <Tooltip content="Light Mode">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-1.5 rounded-md transition-all ${
                theme === 'light'
                  ? 'bg-card text-brand-600 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label="Light Theme"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <Tooltip content="Dark Mode">
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-1.5 rounded-md transition-all ${
                theme === 'dark'
                  ? 'bg-card text-brand-600 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label="Dark Theme"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <Tooltip content="System Preference">
            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-1.5 rounded-md transition-all ${
                theme === 'system'
                  ? 'bg-card text-brand-600 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label="System Theme"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        </div>
      </header>

      {/* Main Authentication Flow Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Security & Verification Footer */}
      <footer className="w-full py-4 px-6 text-center">
        <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Encrypted with Signal-grade X3DH Protocol</span>
        </div>
      </footer>
    </div>
  );
}
