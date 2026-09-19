'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Bell,
  Download,
  ShieldCheck,
  LogOut,
  User,
  ExternalLink,
} from 'lucide-react';
import { Button, Avatar } from '../../../components/ui';
import { useAuthStore } from '../../../stores/auth.store';
import { useThemeStore } from '../../../stores/theme.store';
import { useSettingsStore } from '../../../stores/settings.store';
import { usePWA } from '../../../hooks/usePWA';
import { notificationService } from '../../../services/notification.service';
import { authService } from '../../../services/auth.service';
import { cn } from '../../../utils/cn';

/**
 * Application Settings and Preferences Page.
 * 
 * Manages theme appearance, audio sound synthesizers, web notifications,
 * PWA installation state, and session control.
 */
export default function SettingsPage() {
  const router = useRouter();
  const { user, refreshToken, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { soundEnabled, toggleSound, desktopNotificationsEnabled, toggleDesktopNotifications } =
    useSettingsStore();
  const { isInstallable, isInstalled, installPWA } = usePWA();

  const handleLogout = async () => {
    try {
      await authService.logout(refreshToken);
    } catch {
      // Ignored
    } finally {
      logout();
      router.push('/login');
    }
  };

  const handleToggleNotifications = async () => {
    if (!desktopNotificationsEnabled) {
      const granted = await notificationService.requestPermission();
      if (granted) {
        toggleDesktopNotifications();
      }
    } else {
      toggleDesktopNotifications();
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-background select-none overflow-y-auto">
      {/* 1. Header */}
      <header className="p-6 border-b border-border bg-card/60 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-600">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Preferences</h1>
            <p className="text-xs text-muted-foreground">
              Customize your TalkChat experience
            </p>
          </div>
        </div>
      </header>

      {/* 2. Main Settings Sections */}
      <div className="max-w-3xl w-full mx-auto p-6 space-y-6">
        {/* Account Snapshot Card */}
        <div className="p-5 rounded-2xl bg-card border border-border flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-4">
            <Avatar
              src={user?.avatarUrl}
              name={user?.fullName || user?.username}
              size="lg"
            />
            <div>
              <h2 className="text-base font-bold text-foreground">
                {user?.fullName || user?.username}
              </h2>
              <p className="text-xs text-muted-foreground">@{user?.username}</p>
              <p className="text-xs text-muted-foreground pt-0.5">{user?.email}</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/profile')}
          >
            <User className="w-4 h-4 mr-1.5" />
            Edit Profile
          </Button>
        </div>

        {/* Appearance & Sound Section */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Appearance & Audio
          </h3>

          <div className="rounded-2xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
            {/* Theme Switcher */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-600">
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5 text-amber-400" />
                  ) : (
                    <Moon className="w-5 h-5 text-zinc-700" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Theme Mode</h4>
                  <p className="text-xs text-muted-foreground">
                    Currently set to {theme === 'dark' ? 'Dark' : 'Light'} theme
                  </p>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={toggleTheme}>
                Switch to {theme === 'dark' ? 'Light' : 'Dark'}
              </Button>
            </div>

            {/* Audio Effects Toggle */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-600">
                  {soundEnabled ? (
                    <Volume2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Sound Effects</h4>
                  <p className="text-xs text-muted-foreground">
                    Procedural audio synthesizer for incoming chimes and ringtones
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleSound}
                className={cn(
                  'w-12 h-6.5 rounded-full transition-colors relative focus:outline-none',
                  soundEnabled ? 'bg-brand-600' : 'bg-muted'
                )}
                aria-label="Toggle Sound Effects"
              >
                <span
                  className={cn(
                    'block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform',
                    soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>

            {/* Desktop Notifications Toggle */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-600">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Desktop Notifications
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Native Web Notifications for messages when browser is in background
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleNotifications}
                className={cn(
                  'w-12 h-6.5 rounded-full transition-colors relative focus:outline-none',
                  desktopNotificationsEnabled ? 'bg-brand-600' : 'bg-muted'
                )}
                aria-label="Toggle Desktop Notifications"
              >
                <span
                  className={cn(
                    'block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform',
                    desktopNotificationsEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>
          </div>
        </section>

        {/* PWA & Security Section */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            System & Security
          </h3>

          <div className="rounded-2xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
            {/* PWA Installation */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-600">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Progressive Web App (PWA)
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {isInstalled
                      ? 'Installed and running in standalone native window'
                      : isInstallable
                      ? 'Install on desktop or home screen for offline access'
                      : 'Web application ready with offline service worker caching'}
                  </p>
                </div>
              </div>

              {isInstallable && !isInstalled && (
                <Button variant="primary" size="sm" onClick={installPWA}>
                  Install App
                </Button>
              )}
            </div>

            {/* End-to-End Encryption */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Signal Protocol Cryptography
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    End-to-End Encrypted (X3DH key bundles &amp; 60-digit safety numbers)
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full uppercase">
                Active
              </span>
            </div>
          </div>
        </section>

        {/* Sign Out Section */}
        <section className="pt-2">
          <Button
            variant="outline"
            className="w-full text-danger hover:bg-danger/10 hover:border-danger/30"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out of TalkChat
          </Button>
        </section>
      </div>
    </div>
  );
}
