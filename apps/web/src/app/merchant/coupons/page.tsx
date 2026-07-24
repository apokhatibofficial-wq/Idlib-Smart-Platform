'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { Coupon, CouponStatus } from '@/types/api';

const STATUS_LABEL: Record<CouponStatus, { label: string; className: string }> = {
  PUBLISHED: { label: 'منشور', className: 'bg-[#e7f2e6] text-[#2c5e33]' },
  PENDING_APPROVAL: { label: 'بانتظار الموافقة', className: 'bg-[#fff9e8] text-[#6b5a17]' },
  REJECTED: { label: 'مرفوض', className: 'bg-[#fbe9e8] text-[#8f1d21]' },
};

interface CouponInput {
  code: string;
  percentOff: string;
}

function CreateCouponDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const form = useForm<CouponInput>({ defaultValues: { code: '', percentOff: '' } });

  const mutation = useMutation({
    mutationFn: (values: CouponInput) =>
      api.post<Coupon>('/merchant/coupons', { code: values.code.toUpperCase(), percentOff: Number(values.percentOff) }),
    onSuccess: () => {
      toast.success('تم إرسال الكوبون — بانتظار موافقة المشرف');
      void queryClient.invalidateQueries({ queryKey: ['merchant', 'coupons'] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'تعذّر إنشاء الكوبون'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إنشاء كوبون</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-3.5">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رمز الكوبون</FormLabel>
                  <FormControl>
                    <Input dir="ltr" className="text-right uppercase" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="percentOff"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نسبة الخصم (%)</FormLabel>
                  <FormControl>
                    <Input inputMode="numeric" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={mutation.isPending} className="h-auto rounded-[10px] py-3 text-sm font-extrabold">
              {mutation.isPending ? 'جارٍ الإرسال...' : 'إرسال'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function MerchantCouponsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: coupons, isLoading } = useQuery({
    queryKey: ['merchant', 'coupons'],
    queryFn: () => api.get<Coupon[]>('/merchant/coupons'),
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-ink">الكوبونات</h1>
        <Button onClick={() => setDialogOpen(true)} className="h-auto rounded-[10px] px-4.5 py-2.5 text-sm font-extrabold">
          + إنشاء كوبون
        </Button>
      </div>

      <div className="overflow-hidden rounded-[14px] bg-white">
        {isLoading && (
          <div className="flex flex-col gap-px p-4">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        )}
        {coupons?.length === 0 && <p className="py-10 text-center text-sm text-gray-500">لا توجد كوبونات بعد</p>}
        {coupons?.map((coupon) => (
          <div key={coupon.id} className="flex items-center justify-between border-b border-gray-100 px-4.5 py-3.5 last:border-0">
            <div className="text-[13.5px] font-bold">
              {coupon.code} — خصم {coupon.percentOff}%
            </div>
            <span className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${STATUS_LABEL[coupon.status].className}`}>
              {STATUS_LABEL[coupon.status].label}
            </span>
          </div>
        ))}
      </div>

      <CreateCouponDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
