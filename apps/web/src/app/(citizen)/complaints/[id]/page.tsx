'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { STATUS_STEPS, stepColor } from '@/lib/complaints-ui';
import { Skeleton } from '@/components/ui/skeleton';
import type { Complaint } from '@/types/api';

export default function ComplaintTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: complaint, isLoading } = useQuery({
    queryKey: ['complaints', id],
    queryFn: () => api.get<Complaint>(`/complaints/${id}`),
  });

  return (
    <div className="flex flex-col gap-3.5 px-4.5 pt-4 pb-8">
      <Link href="/complaints" className="self-start text-[13px] font-bold text-ink">
        ← رجوع
      </Link>

      {isLoading || !complaint ? (
        <>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-64 rounded-[14px]" />
        </>
      ) : (
        <>
          <h1 className="text-lg font-extrabold text-ink">بلاغ #{complaint.displayId}</h1>
          <p className="text-[13px] text-gray-500">{complaint.categoryLabel}</p>

          <div className="rounded-[14px] border border-gray-300 bg-white px-4 py-5">
            {STATUS_STEPS.map((step, i) => (
              <div key={step.key} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <span className="size-3.5 rounded-full" style={{ background: stepColor(i, complaint.status) }} />
                  {i < STATUS_STEPS.length - 1 && <span className="min-h-8.5 w-0.5 flex-1 bg-gray-300" />}
                </div>
                <div className={i < STATUS_STEPS.length - 1 ? 'pb-6.5' : ''}>
                  <div className="text-[13.5px] font-bold text-ink">{step.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[12px] bg-green-100 px-3.5 py-3 text-xs leading-7 text-green-900">
            سيصلك إشعار فوري عند كل تحديث لحالة هذا البلاغ.
          </div>

          {complaint.description && (
            <div className="rounded-[12px] border border-gray-300 bg-white px-3.5 py-3">
              <div className="mb-1 text-[11px] font-bold text-gray-500">وصف البلاغ</div>
              <div className="text-[13px] leading-6 text-ink">{complaint.description}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
