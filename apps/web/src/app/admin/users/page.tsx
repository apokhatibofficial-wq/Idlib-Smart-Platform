'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { AdminUser, Role } from '@/types/api';

const ROLE_LABEL: Record<Role, string> = { CITIZEN: 'مواطن', MERCHANT: 'تاجر', ADMIN: 'مشرف' };

export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get<AdminUser[]>('/admin/users'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/admin/users/${id}/status`, { isActive }),
    onSuccess: (_data, variables) => {
      toast.success(variables.isActive ? 'تم تفعيل الحساب' : 'تم تعطيل الحساب');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'تعذّر تنفيذ الإجراء'),
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
        {users?.map((u) => {
          const isSelf = u.id === currentAdmin?.id;
          return (
            <div key={u.id} className="flex items-center justify-between border-b border-gray-100 px-4.5 py-3.5 last:border-0">
              <div>
                <div className="text-[13.5px] font-bold">{u.fullName}</div>
                <div className="text-[11.5px] text-gray-500">{u.email}</div>
              </div>
              <div className="flex items-center gap-2.5">
                {!u.isActive && (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-[11px] font-extrabold text-red-600">معطّل</span>
                )}
                <span className="rounded-full bg-green-100 px-3 py-1 text-[11px] font-extrabold text-green-700">
                  {ROLE_LABEL[u.role]}
                </span>
                <button
                  type="button"
                  disabled={isSelf || statusMutation.isPending}
                  title={isSelf ? 'لا يمكنك تعطيل حسابك الخاص' : undefined}
                  onClick={() => statusMutation.mutate({ id: u.id, isActive: !u.isActive })}
                  className={cn(
                    'rounded-[8px] border-[1.5px] px-3 py-1.5 text-[11.5px] font-extrabold disabled:cursor-not-allowed disabled:opacity-40',
                    u.isActive ? 'border-red-100 text-red-600 hover:bg-red-100' : 'border-green-700 text-green-700 hover:bg-green-100',
                  )}
                >
                  {u.isActive ? 'تعطيل' : 'تفعيل'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
