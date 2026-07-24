'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api-client';
import { createComplaintSchema, type ComplaintFormInput } from '@/lib/validation/complaint';
import { PRIORITY_OPTIONS } from '@/lib/complaints-ui';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UploadSlot } from '@/components/shared/upload-slot';
import type { Complaint, ComplaintCategory, ComplaintCategoryOption, UploadedFile } from '@/types/api';

function useGeolocation() {
  const [state, setState] = useState<{ status: 'pending' | 'ok' | 'denied'; lat?: number; lng?: number }>(() => ({
    status: typeof navigator !== 'undefined' && 'geolocation' in navigator ? 'pending' : 'denied',
  }));

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setState({ status: 'ok', lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setState({ status: 'denied' }),
      { timeout: 8000 },
    );
  }, []);

  return state;
}

function ComplaintForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const category = (useSearchParams().get('category') ?? '') as ComplaintCategory;
  const geo = useGeolocation();
  const [photo, setPhoto] = useState<UploadedFile | null>(null);
  const [video, setVideo] = useState<UploadedFile | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [submittedDisplayId, setSubmittedDisplayId] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ['complaints', 'categories'],
    queryFn: () => api.get<ComplaintCategoryOption[]>('/complaints/categories'),
  });
  const categoryLabel = categories?.find((c) => c.key === category)?.label ?? '';

  const schema = createComplaintSchema(category);
  const form = useForm<ComplaintFormInput>({
    resolver: zodResolver(schema),
    defaultValues: { description: '', priority: undefined, employeeName: '', witness1: '', witness2: '' },
  });

  const submitMutation = useMutation({
    mutationFn: (values: ComplaintFormInput) => {
      const attachments = [photo, video]
        .filter((f): f is UploadedFile => !!f)
        .map((f) => ({ url: f.url, kind: f.kind === 'image' ? 'PHOTO' : 'VIDEO', mimeType: f.mimeType, sizeBytes: f.sizeBytes }));
      return api.post<Complaint>('/complaints', {
        category,
        priority: values.priority,
        description: values.description,
        employeeName: category === 'BRIBERY' ? values.employeeName : undefined,
        witness1: category === 'BRIBERY' ? values.witness1 || undefined : undefined,
        witness2: category === 'BRIBERY' ? values.witness2 || undefined : undefined,
        latitude: geo.status === 'ok' ? geo.lat : undefined,
        longitude: geo.status === 'ok' ? geo.lng : undefined,
        attachments: attachments.length ? attachments : undefined,
      });
    },
    onSuccess: (complaint) => {
      setSubmittedId(complaint.id);
      setSubmittedDisplayId(complaint.displayId);
      void queryClient.invalidateQueries({ queryKey: ['complaints', 'mine'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiError ? error.message : 'تعذّر إرسال البلاغ، حاول مرة أخرى');
    },
  });

  if (submittedId && submittedDisplayId) {
    return (
      <div className="flex flex-col items-center gap-3.5 px-4 py-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-full border-[1.5px] border-green-700 text-[22px] font-extrabold text-green-700">
          ✓
        </div>
        <h1 className="text-lg font-extrabold text-ink">تم إرسال البلاغ بنجاح</h1>
        <div className="text-[22px] font-black text-red-600">بلاغ #{submittedDisplayId}</div>
        <p className="text-[13px] leading-7 text-gray-500">سيصلك إشعار عند كل تغيير في حالة البلاغ</p>
        <Button
          onClick={() => router.push(`/complaints/${submittedId}`)}
          className="h-auto w-full rounded-[12px] bg-red-600 py-3.5 text-[14.5px] font-extrabold hover:bg-red-700"
        >
          متابعة الحالة
        </Button>
        <Link
          href="/complaints"
          className="w-full rounded-[12px] border-[1.5px] border-gray-300 bg-white py-3.5 text-center text-[14.5px] font-extrabold text-ink"
        >
          العودة
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4.5 px-4.5 pt-4 pb-8">
      <Link href="/complaints" className="self-start text-[13px] font-bold text-ink">
        ← رجوع
      </Link>
      <h1 className="text-lg font-extrabold text-ink">{categoryLabel}</h1>

      <div className="flex gap-2.5">
        <UploadSlot kind="image" label="إرفاق صورة" className="flex-1" onUploaded={setPhoto} />
        <UploadSlot kind="video" label="إرفاق فيديو" className="flex-1" onUploaded={setVideo} />
      </div>

      <div className="rounded-[10px] border border-gray-300 bg-white px-3.5 py-3">
        <div className="mb-0.5 text-[10.5px] font-bold text-gold-deep">الموقع الجغرافي</div>
        <div className="text-[12.5px] text-gray-700">
          {geo.status === 'pending' && 'جارٍ تحديد الموقع تلقائيًا...'}
          {geo.status === 'ok' && 'تم تحديد موقعك الحالي تلقائيًا'}
          {geo.status === 'denied' && 'تعذّر تحديد الموقع — يمكنك المتابعة دون ذلك'}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => submitMutation.mutate(values))} className="flex flex-col gap-4.5">
          {category === 'BRIBERY' && (
            <>
              <FormField
                control={form.control}
                name="employeeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الموظف</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="witness1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الشاهد الأول (اختياري)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="witness2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الشاهد الثاني (اختياري)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </>
          )}

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>وصف البلاغ</FormLabel>
                <FormControl>
                  <Textarea rows={4} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>درجة الأولوية</FormLabel>
                <FormControl>
                  <div className="flex flex-wrap gap-2">
                    {PRIORITY_OPTIONS.map((p) => {
                      const active = field.value === p.key;
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => field.onChange(p.key)}
                          className={cn('rounded-full border-2 px-3.5 py-2 text-[12.5px] font-extrabold')}
                          style={{
                            borderColor: p.color,
                            background: active ? p.color : '#fff',
                            color: active ? '#fff' : p.color,
                          }}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={submitMutation.isPending}
            className="h-auto rounded-[12px] bg-red-600 py-3.5 text-[15px] font-extrabold hover:bg-red-700"
          >
            {submitMutation.isPending ? 'جارٍ الإرسال...' : 'إرسال البلاغ'}
          </Button>
        </form>
      </Form>
    </div>
  );
}

export default function NewComplaintPage() {
  return (
    <Suspense>
      <ComplaintForm />
    </Suspense>
  );
}
