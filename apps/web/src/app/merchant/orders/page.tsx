'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api-client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { MerchantOrder, OrderStatus } from '@/types/api';

const STATUS_BADGE: Record<OrderStatus, string> = {
  NEW: 'bg-[#fbe9e8] text-[#8f1d21]',
  PREPARING: 'bg-[#fff9e8] text-[#6b5a17]',
  DELIVERED: 'bg-[#e7f2e6] text-[#2c5e33]',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'NEW', label: 'جديد' },
  { value: 'PREPARING', label: 'قيد التحضير' },
  { value: 'DELIVERED', label: 'تم التوصيل' },
  { value: 'CANCELLED', label: 'ملغى' },
];

export default function MerchantOrdersPage() {
  const queryClient = useQueryClient();
  const { data: orders, isLoading } = useQuery({
    queryKey: ['merchant', 'orders'],
    queryFn: () => api.get<MerchantOrder[]>('/merchant/orders'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      api.patch(`/merchant/orders/${id}/status`, { status }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['merchant', 'orders'] }),
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'تعذّر تحديث الحالة'),
  });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-extrabold text-ink">الطلبات</h1>
      <div className="overflow-hidden rounded-[14px] bg-white">
        {isLoading && (
          <div className="flex flex-col gap-px p-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        )}
        {orders?.length === 0 && <p className="py-10 text-center text-sm text-gray-500">لا توجد طلبات بعد</p>}
        {orders?.map((order) => (
          <div key={order.id} className="flex items-center justify-between border-b border-gray-100 px-4.5 py-3.5 last:border-0">
            <div>
              <div className="text-[13.5px] font-bold">
                طلب #{order.displayId} — {order.product}
              </div>
              <div className="mt-0.5 text-[11.5px] text-gray-500">{order.customer}</div>
            </div>
            <Select
              value={order.status}
              onValueChange={(value) => statusMutation.mutate({ id: order.id, status: value as OrderStatus })}
            >
              <SelectTrigger className={`h-auto w-auto gap-1.5 rounded-full border-0 px-3 py-1.5 text-[11.5px] font-extrabold ${STATUS_BADGE[order.status]}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
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
