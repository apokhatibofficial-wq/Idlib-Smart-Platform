'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useChatSocket } from '@/lib/use-chat-socket';
import { Skeleton } from '@/components/ui/skeleton';
import type { ChatMessage, ChatThread } from '@/types/api';

export default function ChatThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const queryKey = ['chat', id];
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: thread, isLoading } = useQuery({
    queryKey,
    queryFn: () => api.get<ChatThread>(`/chat/${id}`),
  });

  useChatSocket(id, (incoming) => {
    const message = incoming as ChatMessage;
    queryClient.setQueryData<ChatThread | undefined>(queryKey, (old) => {
      if (!old) return old;
      if (old.messages.some((m) => m.id === message.id)) return old;
      return { ...old, messages: [...old.messages, { ...message, mine: false }] };
    });
  });

  const sendMutation = useMutation({
    mutationFn: (body: string) => api.post<ChatMessage>(`/chat/${id}/messages`, { body }),
    onSuccess: (message) => {
      queryClient.setQueryData<ChatThread | undefined>(queryKey, (old) => {
        if (!old) return old;
        if (old.messages.some((m) => m.id === message.id)) return old;
        return { ...old, messages: [...old.messages, message] };
      });
      void queryClient.invalidateQueries({ queryKey: ['chat'] });
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [thread?.messages.length]);

  function handleSend() {
    if (!draft.trim() || sendMutation.isPending) return;
    sendMutation.mutate(draft);
    setDraft('');
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-none items-center gap-2.5 border-b border-gray-100 px-4.5 py-2.5">
        <Link href="/chat" className="text-[13px] font-bold text-ink">
          ←
        </Link>
        <div className="text-sm font-extrabold text-ink">{thread?.name ?? '...'}</div>
      </div>

      <div ref={scrollRef} className="flex flex-1 flex-col gap-2.5 overflow-y-auto bg-gray-100 p-4">
        {isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-2/3 rounded-[14px]" />)}
        {thread?.messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[75%] rounded-[14px] px-3.5 py-2.5 text-[13px] leading-6 ${
              m.mine && !m.system ? 'self-end bg-green-700 text-white' : 'self-start bg-white text-ink'
            }`}
          >
            {m.body}
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex flex-none gap-2 border-t border-gray-100 bg-white px-3.5 py-2.5"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="اكتب رسالة..."
          className="flex-1 rounded-full border-[1.5px] border-gray-300 px-3.5 py-2.5 text-[13px] outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={sendMutation.isPending}
          className="h-[42px] rounded-full bg-green-900 px-5 text-[12.5px] font-bold text-white disabled:opacity-60"
        >
          إرسال
        </button>
      </form>
    </div>
  );
}
