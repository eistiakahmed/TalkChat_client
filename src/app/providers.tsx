'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useThemeStore } from '../stores/theme.store';
import { PWAInstallPrompt } from '../components/pwa/PWAInstallPrompt';
import { OfflineBanner } from '../components/pwa/OfflineBanner';

/**
 * TalkChat Root Client Providers.
 * 
 * Configures:
 * 1. TanStack React Query Client with cached stale-time policies.
 * 2. Theme synchronization on client mount (detects localStorage / OS system preference).
 * 3. Progressive Web App (PWA) install prompts and offline state banner.
 * 
 * @see https://tanstack.com/query/latest/docs/framework/react/overview
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes fresh cache
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const initTheme = useThemeStore((s) => s.initTheme);

  React.useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <QueryClientProvider client={queryClient}>
      <OfflineBanner />
      {children}
      <PWAInstallPrompt />
    </QueryClientProvider>
  );
}
