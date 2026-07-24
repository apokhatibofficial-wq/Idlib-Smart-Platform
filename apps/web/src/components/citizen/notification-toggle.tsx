'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushSubscriptionState,
  isPushSupported,
} from '@/lib/push-notifications';

export function NotificationToggle() {
  const [state, setState] = useState<'subscribed' | 'unsubscribed' | 'unsupported' | 'loading'>(() =>
    isPushSupported() ? 'loading' : 'unsupported',
  );

  useEffect(() => {
    if (!isPushSupported()) return;
    getPushSubscriptionState().then(setState).catch(() => setState('unsupported'));
  }, []);

  if (state === 'unsupported' || state === 'loading') return null;

  async function toggle() {
    try {
      if (state === 'subscribed') {
        await disablePushNotifications();
        setState('unsubscribed');
        toast.success('تم إيقاف الإشعارات');
      } else {
        await enablePushNotifications();
        setState('subscribed');
        toast.success('تم تفعيل الإشعارات');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذّر تنفيذ الطلب');
    }
  }

  return (
    <button type="button" onClick={toggle} className="text-[12.5px] font-bold text-green-700 hover:text-green-900">
      {state === 'subscribed' ? 'إيقاف إشعارات الجوّال' : 'تفعيل إشعارات الجوّال'}
    </button>
  );
}
