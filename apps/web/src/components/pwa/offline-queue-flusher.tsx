'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { getQueuedComplaints, removeQueuedComplaint } from '@/lib/offline-queue';

/**
 * Reliable, cross-browser fallback for the Background Sync API (which Safari/
 * iOS does not implement, and which cannot itself read the CSRF cookie — see
 * public/sw.js). Flushes anything queued while offline whenever the app has
 * an authenticated page context to send it from: on mount, when the browser
 * regains connectivity, and when the service worker signals a sync attempt.
 */
export function OfflineQueueFlusher() {
  const queryClient = useQueryClient();
  const flushingRef = useRef(false);

  useEffect(() => {
    async function flush() {
      if (flushingRef.current) return;
      flushingRef.current = true;
      try {
        const queued = await getQueuedComplaints();
        if (queued.length === 0) return;
        let sent = 0;
        for (const item of queued) {
          try {
            await api.post('/complaints', item.payload);
            await removeQueuedComplaint(item.id);
            sent++;
          } catch {
            break; // Still offline or a real error — stop and retry on the next trigger.
          }
        }
        if (sent > 0) {
          toast.success(sent === 1 ? 'تم إرسال بلاغ كان محفوظًا بلا اتصال' : `تم إرسال ${sent} بلاغات كانت محفوظة بلا اتصال`);
          void queryClient.invalidateQueries({ queryKey: ['complaints'] });
        }
      } finally {
        flushingRef.current = false;
      }
    }

    void flush();
    window.addEventListener('online', flush);
    navigator.serviceWorker?.addEventListener('message', (event: MessageEvent) => {
      if (event.data?.type === 'FLUSH_OFFLINE_QUEUE') void flush();
    });
    return () => window.removeEventListener('online', flush);
  }, [queryClient]);

  return null;
}
