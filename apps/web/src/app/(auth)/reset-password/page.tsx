'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api-client';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validation/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';
  const [done, setDone] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '' },
  });

  const mutation = useMutation({
    mutationFn: (input: ResetPasswordInput) => api.post('/auth/reset-password', { token, ...input }),
    onSuccess: () => {
      setDone(true);
      toast.success('تم تحديث كلمة المرور بنجاح');
      setTimeout(() => router.replace('/login'), 1500);
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiError ? error.message : 'الرابط غير صالح أو منتهي الصلاحية');
    },
  });

  if (!token) {
    return (
      <div className="flex flex-col gap-4 px-6 py-9 text-center">
        <p className="text-sm text-gray-500">رابط إعادة التعيين غير صالح.</p>
        <Link href="/forgot-password" className="font-extrabold text-green-700">
          طلب رابط جديد
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-6 py-9">
      <h1 className="text-xl font-extrabold text-ink">تعيين كلمة مرور جديدة</h1>
      {done ? (
        <div className="rounded-[12px] bg-green-100 p-4 text-[13.5px] leading-7 text-green-900">
          تم تحديث كلمة المرور، جارٍ تحويلك لتسجيل الدخول...
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>كلمة المرور الجديدة</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={mutation.isPending} className="h-auto rounded-[12px] py-3.5 text-[15px] font-extrabold">
              {mutation.isPending ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور'}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
