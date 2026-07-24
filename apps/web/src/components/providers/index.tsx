'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { QueryProvider } from './query-provider';
import { AuthProvider } from './auth-provider';
import type { CurrentUser } from '@/types/api';

export function Providers({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: CurrentUser | null;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryProvider>
        <AuthProvider initialUser={initialUser}>
          {children}
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
