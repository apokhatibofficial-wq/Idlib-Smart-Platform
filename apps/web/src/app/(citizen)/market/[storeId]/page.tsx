'use client';

import { use } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api-client';
import { formatSyp } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import type { Order, StoreDetail } from '@/types/api';

export default function StoreDetailPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = use(params);
  const queryClient = useQueryClient();

  const { data: store, isLoading } = useQuery({
    queryKey: ['marketplace', 'stores', storeId],
    queryFn: () => api.get<StoreDetail>(`/marketplace/stores/${storeId}`),
  });

  const orderMutation = useMutation({
    mutationFn: (productId: string) => api.post<Order>('/marketplace/orders', { productId, quantity: 1 }),
    onSuccess: (order) => {
      toast.success(`تم إرسال طلبك #${order.displayId} إلى المتجر`);
      void queryClient.invalidateQueries({ queryKey: ['marketplace', 'orders', 'mine'] });
      void queryClient.invalidateQueries({ queryKey: ['chat'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiError ? error.message : 'تعذّر إرسال الطلب');
    },
  });

  if (isLoading || !store) {
    return (
      <div className="flex flex-col gap-3.5 px-4.5 pt-4 pb-8">
        <Skeleton className="h-28 rounded-[12px]" />
        <Skeleton className="h-20 rounded-[12px]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5 px-4.5 pt-4 pb-8">
      <Link href="/market" className="self-start text-[13px] font-bold text-ink">
        ← رجوع للأسواق
      </Link>
      <div className="flex h-27.5 items-center justify-center rounded-[12px] bg-gray-100 text-xs font-semibold text-gray-500">
        صورة المتجر
      </div>
      <h1 className="text-lg font-extrabold text-ink">{store.name}</h1>
      <p className="text-[12.5px] text-gray-500">
        {store.categoryLabel} · تقييم {store.ratingAvg}
      </p>

      <div className="mt-1 text-[14.5px] font-extrabold text-ink">المنتجات</div>
      <div className="flex flex-col gap-2.5">
        {store.products.length === 0 && (
          <p className="rounded-[12px] border border-gray-300 bg-white py-6 text-center text-[13px] text-gray-500">
            لا توجد منتجات مضافة بعد
          </p>
        )}
        {store.products.map((product) => (
          <div key={product.id} className="flex items-center gap-3 rounded-[12px] border border-gray-300 bg-white p-2.5">
            <div className="size-14 flex-none rounded-[8px] bg-gray-100" />
            <div className="flex-1">
              <div className="text-[13px] font-bold text-ink">{product.name}</div>
              <div className="mt-0.5 text-xs font-extrabold text-green-700">{formatSyp(product.price)}</div>
            </div>
            <button
              type="button"
              disabled={product.availability !== 'AVAILABLE' || orderMutation.isPending}
              onClick={() => orderMutation.mutate(product.id)}
              className="rounded-full bg-green-700 px-3.5 py-2 text-[11.5px] font-extrabold text-white disabled:opacity-50"
            >
              {product.availability === 'AVAILABLE' ? 'طلب' : 'غير متوفر'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
