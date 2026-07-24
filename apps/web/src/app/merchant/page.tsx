'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { formatSyp } from '@/lib/format';
import { StatCard } from '@/components/dashboard/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { MerchantOverview, WeeklyChartBucket } from '@/types/api';

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('ar-SY', { weekday: 'short' });

export default function MerchantOverviewPage() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['merchant', 'overview'],
    queryFn: () => api.get<MerchantOverview>('/merchant/overview'),
  });
  const { data: chart } = useQuery({
    queryKey: ['merchant', 'chart'],
    queryFn: () => api.get<WeeklyChartBucket[]>('/merchant/chart'),
  });

  const maxCount = Math.max(1, ...(chart?.map((b) => b.count) ?? [1]));

  if (isLoading || !overview) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-64" />
        <div className="grid grid-cols-4 gap-3.5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-[14px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-extrabold text-ink">نظرة عامة — {overview.storeName}</h1>

      <div className="grid grid-cols-4 gap-3.5">
        <StatCard label="عدد المنتجات" value={String(overview.productCount)} />
        <StatCard label="العملاء" value={String(overview.customerCount)} />
        <StatCard label="الطلبات" value={String(overview.orderCount)} />
        <StatCard label="المبيعات" value={formatSyp(overview.salesTotal)} valueClassName="text-[22px] text-green-700" />
      </div>

      <div className="flex h-40 gap-2.5 rounded-[14px] bg-white p-5">
        {chart?.map((bucket) => (
          <div key={bucket.date} className="flex flex-1 flex-col items-center justify-end gap-1.5">
            <div
              className="w-full rounded-t-[6px] bg-green-500"
              style={{ height: `${Math.max(4, (bucket.count / maxCount) * 110)}px` }}
              title={`${bucket.count} طلب`}
            />
            <span className="text-[10px] text-gray-500">{WEEKDAY_FORMATTER.format(new Date(bucket.date))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
