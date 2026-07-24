'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAssistantOverlay } from '@/components/citizen/assistant-context';
import { Skeleton } from '@/components/ui/skeleton';
import type { Alert, NewsItem } from '@/types/api';

export default function HomePage() {
  const { open: openAssistant } = useAssistantOverlay();

  const { data: news, isLoading: newsLoading } = useQuery({
    queryKey: ['news'],
    queryFn: () => api.get<NewsItem[]>('/news'),
  });
  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => api.get<Alert[]>('/alerts'),
  });

  const breakingNews = news?.[0] ? `عاجل: ${news[0].title}` : 'مرحبًا بك في منصة إدلب الذكية — تابع آخر الأخبار والخدمات هنا';

  return (
    <div className="flex flex-col gap-4 px-4.5 pt-4 pb-6">
      <div className="relative flex h-9.5 items-center overflow-hidden rounded-[12px] bg-red-700">
        <div className="z-10 flex h-full flex-none items-center bg-red-600 px-3 text-[11.5px] font-extrabold text-white">
          عاجل
        </div>
        <div className="animate-ticker pe-5 text-[12.5px] font-semibold whitespace-nowrap text-white">{breakingNews}</div>
      </div>

      <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-0.5">
        {alertsLoading && [0, 1].map((i) => <Skeleton key={i} className="h-20 w-[250px] flex-none rounded-[10px]" />)}
        {alerts?.map((alert) => (
          <div
            key={alert.id}
            className="w-[250px] flex-none rounded-[10px] border border-gray-300 border-e-[3px] border-e-gold bg-white p-3.5"
          >
            <div className="mb-1 text-[10.5px] font-extrabold tracking-wide text-gold-deep">تنويه</div>
            <div className="text-[12.5px] leading-6 font-medium text-gray-700">{alert.text}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <Link
          href="/complaints"
          className="rounded-[10px] border border-gray-300 bg-white px-1 py-3.5 text-center text-xs font-bold text-ink"
        >
          بلاغ جديد
        </Link>
        <Link
          href="/market"
          className="rounded-[10px] border border-gray-300 bg-white px-1 py-3.5 text-center text-xs font-bold text-ink"
        >
          الأسواق
        </Link>
        <button
          type="button"
          onClick={openAssistant}
          className="rounded-[10px] border border-gray-300 bg-white px-1 py-3.5 text-center text-xs font-bold text-ink"
        >
          المساعد الذكي
        </button>
      </div>

      <div className="mt-1 text-[15px] font-extrabold text-ink">أخبار المحافظة</div>
      <div className="flex flex-col gap-4">
        {newsLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-[180px] rounded-[14px]" />)}
        {news?.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-[14px] border border-gray-300 bg-white">
            <div className="flex h-[110px] items-center justify-center bg-gradient-to-br from-green-100 to-gray-100 text-[11px] text-gray-500">
              صورة الخبر
            </div>
            <div className="flex flex-col gap-1.5 px-3.5 py-3">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[10.5px] font-extrabold text-green-700">
                  {item.tag}
                </span>
                <span className="text-[11px] text-gray-500">{item.time}</span>
              </div>
              <div className="text-sm leading-6 font-bold text-ink">{item.title}</div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
