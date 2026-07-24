'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api-client';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validation/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const mutation = useMutation({
    mutationFn: (input: ForgotPasswordInput) => api.post('/auth/forgot-password', input),
    onSuccess: () => setSent(true),
    onError: (error: unknown) => {
      toast.error(error instanceof ApiError ? error.message : 'حدث خطأ، حاول مرة أخرى');
    },
  });

  return (
    <div className="flex flex-col gap-4 px-6 py-9">
      <Link href="/login" className="self-start text-[13px] font-bold text-ink hover:text-green-700">
        ← رجوع لتسجيل الدخول
      </Link>
      <h1 className="text-xl font-extrabold text-ink">استعادة كلمة المرور</h1>

      {sent ? (
        <div className="rounded-[12px] bg-green-100 p-4 text-[13.5px] leading-7 text-green-900">
          تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.
        </div>
      ) : (
        <>
          <p className="text-[13px] text-gray-500">أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين.</p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type="email" placeholder="example@mail.com" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={mutation.isPending} className="h-auto rounded-[12px] py-3.5 text-[15px] font-extrabold">
                {mutation.isPending ? 'جارٍ الإرسال...' : 'إرسال الرابط'}
              </Button>
            </form>
          </Form>
        </>
      )}
    </div>
  );
}
