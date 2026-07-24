'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api-client';
import { homePathForRole } from '@/lib/routes';
import { AUTH_QUERY_KEY } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import type { CurrentUser } from '@/types/api';

const RESEND_COOLDOWN_SECONDS = 60;

function OtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const email = searchParams.get('email') ?? '';

  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const verifyMutation = useMutation({
    mutationFn: (code: string) => api.post<{ user: CurrentUser }>('/auth/verify-otp', { email, code }),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, user);
      router.replace(homePathForRole(user.role));
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiError ? error.message : 'رمز التحقق غير صحيح');
      setDigits(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => api.post('/auth/resend-otp', { email }),
    onSuccess: () => {
      toast.success('تم إرسال رمز جديد');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiError ? error.message : 'تعذّر إعادة الإرسال');
    },
  });

  function setDigit(index: number, value: string) {
    const clean = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);

    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (next.every((d) => d) && next.join('').length === 6) {
      verifyMutation.mutate(next.join(''));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 px-6 py-9 text-center">
      <div className="flex size-14 items-center justify-center rounded-full border-[1.5px] border-gold text-[13px] font-extrabold tracking-wide text-gold-deep">
        OTP
      </div>
      <h1 className="text-xl font-extrabold text-ink">رمز التحقق</h1>
      <p className="text-[13px] leading-7 text-gray-500">
        تم إرسال رمز تحقق مكوّن من 6 أرقام إلى بريدك الإلكتروني
        <br />
        {email || 'example@mail.com'}
      </p>

      <div className="flex gap-2" dir="ltr">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            value={digit}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            inputMode="numeric"
            maxLength={1}
            className="h-13 w-11 rounded-[10px] border-[1.5px] border-gray-300 text-center text-xl font-extrabold text-ink outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15"
          />
        ))}
      </div>

      <Button
        onClick={() => verifyMutation.mutate(digits.join(''))}
        disabled={verifyMutation.isPending || digits.some((d) => !d)}
        className="h-auto w-full rounded-[12px] py-3.5 text-[15px] font-extrabold"
      >
        {verifyMutation.isPending ? 'جارٍ التحقق...' : 'تأكيد وتفعيل الحساب'}
      </Button>

      <div className="text-[12.5px] text-gray-500">
        لم يصلك الرمز؟{' '}
        <button
          type="button"
          disabled={cooldown > 0 || resendMutation.isPending}
          onClick={() => resendMutation.mutate()}
          className="font-extrabold text-green-700 hover:text-green-900 disabled:cursor-not-allowed disabled:text-gray-500"
        >
          {cooldown > 0 ? `إعادة الإرسال (${cooldown})` : 'إعادة الإرسال'}
        </button>
      </div>
    </div>
  );
}

export default function OtpPage() {
  return (
    <Suspense>
      <OtpForm />
    </Suspense>
  );
}
