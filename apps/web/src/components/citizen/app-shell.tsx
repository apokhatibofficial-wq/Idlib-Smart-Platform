'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AssistantProvider, useAssistantOverlay } from './assistant-context';
import { AssistantOverlay } from './assistant-overlay';

const NAV_ITEMS = [
  { key: 'home', href: '/home', label: 'الرئيسية' },
  { key: 'market', href: '/market', label: 'الأسواق' },
  { key: 'complaints', href: '/complaints', label: 'الشكاوى' },
  { key: 'chat', href: '/chat', label: 'المحادثات' },
  { key: 'profile', href: '/profile', label: 'حسابي' },
] as const;

const HEADER_TITLES: Record<string, string> = {
  home: 'منصة إدلب الذكية',
  market: 'المتاجر والأسواق',
  complaints: 'الشكاوى والبلاغات',
  chat: 'المحادثات',
  profile: 'حسابي',
};

function activeTabFromPath(pathname: string): string {
  const segment = pathname.split('/')[1] ?? 'home';
  return HEADER_TITLES[segment] ? segment : 'home';
}

function AssistantFab() {
  const { open } = useAssistantOverlay();
  return (
    <button
      type="button"
      onClick={open}
      className="absolute bottom-[82px] left-4 z-10 rounded-full border border-gold bg-green-900 px-4.5 py-2.5 text-xs font-bold text-white shadow-lg"
    >
      المساعد الذكي
    </button>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tab = activeTabFromPath(pathname);
  const isComplaints = tab === 'complaints';

  return (
    <AssistantProvider>
      <div className="mx-auto flex h-dvh w-full max-w-[480px] flex-col bg-cream">
        <header
          className={cn(
            'flex flex-none items-center gap-2.5 border-b border-black/5 px-5 py-3.5',
            isComplaints ? 'bg-red-600' : 'bg-white',
          )}
        >
          {tab === 'home' && <Image src="/images/logo-fazaa.png" alt="" width={26} height={26} className="object-contain" />}
          <div className={cn('text-[17px] font-extrabold tracking-wide', isComplaints ? 'text-white' : 'text-ink')}>
            {HEADER_TITLES[tab]}
          </div>
        </header>

        <main className={cn('relative flex-1 overflow-hidden', isComplaints ? 'bg-red-100' : 'bg-cream')}>
          <div className="h-full overflow-y-auto">{children}</div>
          <AssistantFab />
          <AssistantOverlay />
        </main>

        <nav className="flex flex-none items-center justify-around border-t border-gray-100 bg-white px-1.5 py-2.5 pb-2.5">
          {NAV_ITEMS.map((item) => {
            const active = tab === item.key;
            const activeColor = item.key === 'complaints' ? 'text-red-600 border-red-600' : 'text-green-700 border-green-700';
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  'border-b-2 border-transparent px-2 py-1 text-[11.5px] font-bold text-gray-500',
                  active && activeColor,
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </AssistantProvider>
  );
}
