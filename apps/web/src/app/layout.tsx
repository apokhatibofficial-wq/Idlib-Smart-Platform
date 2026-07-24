import type { Metadata, Viewport } from 'next';
import { tahrir } from '@/lib/fonts';
import { getServerUser } from '@/lib/server-auth';
import { Providers } from '@/components/providers';
import { ServiceWorkerRegistrar } from '@/components/pwa/service-worker-registrar';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'منصة إدلب الذكية',
    template: '%s — منصة إدلب الذكية',
  },
  description: 'خدمات محافظة إدلب بين يديك — شكاوى وبلاغات، أسواق محلية، محادثات، ومساعد ذكي.',
  applicationName: 'منصة إدلب الذكية',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'إدلب الذكية',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  formatDetection: { telephone: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#25502c',
  colorScheme: 'light',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser();

  return (
    <html lang="ar" dir="rtl" className={`${tahrir.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-cream text-ink">
        <Providers initialUser={user}>{children}</Providers>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
