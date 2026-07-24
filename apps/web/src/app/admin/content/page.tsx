'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { NewsItem } from '@/types/api';

interface NewsInput {
  title: string;
  tag: string;
  body: string;
}

function CreateNewsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const form = useForm<NewsInput>({ defaultValues: { title: '', tag: 'أخبار عامة', body: '' } });

  const mutation = useMutation({
    mutationFn: (values: NewsInput) => api.post<NewsItem>('/news', values),
    onSuccess: () => {
      toast.success('تم نشر الخبر');
      void queryClient.invalidateQueries({ queryKey: ['news'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'تعذّر نشر الخبر'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>خبر جديد</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-3.5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>العنوان</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>التصنيف</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>التفاصيل (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={mutation.isPending} className="h-auto rounded-[10px] py-3 text-sm font-extrabold">
              {mutation.isPending ? 'جارٍ النشر...' : 'نشر'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminContentPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: news, isLoading } = useQuery({
    queryKey: ['news'],
    queryFn: () => api.get<NewsItem[]>('/news'),
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-ink">الأخبار والإعلانات</h1>
        <Button onClick={() => setDialogOpen(true)} className="h-auto rounded-[10px] px-4.5 py-2.5 text-sm font-extrabold">
          + خبر جديد
        </Button>
      </div>
      <div className="overflow-hidden rounded-[14px] bg-white">
        {isLoading && (
          <div className="flex flex-col gap-px p-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        )}
        {news?.map((item) => (
          <div key={item.id} className="flex items-center justify-between border-b border-gray-100 px-4.5 py-3.5 last:border-0">
            <div className="text-[13.5px] font-bold">{item.title}</div>
            <span className="text-[11px] text-gray-500">{item.time}</span>
          </div>
        ))}
      </div>
      <CreateNewsDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
