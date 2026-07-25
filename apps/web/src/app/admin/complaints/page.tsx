'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api-client';
import { PRIORITY_OPTIONS, STATUS_STEPS } from '@/lib/complaints-ui';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { Complaint, ComplaintStatus } from '@/types/api';

function priorityColor(priority: Complaint['priority']): string {
  return PRIORITY_OPTIONS.find((p) => p.key === priority)?.color ?? '#6b7280';
}

function ComplaintDetails({ complaint }: { complaint: Complaint }) {
  return (
    <div className="flex flex-col gap-3.5 border-t border-gray-100 bg-gray-50 px-4.5 py-4">
      <div className="grid grid-cols-2 gap-3 text-[12.5px]">
        <div>
          <div className="mb-0.5 font-bold text-gray-500">مقدّم البلاغ</div>
          <div className="text-ink">{complaint.citizen?.fullName ?? '—'}</div>
          {complaint.citizen?.username && (
            <div className="text-gray-500" dir="ltr">
              @{complaint.citizen.username}
            </div>
          )}
          <div className="text-gray-500" dir="ltr">
            {complaint.citizen?.email ?? ''}
          </div>
          {complaint.citizen?.phone && (
            <div className="text-gray-500" dir="ltr">
              {complaint.citizen.phone}
            </div>
          )}
        </div>
        <div>
          <div className="mb-0.5 font-bold text-gray-500">الموقع</div>
          <div className="text-ink">{complaint.locationLabel ?? 'غير محدد'}</div>
        </div>
      </div>

      <div>
        <div className="mb-0.5 text-[12.5px] font-bold text-gray-500">وصف البلاغ</div>
        <p className="whitespace-pre-wrap text-[13px] leading-6 text-ink">{complaint.description}</p>
      </div>

      {complaint.category === 'BRIBERY' && (complaint.employeeName || complaint.witness1 || complaint.witness2) && (
        <div className="flex flex-col gap-1 rounded-[10px] border border-red-100 bg-red-50 px-3.5 py-3 text-[12.5px]">
          <div className="mb-0.5 font-extrabold text-red-700">بيانات بلاغ الرشوة (سرّية)</div>
          {complaint.employeeName && <div>الموظف: {complaint.employeeName}</div>}
          {complaint.witness1 && <div>الشاهد الأول: {complaint.witness1}</div>}
          {complaint.witness2 && <div>الشاهد الثاني: {complaint.witness2}</div>}
        </div>
      )}

      {complaint.attachments.length > 0 && (
        <div>
          <div className="mb-1.5 text-[12.5px] font-bold text-gray-500">المرفقات ({complaint.attachments.length})</div>
          <div className="flex flex-wrap gap-2.5">
            {complaint.attachments.map((a) =>
              a.kind === 'VIDEO' ? (
                <video key={a.id} src={a.url} controls className="h-32 w-44 rounded-[10px] bg-black object-cover" />
              ) : (
                <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element -- external/uploaded runtime path, not a build-time optimizable asset */}
                  <img
                    src={a.url}
                    alt="مرفق البلاغ"
                    className="h-32 w-32 rounded-[10px] border border-gray-300 object-cover"
                  />
                </a>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminComplaintsPage() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data: complaints, isLoading } = useQuery({
    queryKey: ['admin', 'complaints'],
    queryFn: () => api.get<Complaint[]>('/complaints'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ComplaintStatus }) =>
      api.patch(`/complaints/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('تم تحديث حالة البلاغ');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'complaints'] });
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'تعذّر التحديث'),
  });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-extrabold text-ink">إدارة البلاغات</h1>
      <div className="overflow-hidden rounded-[14px] bg-white">
        {isLoading && (
          <div className="flex flex-col gap-px p-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        )}
        {complaints?.map((c) => {
          const expanded = expandedId === c.id;
          return (
            <div key={c.id} className="border-b border-gray-100 last:border-0">
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : c.id)}
                className="flex w-full items-center justify-between gap-3 px-4.5 py-3.5 text-right hover:bg-gray-50"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: priorityColor(c.priority) }}
                    title={c.priorityLabel}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[13.5px] font-bold">
                      بلاغ #{c.displayId} — {c.categoryLabel}
                      {c.attachments.length > 0 && (
                        <span className="text-[10.5px] font-bold text-green-700">📎 {c.attachments.length}</span>
                      )}
                    </div>
                    <div className="truncate text-[11.5px] text-gray-500">
                      {c.citizen?.fullName} · {c.statusLabel}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2.5">
                  <Select
                    value={c.status}
                    onValueChange={(value) => statusMutation.mutate({ id: c.id, status: value as ComplaintStatus })}
                  >
                    <SelectTrigger onClick={(e) => e.stopPropagation()} className="h-9 w-40 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_STEPS.map((step) => (
                        <SelectItem key={step.key} value={step.key}>
                          {step.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className={cn('text-gray-400 transition-transform', expanded && 'rotate-180')}>▾</span>
                </div>
              </button>
              {expanded && <ComplaintDetails complaint={c} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
