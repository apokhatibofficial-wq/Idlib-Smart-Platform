'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api-client';
import { signupSchema, type SignupInput } from '@/lib/validation/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

export default function SignupPage() {
  const router = useRouter();

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: (input: SignupInput) => api.post<{ email: string }>('/auth/register', input),
    onSuccess: ({ email }) => {
      router.push(`/otp?email=${encodeURIComponent(email)}`);
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiError ? error.message : 'تعذّر إنشاء الحساب، حاول مرة أخرى');
    },
  });

  return (
    <div className="flex flex-col gap-4 px-6 py-8">
      <Link href="/login" className="self-start text-[13px] font-bold text-ink hover:text-green-700">
        ← رجوع
      </Link>
      <h1 className="text-[22px] font-extrabold text-ink">إنشاء حساب جديد</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الاسم الكامل</FormLabel>
                <FormControl>
                  <Input autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>البريد الإلكتروني</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} />
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
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={mutation.isPending} className="mt-1.5 h-auto rounded-[12px] py-3.5 text-[15px] font-extrabold">
            {mutation.isPending ? 'جارٍ الإنشاء...' : 'إنشاء حساب وإرسال رمز التحقق'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
