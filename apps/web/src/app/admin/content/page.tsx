'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { Alert, NewsItem } from '@/types/api';

interface NewsInput {
  title: string;
  tag: string;
  body: string;
}

function NewsDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: NewsItem | null;
}) {
  const queryClient = useQueryClient();
  const form = useForm<NewsInput>({ defaultValues: { title: '', tag: 'أخبار عامة', body: '' } });

  useEffect(() => {
    if (!open) return;
    form.reset(editing ? { title: editing.title, tag: editing.tag, body: editing.body ?? '' } : { title: '', tag: 'أخبار عامة', body: '' });
  }, [open, editing, form]);

  const mutation = useMutation({
    mutationFn: (values: NewsInput) =>
      editing ? api.patch<NewsItem>(`/news/${editing.id}`, values) : api.post<NewsItem>('/news', values),
    onSuccess: () => {
      toast.success(editing ? 'تم تحديث الخبر' : 'تم نشر الخبر');
      void queryClient.invalidateQueries({ queryKey: ['news'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
      onOpenChange(false);
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'تعذّر حفظ الخبر'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'تعديل الخبر' : 'خبر جديد'}</DialogTitle>
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
              {mutation.isPending ? 'جارٍ الحفظ...' : editing ? 'حفظ التعديل' : 'نشر'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AlertDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Alert | null;
}) {
  const queryClient = useQueryClient();
  const form = useForm<{ text: string; isActive: boolean }>({ defaultValues: { text: '', isActive: true } });

  useEffect(() => {
    if (!open) return;
    form.reset({ text: editing?.text ?? '', isActive: editing ? editing.isActive : true });
  }, [open, editing, form]);

  const mutation = useMutation({
    mutationFn: (values: { text: string; isActive: boolean }) =>
      editing ? api.patch<Alert>(`/alerts/${editing.id}`, values) : api.post<Alert>('/alerts', { text: values.text }),
    onSuccess: () => {
      toast.success(editing ? 'تم تحديث التنبيه' : 'تم نشر التنبيه');
      void queryClient.invalidateQueries({ queryKey: ['alerts'] });
      onOpenChange(false);
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'تعذّر حفظ التنبيه'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.del(`/alerts/${editing!.id}`),
    onSuccess: () => {
      toast.success('تم حذف التنبيه');
      void queryClient.invalidateQueries({ queryKey: ['alerts'] });
      onOpenChange(false);
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'تعذّر حذف التنبيه'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'تعديل التنبيه العاجل' : 'تنبيه عاجل جديد'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-3.5">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نص التنبيه</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            {editing && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الحالة</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => field.onChange(true)}
                          className={cn(
                            'flex-1 rounded-[10px] border-[1.5px] py-2 text-[12.5px] font-extrabold',
                            field.value ? 'border-green-700 bg-green-700 text-white' : 'border-gray-300 bg-white text-gray-500',
                          )}
                        >
                          نشط
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange(false)}
                          className={cn(
                            'flex-1 rounded-[10px] border-[1.5px] py-2 text-[12.5px] font-extrabold',
                            !field.value ? 'border-red-600 bg-red-600 text-white' : 'border-gray-300 bg-white text-gray-500',
                          )}
                        >
                          غير نشط
                        </button>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
            <Button type="submit" disabled={mutation.isPending} className="h-auto rounded-[10px] py-3 text-sm font-extrabold">
              {mutation.isPending ? 'جارٍ الحفظ...' : editing ? 'حفظ التعديل' : 'نشر'}
            </Button>
            {editing && (
              <Button
                type="button"
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
                className="h-auto rounded-[10px] py-3 text-sm font-extrabold"
              >
                {deleteMutation.isPending ? 'جارٍ الحذف...' : 'حذف التنبيه'}
              </Button>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminContentPage() {
  const [newsDialogOpen, setNewsDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);

  const { data: news, isLoading: newsLoading } = useQuery({
    queryKey: ['news'],
    queryFn: () => api.get<NewsItem[]>('/news'),
  });
  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts', 'all'],
    queryFn: () => api.get<Alert[]>('/alerts/all'),
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-ink">الأخبار</h1>
          <Button
            onClick={() => {
              setEditingNews(null);
              setNewsDialogOpen(true);
            }}
            className="h-auto rounded-[10px] px-4.5 py-2.5 text-sm font-extrabold"
          >
            + خبر جديد
          </Button>
        </div>
        <div className="overflow-hidden rounded-[14px] bg-white">
          {newsLoading && (
            <div className="flex flex-col gap-px p-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          )}
          {!newsLoading && news?.length === 0 && (
            <div className="px-4.5 py-8 text-center text-[13px] text-gray-500">لا توجد أخبار بعد</div>
          )}
          {news?.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setEditingNews(item);
                setNewsDialogOpen(true);
              }}
              className="flex w-full items-center justify-between border-b border-gray-100 px-4.5 py-3.5 text-right last:border-0 hover:bg-gray-50"
            >
              <div>
                <div className="text-[13.5px] font-bold">{item.title}</div>
                <div className="text-[11px] text-gray-500">{item.tag}</div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] text-gray-500">{item.time}</span>
                <span className="text-[12px] font-bold text-green-700">تعديل</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-ink">التنبيهات العاجلة</h1>
          <Button
            onClick={() => {
              setEditingAlert(null);
              setAlertDialogOpen(true);
            }}
            className="h-auto rounded-[10px] bg-red-600 px-4.5 py-2.5 text-sm font-extrabold hover:bg-red-700"
          >
            + تنبيه جديد
          </Button>
        </div>
        <div className="overflow-hidden rounded-[14px] bg-white">
          {alertsLoading && (
            <div className="flex flex-col gap-px p-4">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          )}
          {!alertsLoading && alerts?.length === 0 && (
            <div className="px-4.5 py-8 text-center text-[13px] text-gray-500">لا توجد تنبيهات بعد</div>
          )}
          {alerts?.map((alert) => (
            <button
              key={alert.id}
              type="button"
              onClick={() => {
                setEditingAlert(alert);
                setAlertDialogOpen(true);
              }}
              className="flex w-full items-center justify-between border-b border-gray-100 px-4.5 py-3.5 text-right last:border-0 hover:bg-gray-50"
            >
              <div className="text-[13.5px] font-bold">{alert.text}</div>
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold',
                    alert.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500',
                  )}
                >
                  {alert.isActive ? 'نشط' : 'غير نشط'}
                </span>
                <span className="text-[12px] font-bold text-green-700">تعديل</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <NewsDialog open={newsDialogOpen} onOpenChange={setNewsDialogOpen} editing={editingNews} />
      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen} editing={editingAlert} />
    </div>
  );
}
