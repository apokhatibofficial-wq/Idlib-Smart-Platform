'use client';

import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { api } from './api-client';

const WS_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN ?? 'http://localhost:4000';

/** Joins a single conversation's realtime room and invokes onMessage for each new message. */
export function useChatSocket(conversationId: string, onMessage: (message: unknown) => void) {
  const socketRef = useRef<Socket | null>(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  });

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      const { ticket } = await api.get<{ ticket: string }>('/chat/ws-ticket');
      if (cancelled) return;

      const socket = io(`${WS_ORIGIN}/ws/chat`, { auth: { ticket }, transports: ['websocket'] });
      socketRef.current = socket;

      socket.on('connect', () => socket.emit('join', { conversationId }));
      socket.on('message', (message: unknown) => onMessageRef.current(message));
    }

    void connect();
    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [conversationId]);
}
