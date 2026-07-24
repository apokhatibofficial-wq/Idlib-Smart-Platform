'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { STATUS_COLORS } from '@/lib/complaints-ui';
import { Skeleton } from '@/components/ui/skeleton';
import type { Complaint, ComplaintCategoryOption } from '@/types/api';

const EMERGENCY_NUMBER = process.env.NEXT_PUBLIC_EMERGENCY_NUMBER ?? '5555';

export default function ComplaintsPage() {
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['complaints', 'categories'],
    queryFn: () => api.get<ComplaintCategoryOption[]>('/complaints/categories'),
  });
  const { data: myComplaints, isLoading: mineLoading } = useQuery({
    queryKey: ['complaints', 'mine'],
    queryFn: () => api.get<Complaint[]>('/complaints/mine'),
  });

  return (
    <div className="flex flex-col gap-4.5 px-4.5 pt-4 pb-7">
      <a
        href={`tel:${EMERGENCY_NUMBER}`}
        className="animate-emergency-pulse rounded-[14px] border border-gold bg-red-600 py-4.5 text-center text-[15.5px] font-extrabold tracking-wide text-white"
      >
        اتصال طوارئ فوري · {EMERGENCY_NUMBER}
      </a>

      <div className="text-[15px] font-extrabold text-ink">تقديم بلاغ جديد</div>
      <div className="grid grid-cols-2 gap-2.5">
        {categoriesLoading &&
          [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-[10px]" />)}
        {categories?.map((cat) => (
          <Link
            key={cat.key}
            href={`/complaints/new?category=${cat.key}`}
            className="rounded-[10px] border border-gray-300 border-e-[3px] border-e-red-600 bg-white px-3.5 py-4 text-right"
          >
            <span className="text-[13.5px] font-extrabold text-ink">{cat.label}</span>
          </Link>
        ))}
      </div>

      <div className="mt-1.5 text-[15px] font-extrabold text-ink">متابعة بلاغاتي</div>
      <div className="flex flex-col gap-2.5">
        {mineLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-[12px]" />)}
        {myComplaints?.length === 0 && (
          <p className="rounded-[12px] border border-gray-300 bg-white px-3.5 py-4 text-center text-[13px] text-gray-500">
            لا توجد بلاغات مقدَّمة بعد
          </p>
        )}
        {myComplaints?.map((c) => (
          <Link
            key={c.id}
            href={`/complaints/${c.id}`}
            className="flex items-center justify-between rounded-[12px] border border-gray-300 bg-white px-3.5 py-3"
          >
            <div>
              <div className="text-[13px] font-extrabold text-ink">
                بلاغ #{c.displayId} — {c.categoryLabel}
              </div>
              <div className="mt-0.5 text-[11.5px] text-gray-500">{c.statusLabel}</div>
            </div>
            <span className="size-2.5 rounded-full" style={{ background: STATUS_COLORS[c.status] }} />
          </Link>
        ))}
      </div>
    </div>
  );
}
