import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/server-auth';
import { homePathForRole } from '@/lib/routes';
import { AppShell } from '@/components/citizen/app-shell';

export default async function CitizenLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser();
  if (!user) redirect('/login');
  if (user.role !== 'CITIZEN') redirect(homePathForRole(user.role));

  return <AppShell>{children}</AppShell>;
}
