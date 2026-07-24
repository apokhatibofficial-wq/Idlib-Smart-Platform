'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api-client';
import { STATUS_STEPS } from '@/lib/complaints-ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { Complaint, ComplaintStatus } from '@/types/api';

export default function AdminComplaintsPage() {
  const queryClient = useQueryClient();
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
        {complaints?.map((c) => (
          <div key={c.id} className="flex items-center justify-between border-b border-gray-100 px-4.5 py-3.5 last:border-0">
            <div>
              <div className="text-[13.5px] font-bold">
                بلاغ #{c.displayId} — {c.categoryLabel}
              </div>
              <div className="text-[11.5px] text-gray-500">{c.statusLabel}</div>
            </div>
            <Select
              value={c.status}
              onValueChange={(value) => statusMutation.mutate({ id: c.id, status: value as ComplaintStatus })}
            >
              <SelectTrigger className="h-9 w-40 text-xs">
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
          </div>
        ))}
      </div>
    </div>
  );
}
