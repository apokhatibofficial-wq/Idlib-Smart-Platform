'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { StatCard } from '@/components/dashboard/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { AdminOverview } from '@/types/api';

export default function AdminOverviewPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () => api.get<AdminOverview>('/admin/overview'),
  });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-4 gap-3.5">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-[14px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-extrabold text-ink">نظرة عامة على المنصة</h1>
      <div className="grid grid-cols-4 gap-3.5">
        <StatCard label="المستخدمون" value={data.users.toLocaleString('ar-SY')} />
        <StatCard label="بلاغات مفتوحة" value={String(data.openComplaints)} valueClassName="text-red-600" />
        <StatCard label="حسابات قيد المراجعة" value={String(data.pendingBusinessAccounts)} valueClassName="text-gold" />
        <StatCard label="أخبار منشورة" value={String(data.publishedNews)} valueClassName="text-green-700" />
      </div>
    </div>
  );
}
