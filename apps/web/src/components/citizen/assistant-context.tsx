'use client';

import { createContext, use, useCallback, useMemo, useState } from 'react';

interface AssistantContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);

  return <AssistantContext value={value}>{children}</AssistantContext>;
}

export function useAssistantOverlay(): AssistantContextValue {
  const ctx = use(AssistantContext);
  if (!ctx) throw new Error('useAssistantOverlay must be used within <AssistantProvider>');
  return ctx;
}
