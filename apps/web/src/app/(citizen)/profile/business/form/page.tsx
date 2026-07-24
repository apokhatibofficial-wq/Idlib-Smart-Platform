'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api-client';
import { businessAccountSchema, type BusinessAccountInput } from '@/lib/validation/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UploadSlot } from '@/components/shared/upload-slot';
import type { BusinessAccountRequest, MarketCategoryOption, UploadedFile } from '@/types/api';

export default function BusinessFormPage() {
  const router = useRouter();
  const [logo, setLogo] = useState<UploadedFile | null>(null);
  const [photo, setPhoto] = useState<UploadedFile | null>(null);

  const { data: categories } = useQuery({
    queryKey: ['marketplace', 'categories'],
    queryFn: () => api.get<MarketCategoryOption[]>('/marketplace/categories'),
  });
  const businessCategories = categories?.filter((c) => c.key !== 'all') ?? [];

  const form = useForm<BusinessAccountInput>({
    resolver: zodResolver(businessAccountSchema),
    defaultValues: {
      businessName: '',
      registrationNumber: '',
      phone: '',
      category: undefined,
      description: '',
      firstProductName: '',
      firstProductPrice: '',
      firstProductAvailable: 'AVAILABLE',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: BusinessAccountInput) =>
      api.post<BusinessAccountRequest>('/business-accounts', {
        ...values,
        logoUrl: logo?.url,
        photoUrls: photo ? [photo.url] : [],
      }),
    onSuccess: () => router.push('/profile/business'),
    onError: (error: unknown) => {
      toast.error(error instanceof ApiError ? error.message : 'تعذّر إرسال الطلب');
    },
  });

  return (
    <div className="flex flex-col gap-4 px-4.5 pt-4 pb-8">
      <Link href="/profile/business" className="self-start text-[13px] font-bold text-ink">
        ← رجوع
      </Link>
      <h1 className="text-lg font-extrabold text-ink">بيانات النشاط التجاري</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الاسم التجاري</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="registrationNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>رقم السجل التجاري</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>رقم الهاتف</FormLabel>
                <FormControl>
                  <Input dir="ltr" className="text-right" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>نوع النشاط</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع النشاط" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {businessCategories.map((c) => (
                      <SelectItem key={c.key} value={c.key}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2.5">
            <UploadSlot kind="image" label="شعار النشاط" className="flex-1" onUploaded={setLogo} />
            <UploadSlot kind="image" label="صور النشاط" className="flex-1" onUploaded={setPhoto} />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>وصف النشاط</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="h-px bg-gray-300" />
          <div className="text-sm font-extrabold text-ink">أول منتج</div>

          <FormField
            control={form.control}
            name="firstProductName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>اسم المنتج</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-2.5">
            <FormField
              control={form.control}
              name="firstProductPrice"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>السعر</FormLabel>
                  <FormControl>
                    <Input inputMode="decimal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="firstProductAvailable"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>حالة التوفر</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="AVAILABLE">متوفر</SelectItem>
                      <SelectItem value="OUT_OF_STOCK">غير متوفر</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" disabled={mutation.isPending} className="h-auto rounded-[12px] py-3.5 text-[14.5px] font-extrabold">
            {mutation.isPending ? 'جارٍ الإرسال...' : 'إرسال طلب التسجيل'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
