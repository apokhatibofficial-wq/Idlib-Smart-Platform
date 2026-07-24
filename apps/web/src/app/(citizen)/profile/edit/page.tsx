'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api-client';
import { updateProfileSchema, type UpdateProfileInput } from '@/lib/validation/profile';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { CurrentUser } from '@/types/api';

export default function EditProfilePage() {
  const { user, refresh } = useAuth();
  const router = useRouter();

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { fullName: user?.fullName ?? '', username: user?.username ?? '' },
  });

  const mutation = useMutation({
    mutationFn: (values: UpdateProfileInput) => api.patch<CurrentUser>('/users/me', values),
    onSuccess: async () => {
      await refresh();
      toast.success('تم حفظ التغييرات');
      router.push('/profile');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiError ? error.message : 'تعذّر حفظ التغييرات');
    },
  });

  return (
    <div className="flex flex-col gap-4 px-4.5 pt-4 pb-8">
      <Link href="/profile" className="self-start text-[13px] font-bold text-ink">
        ← رجوع
      </Link>
      <h1 className="text-lg font-extrabold text-ink">تعديل البيانات</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الاسم</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>اسم المستخدم</FormLabel>
                <FormControl>
                  <Input dir="ltr" className="text-right" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={mutation.isPending} className="h-auto rounded-[12px] py-3.5 text-[14.5px] font-extrabold">
            {mutation.isPending ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
