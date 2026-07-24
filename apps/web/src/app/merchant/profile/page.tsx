'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import type { Store } from '@/types/api';

interface StoreProfileInput {
  name: string;
  description: string;
}

export default function MerchantProfilePage() {
  const queryClient = useQueryClient();
  const { data: store, isLoading } = useQuery({
    queryKey: ['merchant', 'store'],
    queryFn: () => api.get<Store>('/merchant/store'),
  });

  const form = useForm<StoreProfileInput>({ defaultValues: { name: '', description: '' } });

  useEffect(() => {
    if (store) form.reset({ name: store.name, description: store.description ?? '' });
  }, [store, form]);

  const mutation = useMutation({
    mutationFn: (values: StoreProfileInput) => api.patch<Store>('/merchant/store', values),
    onSuccess: () => {
      toast.success('تم الحفظ');
      void queryClient.invalidateQueries({ queryKey: ['merchant', 'store'] });
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'تعذّر الحفظ'),
  });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-extrabold text-ink">الملف التجاري</h1>
      {isLoading ? (
        <Skeleton className="h-64 max-w-[520px] rounded-[14px]" />
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="flex max-w-[520px] flex-col gap-3.5 rounded-[14px] bg-white p-6"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم التجاري</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={mutation.isPending} className="h-auto rounded-[10px] py-3 text-sm font-extrabold">
              {mutation.isPending ? 'جارٍ الحفظ...' : 'حفظ'}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}
