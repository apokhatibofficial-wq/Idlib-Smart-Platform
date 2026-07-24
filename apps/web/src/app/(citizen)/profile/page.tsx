'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { initialOf } from '@/lib/format';
import { useAuth } from '@/components/providers/auth-provider';
import { Avatar } from '@/components/ui/avatar';
import { ChangePasswordDialog } from '@/components/citizen/change-password-dialog';

const MENU_ITEMS = [
  { label: 'تعديل البيانات', href: '/profile/edit' },
  { label: 'تغيير كلمة المرور', href: null },
  { label: 'شكاواي', href: '/complaints' },
  { label: 'محادثاتي', href: '/chat' },
  { label: 'طلباتي', href: '/profile/orders' },
] as const;

export default function ProfilePage() {
  const { user, clear } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const logoutMutation = useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => {
      clear();
      queryClient.clear();
      router.replace('/');
    },
  });

  if (!user) return null;

  return (
    <div className="flex flex-col gap-4 px-4.5 pt-5 pb-8">
      <div className="flex flex-col items-center gap-2">
        <Avatar initial={initialOf(user.fullName)} size="lg" />
        <div className="text-[17px] font-extrabold text-ink">{user.fullName}</div>
        <div className="text-[12.5px] text-gray-500">@{user.username}</div>
      </div>

      <div className="flex flex-col divide-y divide-gray-300 overflow-hidden rounded-[14px] border border-gray-300 bg-white">
        {MENU_ITEMS.map((item) =>
          item.href ? (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-between px-4 py-3.5 text-[13.5px] font-bold text-ink"
            >
              {item.label} <span>›</span>
            </Link>
          ) : (
            <button
              key={item.label}
              type="button"
              onClick={() => setPasswordDialogOpen(true)}
              className="flex items-center justify-between px-4 py-3.5 text-right text-[13.5px] font-bold text-ink"
            >
              {item.label} <span>›</span>
            </button>
          ),
        )}
      </div>

      <Link
        href="/profile/business"
        className="rounded-[12px] bg-green-700 py-3.5 text-center text-[14.5px] font-extrabold text-white"
      >
        التحويل إلى حساب أعمال
      </Link>
      <button
        type="button"
        onClick={() => logoutMutation.mutate()}
        disabled={logoutMutation.isPending}
        className="rounded-[12px] border-[1.5px] border-red-100 bg-white py-3.5 text-[13.5px] font-extrabold text-red-600"
      >
        تسجيل الخروج
      </button>

      <ChangePasswordDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen} />
    </div>
  );
}
