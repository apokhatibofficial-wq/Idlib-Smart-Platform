'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { formatSyp } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import type { Order } from '@/types/api';

const STATUS_BADGE: Record<Order['status'], string> = {
  NEW: 'bg-[#fbe9e8] text-[#8f1d21]',
  PREPARING: 'bg-[#fff9e8] text-[#6b5a17]',
  DELIVERED: 'bg-[#e7f2e6] text-[#2c5e33]',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default function MyOrdersPage() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['marketplace', 'orders', 'mine'],
    queryFn: () => api.get<Order[]>('/marketplace/orders/mine'),
  });

  return (
    <div className="flex flex-col gap-3.5 px-4.5 pt-4 pb-8">
      <Link href="/profile" className="self-start text-[13px] font-bold text-ink">
        ← رجوع
      </Link>
      <h1 className="text-lg font-extrabold text-ink">طلباتي</h1>

      <div className="flex flex-col gap-2.5">
        {isLoading && [0, 1].map((i) => <Skeleton key={i} className="h-16 rounded-[12px]" />)}
        {orders?.length === 0 && (
          <p className="rounded-[12px] border border-gray-300 bg-white py-8 text-center text-[13px] text-gray-500">
            لا توجد طلبات بعد
          </p>
        )}
        {orders?.map((order) => (
          <div key={order.id} className="flex items-center justify-between rounded-[12px] border border-gray-300 bg-white px-3.5 py-3">
            <div>
              <div className="text-[13px] font-bold text-ink">
                طلب #{order.displayId} — {order.productName}
              </div>
              <div className="mt-0.5 text-[11.5px] text-gray-500">
                {order.storeName} · {formatSyp(order.price)}
              </div>
            </div>
            <span className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${STATUS_BADGE[order.status]}`}>
              {order.statusLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
