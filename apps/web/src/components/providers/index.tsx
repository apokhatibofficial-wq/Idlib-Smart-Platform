'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { QueryProvider } from './query-provider';
import { AuthProvider, useAuth } from './auth-provider';
import { OfflineQueueFlusher } from '@/components/pwa/offline-queue-flusher';
import type { CurrentUser } from '@/types/api';

function AuthedExtras() {
  const { user } = useAuth();
  return user ? <OfflineQueueFlusher /> : null;
}

export function Providers({
  children,
  initialUser,
  nonce,
}: {
  children: React.ReactNode;
  initialUser: CurrentUser | null;
  nonce?: string;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} nonce={nonce}>
      <QueryProvider>
        <AuthProvider initialUser={initialUser}>
          {children}
          <AuthedExtras />
          <Toaster
            position="top-center"
            dir="rtl"
            toastOptions={{
              style: {
                fontFamily: 'var(--font-tahrir)',
                background: 'var(--color-card)',
                color: 'var(--color-card-foreground)',
                border: '1px solid var(--color-border)',
              },
            }}
          />
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
