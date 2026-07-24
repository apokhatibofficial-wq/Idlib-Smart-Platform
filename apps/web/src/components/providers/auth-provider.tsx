'use client';

import { createContext, use, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { CurrentUser } from '@/types/api';

export const AUTH_QUERY_KEY = ['auth', 'me'] as const;

interface AuthContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  clear: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: CurrentUser | null;
}) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: () => api.get<CurrentUser>('/users/me'),
    initialData: initialUser ?? undefined,
    staleTime: 60_000,
    retry: false,
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user: data ?? null,
      isLoading,
      refresh: async () => {
        await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      },
      clear: () => {
        queryClient.setQueryData(AUTH_QUERY_KEY, null);
      },
    }),
    [data, isLoading, queryClient],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
