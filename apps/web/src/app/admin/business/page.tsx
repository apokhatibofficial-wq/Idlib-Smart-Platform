'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { BusinessAccountRequest, Coupon } from '@/types/api';

function usePendingBusiness() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['admin', 'business', 'pending'],
    queryFn: () => api.get<BusinessAccountRequest[]>('/business-accounts/pending'),
  });

  const review = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      api.post(`/business-accounts/${id}/${approve ? 'approve' : 'reject'}`),
    onSuccess: (_data, variables) => {
      toast.success(variables.approve ? 'تمت الموافقة على الحساب التجاري' : 'تم رفض الطلب');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'business', 'pending'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'تعذّر تنفيذ الإجراء'),
  });

  return { ...query, review };
}

function usePendingCoupons() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['admin', 'coupons', 'pending'],
    queryFn: () => api.get<(Coupon & { store: { name: string } })[]>('/admin/coupons/pending'),
  });

  const review = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      api.post(`/admin/coupons/${id}/${approve ? 'approve' : 'reject'}`),
    onSuccess: () => {
      toast.success('تم تحديث حالة الكوبون');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'coupons', 'pending'] });
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'تعذّر تنفيذ الإجراء'),
  });

  return { ...query, review };
}

export default function AdminBusinessPage() {
  const business = usePendingBusiness();
  const coupons = usePendingCoupons();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        <h1 className="text-xl font-extrabold text-ink">حسابات تجارية قيد المراجعة</h1>
        <div className="grid grid-cols-3 gap-3.5">
          {business.isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-[14px]" />)}
          {business.data?.length === 0 && (
            <p className="col-span-3 rounded-[14px] bg-white py-8 text-center text-sm text-gray-500">
              لا توجد طلبات قيد المراجعة
            </p>
          )}
          {business.data?.map((req) => (
            <div key={req.id} className="flex flex-col gap-2 rounded-[14px] bg-white p-4">
              <div className="text-sm font-extrabold">{req.businessName}</div>
              <div className="text-xs text-gray-500">{req.applicant?.fullName}</div>
              <div className="mt-1.5 flex gap-2">
                <Button
                  onClick={() => business.review.mutate({ id: req.id, approve: true })}
                  disabled={business.review.isPending}
                  className="h-auto flex-1 rounded-[8px] py-2 text-xs font-extrabold"
                >
                  قبول
                </Button>
                <Button
                  variant="outline"
                  onClick={() => business.review.mutate({ id: req.id, approve: false })}
                  disabled={business.review.isPending}
                  className="h-auto flex-1 rounded-[8px] border-red-100 py-2 text-xs font-extrabold text-red-600 hover:bg-red-100"
                >
                  رفض
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <h2 className="text-lg font-extrabold text-ink">كوبونات بانتظار الموافقة</h2>
        <div className="overflow-hidden rounded-[14px] bg-white">
          {coupons.isLoading && (
            <div className="flex flex-col gap-px p-4">
              <Skeleton className="h-12" />
            </div>
          )}
          {coupons.data?.length === 0 && <p className="py-8 text-center text-sm text-gray-500">لا توجد كوبونات قيد المراجعة</p>}
          {coupons.data?.map((coupon) => (
            <div key={coupon.id} className="flex items-center justify-between border-b border-gray-100 px-4.5 py-3.5 last:border-0">
              <div>
                <div className="text-[13.5px] font-bold">
                  {coupon.code} — خصم {coupon.percentOff}%
                </div>
                <div className="text-[11.5px] text-gray-500">{coupon.store.name}</div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => coupons.review.mutate({ id: coupon.id, approve: true })}
                  className="rounded-[8px] bg-green-700 px-3 py-1.5 text-xs font-extrabold text-white"
                >
                  قبول
                </button>
                <button
                  type="button"
                  onClick={() => coupons.review.mutate({ id: coupon.id, approve: false })}
                  className="rounded-[8px] border-[1.5px] border-red-100 px-3 py-1.5 text-xs font-extrabold text-red-600"
                >
                  رفض
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
