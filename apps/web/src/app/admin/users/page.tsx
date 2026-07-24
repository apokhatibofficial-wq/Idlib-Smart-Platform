'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import type { AdminUser, Role } from '@/types/api';

const ROLE_LABEL: Record<Role, string> = { CITIZEN: 'مواطن', MERCHANT: 'تاجر', ADMIN: 'مشرف' };

export default function AdminUsersPage() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get<AdminUser[]>('/admin/users'),
  });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-extrabold text-ink">المستخدمون</h1>
      <div className="overflow-hidden rounded-[14px] bg-white">
        {isLoading && (
          <div className="flex flex-col gap-px p-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        )}
        {users?.map((u) => (
          <div key={u.id} className="flex items-center justify-between border-b border-gray-100 px-4.5 py-3.5 last:border-0">
            <div>
              <div className="text-[13.5px] font-bold">{u.fullName}</div>
              <div className="text-[11.5px] text-gray-500">{u.email}</div>
            </div>
            <span className="rounded-full bg-green-100 px-3 py-1 text-[11px] font-extrabold text-green-700">
              {ROLE_LABEL[u.role]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
