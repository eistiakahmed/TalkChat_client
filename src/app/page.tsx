'use client';

import * as React from 'react';
import {
  Button,
  Input,
  Avatar,
  Badge,
  Modal,
  Dropdown,
  Tooltip,
  Spinner,
  Tabs,
} from '@/components/ui';
import { useThemeStore } from '@/stores/theme.store';
import {
  MessageSquare,
  Sun,
  Moon,
  Monitor,
  Search,
  Send,
  Shield,
  Phone,
  Video,
  CheckCircle,
  Sparkles,
  Lock,
  Wifi,
  Smartphone,
  ChevronRight,
  MoreVertical,
  LogOut,
  Settings,
  User as UserIcon,
} from 'lucide-react';
import Link from 'next/link';

/**
 * TalkChat Messenger - Design System & Component Showcase Page.
 * 
 * Demonstrates the Clean Minimalist Dual-Theme design aesthetic,
 * interactive atomic components, and PWA capabilities.
 */
export default function HomePage() {
  const { theme, setTheme } = useThemeStore();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('overview');
  const [searchVal, setSearchVal] = React.useState('');

  const showcaseTabs = [
    { id: 'overview', label: 'Architecture', badge: 'v1.0' },
    { id: 'components', label: 'UI Components', badge: 9 },
    { id: 'security', label: 'E2EE & Security' },
  ];

  const dropdownMenuItems = [
    {
      id: 'profile',
      label: 'My Profile',
      icon: <UserIcon className="w-4 h-4" />,
      onClick: () => {},
    },
    {
      id: 'settings',
      label: 'Preferences',
      icon: <Settings className="w-4 h-4" />,
      onClick: () => {},
    },
    {
      id: 'logout',
      label: 'Sign Out',
      icon: <LogOut className="w-4 h-4" />,
      danger: true,
      onClick: () => {},
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md px-6 py-3 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <MessageSquare className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-foreground">TalkChat</span>
                <Badge variant="primary" size="sm">PWA</Badge>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">End-to-End Encrypted Messenger</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Selector segmented control */}
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
                  <Sun className="w-4 h-4" />
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
                  <Moon className="w-4 h-4" />
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
                  <Monitor className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>

            <Dropdown
              trigger={
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              }
              items={dropdownMenuItems}
              align="right"
            />

            <Link href="/login">
              <Button variant="primary" size="sm">
                Get Started
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Showcase */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-4 max-w-3xl mx-auto pt-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Clean Minimalist Dual-Theme Design System
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Enterprise Real-Time Messenger <br />
            <span className="text-brand-600 dark:text-brand-400">Progressive Web App</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
            Built with Next.js 16, React 19, Tailwind CSS v4, Zustand, and Signal-grade X3DH E2EE security.
            Fast, responsive, installable, and fully offline-capable.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/login">
              <Button variant="primary" size="lg">
                Open Messenger
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" onClick={() => setModalOpen(true)}>
              Preview Component Modal
            </Button>
          </div>
        </section>

        {/* Showcase Tabs */}
        <div className="flex justify-center max-w-md mx-auto">
          <Tabs
            tabs={showcaseTabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {/* Tab 1: Architecture Highlights */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
            <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-foreground">PWA & Offline First</h2>
              <p className="text-sm text-muted-foreground">
                Custom service worker with background sync, static caching, push notification support, and promptable installation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Zero URL Parameters</h2>
              <p className="text-sm text-muted-foreground">
                All client-server communications transmit parameters purely via request payload bodies (<code className="text-xs bg-muted px-1 py-0.5 rounded">req.body</code>), matching TalkChat backend architecture.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Wifi className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Real-Time & WebRTC</h2>
              <p className="text-sm text-muted-foreground">
                Sub-millisecond WebSocket channels for typing indicators, presence, instant delivery/read receipts, and crystal-clear WebRTC audio/video calls.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Reusable UI Component Primitives */}
        {activeTab === 'components' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Buttons Showcase */}
            <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-600" />
                Button Variants & States
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="primary" isLoading>Loading</Button>
                <Button variant="outline" size="sm">Small</Button>
                <Button variant="outline" size="lg">Large</Button>
                <Button variant="primary" size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Badges & Avatars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
                <h2 className="text-base font-bold text-foreground">Avatars & Presence</h2>
                <div className="flex items-center gap-4">
                  <Avatar name="Sarah Connor" status="online" hasStory />
                  <Avatar name="John Doe" status="busy" />
                  <Avatar name="Alex Vance" status="away" />
                  <Avatar name="Eistiak Ahmed" status="offline" size="lg" />
                  <Avatar name="System" size="sm" />
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
                <h2 className="text-base font-bold text-foreground">Badges & Statuses</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="primary">New Message</Badge>
                  <Badge variant="success">Delivered</Badge>
                  <Badge variant="warning">Away</Badge>
                  <Badge variant="danger">Disconnected</Badge>
                  <Badge variant="default">Offline</Badge>
                  <Badge variant="primary" size="sm">99+</Badge>
                </div>
              </div>
            </div>

            {/* Inputs & Tooltips */}
            <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
              <h2 className="text-base font-bold text-foreground">Form Inputs & Validation</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Search Contacts"
                  placeholder="Search by name, phone or username..."
                  leftIcon={<Search className="w-4 h-4" />}
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  helperText="Type to filter your contacts in real-time"
                />
                <Input
                  label="Password"
                  type="password"
                  defaultValue="secret123"
                  error="Password must contain at least 8 characters"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Security & E2EE */}
        {activeTab === 'security' && (
          <div className="p-8 rounded-2xl bg-card border border-border space-y-6 animate-fadeIn">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">X3DH Extended Triple Diffie-Hellman Protocol</h2>
                <p className="text-muted-foreground text-sm">
                  Identity keys, signed prekeys, and one-time prekeys ensure asynchronous forward secrecy. Private keys never leave user devices.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-muted/40 border border-border">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Identity Keys</span>
                <p className="text-sm font-medium text-foreground mt-1">Ed25519 / Curve25519</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/40 border border-border">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cipher Suite</span>
                <p className="text-sm font-medium text-foreground mt-1">AES-256-GCM / HMAC-SHA256</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/40 border border-border">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ephemeral Storage</span>
                <p className="text-sm font-medium text-foreground mt-1">Encrypted IndexedDB</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Reusable Modal Demonstration */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Interactive Dialog Preview"
        description="This modal demonstrates accessible focus management, backdrop blur, and custom animation."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              Confirm & Close
            </Button>
          </>
        }
      >
        <div className="space-y-3 py-2 text-sm text-foreground">
          <p>
            The TalkChat UI library is built strictly following accessible HTML standards,
            clean minimalist zinc neutrals, and Signal electric blue accents.
          </p>
          <div className="p-3 rounded-lg bg-muted/60 border border-border text-xs font-mono text-muted-foreground">
            Theme state: <span className="text-brand-600 font-bold">{theme}</span> | Mode: <span className="text-emerald-500 font-bold">Online</span>
          </div>
        </div>
      </Modal>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-6 bg-card/40 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>TalkChat Backend Online (Port 5000)</span>
          </div>
          <p>© 2026 TalkChat Messenger. End-to-End Encrypted Communication.</p>
        </div>
      </footer>
    </div>
  );
}
