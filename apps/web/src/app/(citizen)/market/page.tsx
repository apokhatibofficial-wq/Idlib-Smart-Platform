'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { MarketCategoryOption, Store } from '@/types/api';

export default function MarketPage() {
  const [category, setCategory] = useState('all');

  const { data: categories } = useQuery({
    queryKey: ['marketplace', 'categories'],
    queryFn: () => api.get<MarketCategoryOption[]>('/marketplace/categories'),
  });
  const { data: stores, isLoading } = useQuery({
    queryKey: ['marketplace', 'stores', category],
    queryFn: () => api.get<Store[]>(`/marketplace/stores?category=${category}`),
  });

  return (
    <div className="flex flex-col gap-3.5 px-4.5 pt-4 pb-8">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {categories?.map((c) => {
          const active = category === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c.key)}
              className={cn(
                'flex-none rounded-full border-[1.5px] px-4 py-2 text-[12.5px] font-bold',
                active ? 'border-green-700 bg-green-700 text-white' : 'border-gray-300 bg-white text-gray-700',
              )}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {isLoading && [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-[12px]" />)}
        {stores?.length === 0 && (
          <p className="col-span-2 rounded-[12px] border border-gray-300 bg-white py-6 text-center text-[13px] text-gray-500">
            لا توجد متاجر في هذا التصنيف حاليًا
          </p>
        )}
        {stores?.map((store) => (
          <Link
            key={store.id}
            href={`/market/${store.id}`}
            className="flex flex-col overflow-hidden rounded-[12px] border border-gray-300 bg-white text-right"
          >
            <div className="flex h-18.5 items-center justify-center bg-gray-100 text-[11px] font-semibold text-gray-500">
              صورة المتجر
            </div>
            <div className="flex flex-col gap-1 px-3 py-2.5">
              <div className="text-[13px] font-extrabold text-ink">{store.name}</div>
              <div className="text-[10.5px] text-gray-500">
                {store.categoryLabel} · تقييم {store.ratingAvg}
              </div>
              {store.deliveryAvailable && (
                <span className="self-start rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-extrabold text-green-700">
                  توصيل متاح
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
