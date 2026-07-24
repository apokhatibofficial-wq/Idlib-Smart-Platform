'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useAssistantOverlay } from './assistant-context';

interface AssistantMessage {
  from: 'bot' | 'me';
  text: string;
}

const GREETING: AssistantMessage = {
  from: 'bot',
  text: 'مرحبًا بك في المساعد الذكي لمنصة إدلب الذكية. اسألني عن أي شيء يخص محافظة إدلب.',
};

export function AssistantOverlay() {
  const { isOpen, close } = useAssistantOverlay();
  const [messages, setMessages] = useState<AssistantMessage[]>([GREETING]);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: suggestions = [] } = useQuery({
    queryKey: ['assistant', 'suggestions'],
    queryFn: () => api.get<string[]>('/assistant/suggestions'),
    staleTime: Infinity,
  });

  const askMutation = useMutation({
    mutationFn: (question: string) => api.post<{ answer: string }>('/assistant/ask', { question }),
    onSuccess: ({ answer }) => setMessages((prev) => [...prev, { from: 'bot', text: answer }]),
  });

  function ask(question: string) {
    if (!question.trim() || askMutation.isPending) return;
    setMessages((prev) => [...prev, { from: 'me', text: question }]);
    setDraft('');
    askMutation.mutate(question);
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-20 flex flex-col bg-cream"
        >
          <div className="flex items-center gap-2.5 border-b border-gray-100 bg-green-700 px-4.5 py-3.5">
            <button type="button" onClick={close} className="text-[13px] font-bold text-white">
              إغلاق
            </button>
            <div className="text-[14.5px] font-extrabold text-white">المساعد الذكي لإدلب</div>
          </div>

          <div ref={scrollRef} className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[82%] rounded-[14px] px-3.5 py-2.5 text-[13px] leading-6 ${
                  m.from === 'me' ? 'self-end bg-green-700 text-white' : 'self-start bg-white text-ink'
                }`}
              >
                {m.text}
              </div>
            ))}
            {askMutation.isPending && (
              <div className="self-start rounded-[14px] bg-white px-3.5 py-2.5 text-[13px] text-gray-500">...يكتب</div>
            )}
          </div>

          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 pb-2.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  className="rounded-full border-[1.5px] border-green-100 bg-white px-3 py-1.5 text-[11.5px] font-bold text-green-900"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(draft);
            }}
            className="flex gap-2 border-t border-gray-100 bg-white px-3.5 py-2.5"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="اسأل عن أي شيء يخص إدلب..."
              className="flex-1 rounded-full border-[1.5px] border-gray-300 px-3.5 py-2.5 text-[13px] outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={askMutation.isPending}
              className="h-[42px] rounded-full bg-green-900 px-5 text-[12.5px] font-bold text-white disabled:opacity-60"
            >
              إرسال
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
