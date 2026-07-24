import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/server-auth';
import { homePathForRole } from '@/lib/routes';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

const NAV_ITEMS = [
  { href: '/merchant', label: 'نظرة عامة' },
  { href: '/merchant/profile', label: 'الملف التجاري' },
  { href: '/merchant/products', label: 'المنتجات' },
  { href: '/merchant/orders', label: 'الطلبات' },
  { href: '/merchant/coupons', label: 'الكوبونات' },
];

export default async function MerchantLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser();
  if (!user) redirect('/login');
  if (user.role !== 'MERCHANT') redirect(homePathForRole(user.role));

  return (
    <DashboardShell title="لوحة التاجر" sidebarClassName="bg-green-900" navItems={NAV_ITEMS}>
      {children}
    </DashboardShell>
  );
}
