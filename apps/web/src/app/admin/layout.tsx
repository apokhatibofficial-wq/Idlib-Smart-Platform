import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/server-auth';
import { homePathForRole } from '@/lib/routes';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

const NAV_ITEMS = [
  { href: '/admin', label: 'نظرة عامة' },
  { href: '/admin/users', label: 'المستخدمون' },
  { href: '/admin/complaints', label: 'البلاغات' },
  { href: '/admin/business', label: 'الحسابات التجارية' },
  { href: '/admin/content', label: 'الأخبار والإعلانات' },
  { href: '/admin/logs', label: 'سجلات النظام والتدقيق' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser();
  if (!user) redirect('/login');
  if (user.role !== 'ADMIN') redirect(homePathForRole(user.role));

  return (
    <DashboardShell title="لوحة المشرف" sidebarClassName="bg-ink" navItems={NAV_ITEMS}>
      {children}
    </DashboardShell>
  );
}
