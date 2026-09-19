'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  MessageSquare,
  Users,
  Phone,
  Radio,
  Settings,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  Volume2,
  VolumeX,
  Bell,
} from 'lucide-react';
import { Avatar, Tooltip, Dropdown } from '../ui';
import { useThemeStore } from '../../stores/theme.store';
import { useAuthStore } from '../../stores/auth.store';
import { useSettingsStore } from '../../stores/settings.store';
import { notificationService } from '../../services/notification.service';
import { authService } from '../../services/auth.service';
import { cn } from '../../utils/cn';

/**
 * Desktop Left Navigation Rail Component.
 * 
 * 64px width fixed left sidebar providing high-level navigation
 * between Chats, Contacts, Calls, and Stories, plus user session control.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/navigation_role
 */
export function NavigationRail() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useThemeStore();
  const { user, refreshToken, logout } = useAuthStore();
  const { soundEnabled, toggleSound, desktopNotificationsEnabled } =
    useSettingsStore();

  const handleLogout = async () => {
    try {
      await authService.logout(refreshToken);
    } catch {
      // Ignore network failures on logout
    } finally {
      logout();
      router.push('/login');
    }
  };

  const navItems = [
    {
      id: 'chats',
      label: 'Chats',
      icon: MessageSquare,
      href: '/chat',
      isActive: pathname.startsWith('/chat'),
    },
    {
      id: 'stories',
      label: 'Stories',
      icon: Radio,
      href: '/stories',
      isActive: pathname.startsWith('/stories'),
    },
    {
      id: 'calls',
      label: 'Calls',
      icon: Phone,
      href: '/calls',
      isActive: pathname.startsWith('/calls'),
    },
    {
      id: 'contacts',
      label: 'Contacts',
      icon: Users,
      href: '/contacts',
      isActive: pathname.startsWith('/contacts'),
    },
  ];

  const userMenuItems = [
    {
      id: 'profile',
      label: user?.fullName || 'Profile',
      icon: <UserIcon className="w-4 h-4" />,
      onClick: () => router.push('/profile'),
    },
    {
      id: 'sound',
      label: soundEnabled ? 'Mute Sounds' : 'Unmute Sounds',
      icon: soundEnabled ? (
        <VolumeX className="w-4 h-4" />
      ) : (
        <Volume2 className="w-4 h-4" />
      ),
      onClick: toggleSound,
    },
    {
      id: 'notifications',
      label: desktopNotificationsEnabled
        ? 'Notifications Active'
        : 'Enable Notifications',
      icon: <Bell className="w-4 h-4" />,
      onClick: async () => {
        await notificationService.requestPermission();
      },
    },
    {
      id: 'settings',
      label: 'Preferences',
      icon: <Settings className="w-4 h-4" />,
      onClick: () => router.push('/settings'),
    },
    {
      id: 'logout',
      label: 'Sign Out',
      icon: <LogOut className="w-4 h-4" />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <aside
      aria-label="Application Navigation"
      className="hidden md:flex flex-col items-center justify-between w-16 h-screen border-r border-white/[0.08] bg-[#07070a] py-4 select-none shrink-0 z-30"
    >
      {/* Top Branding Logo */}
      <div className="flex flex-col items-center gap-6">
        <Link
          href="/chat"
          className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-95 transition-all"
        >
          <MessageSquare className="w-5 h-5 fill-current text-white" />
        </Link>

        {/* Primary Navigation Icons */}
        <nav className="flex flex-col items-center gap-2.5 w-full px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Tooltip key={item.id} content={item.label} position="right">
                <Link
                  href={item.href}
                  className={cn(
                    'relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 group',
                    item.isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/25 before:absolute before:-left-2 before:top-2.5 before:bottom-2.5 before:w-1 before:bg-blue-500 before:rounded-r-full before:shadow-sm before:shadow-blue-500'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                  )}
                  aria-label={item.label}
                >
                  <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                </Link>
              </Tooltip>
            );
          })}
        </nav>
      </div>

      {/* Bottom Controls: Theme Toggle, Settings, User Avatar */}
      <div className="flex flex-col items-center gap-3">
        {/* Quick Theme Switcher */}
        <Tooltip content={theme === 'dark' ? 'Light mode' : 'Dark mode'} position="right">
          <button
            type="button"
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-5 h-5 text-blue-400 hover:-rotate-12 transition-transform" />
            )}
          </button>
        </Tooltip>

        {/* User Profile Avatar with Context Menu */}
        <Dropdown
          trigger={
            <button
              type="button"
              className="rounded-full p-0.5 ring-2 ring-transparent hover:ring-blue-500/50 transition-all focus:outline-none cursor-pointer"
              aria-label="User Account Menu"
            >
              <Avatar
                name={user?.fullName || user?.username || 'User'}
                src={user?.avatarUrl}
                size="sm"
                status="online"
              />
            </button>
          }
          items={userMenuItems}
          direction="up"
          align="left"
        />
      </div>
    </aside>
  );
}
