'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { formatRelativeTime, initialOf } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import type { ChatListItem } from '@/types/api';

export default function ChatListPage() {
  const { data: chats, isLoading } = useQuery({
    queryKey: ['chat'],
    queryFn: () => api.get<ChatListItem[]>('/chat'),
    refetchInterval: 15_000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 rounded-[10px]" />
        ))}
      </div>
    );
  }

  if (!chats?.length) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
        <p className="text-sm text-gray-500">لا توجد محادثات بعد</p>
        <p className="text-xs text-gray-500">تبدأ المحادثات تلقائيًا عند تقديم بلاغ أو طلب من متجر</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {chats.map((chat) => (
        <Link
          key={chat.id}
          href={`/chat/${chat.id}`}
          className="flex items-center gap-3 border-b border-gray-100 bg-white px-4.5 py-3.5"
        >
          <div className="flex size-11 flex-none items-center justify-center rounded-full bg-green-900 text-[15px] font-bold text-white">
            {initialOf(chat.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex justify-between gap-2">
              <span className="truncate text-[13.5px] font-extrabold text-ink">{chat.name}</span>
              <span className="flex-none text-[11px] text-gray-500">{formatRelativeTime(chat.time)}</span>
            </div>
            <div className="mt-0.5 truncate text-xs text-gray-500">{chat.last}</div>
          </div>
          {chat.unread > 0 && (
            <span className="flex size-5 flex-none items-center justify-center rounded-full bg-green-700 text-[10.5px] font-extrabold text-white">
              {chat.unread}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
