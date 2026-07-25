'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { AuditLogPage } from '@/types/api';

const ROLE_LABEL: Record<string, string> = { CITIZEN: 'مواطن', MERCHANT: 'تاجر', ADMIN: 'مشرف' };

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('ar-SY', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

export default function AdminLogsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'logs', page],
    queryFn: () => api.get<AuditLogPage>(`/admin/logs?page=${page}`),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-extrabold text-ink">سجلات النظام والتدقيق</h1>

      <div className="overflow-hidden rounded-[14px] bg-white">
        {isLoading && (
          <div className="flex flex-col gap-px p-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        )}

        {!isLoading && data?.items.length === 0 && (
          <div className="px-4.5 py-8 text-center text-[13px] text-gray-500">لا توجد سجلات بعد</div>
        )}

        {data?.items.map((entry) => (
          <div
            key={entry.id}
            className="flex flex-col gap-1 border-b border-gray-100 px-4.5 py-3.5 last:border-0"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] font-bold text-ink" dir="ltr">
                {entry.action}
              </span>
              <span className="shrink-0 text-[11px] text-gray-500">{formatDateTime(entry.createdAt)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-1.5 text-[11.5px] text-gray-500">
              <span>
                {entry.actor ? `${entry.actor.fullName} (${ROLE_LABEL[entry.actor.role] ?? entry.actor.role})` : 'النظام'}
              </span>
              {entry.targetType && (
                <span dir="ltr">
                  · {entry.targetType}
                  {entry.targetId ? `:${entry.targetId}` : ''}
                </span>
              )}
              {entry.ip && <span dir="ltr">· {entry.ip}</span>}
            </div>
          </div>
        ))}
      </div>

      {data && data.total > data.pageSize && (
        <div className="flex items-center justify-between px-1">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="h-auto rounded-[10px] px-4 py-2 text-[12.5px] font-bold"
          >
            السابق
          </Button>
          <span className="text-[12px] text-gray-500">
            صفحة {page} من {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="h-auto rounded-[10px] px-4 py-2 text-[12.5px] font-bold"
          >
            التالي
          </Button>
        </div>
      )}
    </div>
  );
}
