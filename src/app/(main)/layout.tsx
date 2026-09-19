'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../../stores/auth.store';
import { NavigationRail } from '../../components/layout/NavigationRail';
import { MobileNav } from '../../components/layout/MobileNav';
import { ConversationSidebar } from '../../components/chat/ConversationSidebar';
import { Spinner } from '../../components/ui';
import { usePresence } from '../../hooks/usePresence';
import { useChatSocket } from '../../hooks/useChatSocket';
import { CallOverlay } from '../../components/call/CallOverlay';

/**
 * Authenticated Application Shell Layout.
 * 
 * Enforces client-side session hydration and authentication guards.
 * Renders responsive 3-column / 2-column layout on desktop and fluid
 * full-screen view on mobile devices.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/route-groups
 */
export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isHydrated } = useAuthStore();

  const isChatThreadOpen =
    pathname.startsWith('/chat/') && pathname !== '/chat';
  const activeChatId = isChatThreadOpen ? pathname.replace('/chat/', '') : null;

  // Activate presence heartbeat and tab visibility syncing
  usePresence();

  // Maintain persistent real-time chat socket sync across entire app
  useChatSocket(activeChatId);

  // Client authentication guard
  React.useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isHydrated, isAuthenticated, router]);

  // Render initial loading spinner while hydrating persistent session from localStorage
  if (!isHydrated) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-foreground space-y-4">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Hydrating TalkChat session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Router redirect will fire
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background text-foreground">
      {/* 1. Desktop Left Navigation Rail (Hidden on mobile) */}
      <NavigationRail />

      {/* 2. Conversations List Sidebar (Hidden on mobile when chat thread is active) */}
      <div
        className={`h-full ${
          isChatThreadOpen ? 'hidden md:flex' : 'flex w-full md:w-auto'
        }`}
      >
        <ConversationSidebar />
      </div>

      {/* 3. Main Workspace / Chat Canvas Area */}
      <main
        className={`flex-1 h-full flex flex-col overflow-hidden bg-background ${
          !isChatThreadOpen ? 'hidden md:flex' : 'flex w-full'
        }`}
      >
        {children}
      </main>

      {/* 4. Mobile Fluid Bottom Navigation (Hidden when inside an active chat thread) */}
      {!isChatThreadOpen && <MobileNav />}

      {/* 5. WebRTC Audio & Video Call Overlay */}
      <CallOverlay />
    </div>
  );
}
