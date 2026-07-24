'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface DashboardNavItem {
  href: string;
  label: string;
}

export function DashboardShell({
  title,
  sidebarClassName,
  navItems,
  children,
}: {
  title: string;
  sidebarClassName: string;
  navItems: DashboardNavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh justify-center bg-gray-100 p-6">
      <div className="flex w-full max-w-[1180px] overflow-hidden rounded-[18px] bg-white shadow-xl">
        <aside className={cn('flex w-[230px] flex-none flex-col gap-1.5 p-6', sidebarClassName)}>
          <div className="mb-5 flex items-center gap-2.5">
            <Image src="/images/logo-fazaa.png" alt="" width={30} height={30} className="object-contain" />
            <div className="text-sm font-extrabold text-white">{title}</div>
          </div>
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-[10px] px-3.5 py-2.5 text-right text-[13px] font-bold text-white/[.72] transition-colors',
                  active && 'bg-white/[.12] text-white',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </aside>
        <div className="flex-1 overflow-y-auto bg-gray-100 p-8">{children}</div>
      </div>
    </div>
  );
}
