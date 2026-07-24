'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api-client';
import { homePathForRole } from '@/lib/routes';
import { loginSchema, type LoginInput } from '@/lib/validation/auth';
import { AUTH_QUERY_KEY } from '@/components/providers/auth-provider';
import { GoogleButton } from '@/components/auth/google-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { CurrentUser } from '@/types/api';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: (input: LoginInput) => api.post<{ user: CurrentUser }>('/auth/login', input),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, user);
      const next = searchParams.get('next');
      router.replace(next && next.startsWith('/') ? next : homePathForRole(user.role));
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.statusCode === 403) {
        toast.error(error.message);
        router.push(`/otp?email=${encodeURIComponent(form.getValues('email'))}`);
        return;
      }
      toast.error(error instanceof ApiError ? error.message : 'تعذّر تسجيل الدخول، حاول مرة أخرى');
    },
  });

  return (
    <div>
      <div className="relative h-[190px] overflow-hidden">
        <Image src="/images/idlib-illustration.png" alt="إدلب" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(23,58,28,0)] to-cream to-96%" />
      </div>

      <div className="relative -mt-8 flex flex-col gap-4 px-6 pb-8">
        <div className="flex items-center gap-2.5">
          <Image src="/images/logo-fazaa.png" alt="" width={38} height={38} className="object-contain" />
          <div className="text-[19px] font-extrabold text-green-900">منصة إدلب الذكية</div>
        </div>
        <h1 className="text-[22px] font-extrabold text-ink">تسجيل الدخول</h1>

        <GoogleButton />

        <div className="flex items-center gap-2.5 text-xs text-gray-500">
          <div className="h-px flex-1 bg-gray-300" />
          أو
          <div className="h-px flex-1 bg-gray-300" />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>البريد الإلكتروني</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="example@mail.com" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>كلمة المرور</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Link href="/forgot-password" className="self-start text-[12.5px] font-bold text-green-700 hover:text-green-900">
              نسيت كلمة المرور؟
            </Link>

            <Button type="submit" disabled={mutation.isPending} className="mt-1.5 h-auto rounded-[12px] py-3.5 text-[15px] font-extrabold">
              {mutation.isPending ? 'جارٍ الدخول...' : 'تسجيل الدخول'}
            </Button>
          </form>
        </Form>

        <div className="text-center text-[13px] text-gray-700">
          ليس لديك حساب؟{' '}
          <Link href="/signup" className="font-extrabold text-green-700 hover:text-green-900">
            إنشاء حساب
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
