'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'motion/react';
import { useAuth } from '@/components/providers/auth-provider';
import { homePathForRole } from '@/lib/routes';

type Phase = 0 | 1 | 2 | 3 | 4;

export default function SplashPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [phase, setPhase] = useState<Phase>(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 80),
      setTimeout(() => setPhase(2), 1900),
      setTimeout(() => setPhase(3), 2350),
      setTimeout(() => setPhase(4), 3300),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase !== 4) return;
    const navigateTimer = setTimeout(() => {
      if (isLoading) return;
      router.replace(user ? homePathForRole(user.role) : '/login');
    }, 450);
    return () => clearTimeout(navigateTimer);
  }, [phase, isLoading, user, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-cream">
      <motion.div
        className="flex flex-col items-center gap-6"
        animate={{ opacity: phase >= 4 ? 0 : 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <motion.div
          initial={{ x: '140%', opacity: 0 }}
          animate={{
            x: 0,
            y: phase >= 2 ? -14 : 0,
            opacity: phase === 0 ? 0 : 1,
          }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <Image src="/images/logo-fazaa.png" alt="شعار فزعة" width={150} height={150} priority className="size-[150px] object-contain" />
        </motion.div>

        <motion.div
          className="text-center"
          animate={{ opacity: phase >= 3 ? 1 : 0, y: phase >= 3 ? 0 : 12 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="text-[26px] font-extrabold tracking-wide text-green-900">منصة إدلب الذكية</div>
          <div className="mt-1.5 text-[12.5px] font-medium text-gray-500">خدمات المحافظة بين يديك</div>
        </motion.div>
      </motion.div>
    </div>
  );
}
