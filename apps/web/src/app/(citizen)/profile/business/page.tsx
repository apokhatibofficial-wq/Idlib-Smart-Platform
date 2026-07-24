'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import type { BusinessAccountRequest } from '@/types/api';

// Mirrors the API's default BUSINESS_ACCOUNT_FEE_USD; the authoritative amount is
// always the one returned on the created request (see the "pending" branch below).
const FEE_USD = '10';

export default function BusinessIntroPage() {
  const { data: request, isLoading } = useQuery({
    queryKey: ['business-accounts', 'mine'],
    queryFn: () => api.get<BusinessAccountRequest | null>('/business-accounts/mine'),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 px-4.5 pt-4 pb-8">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-28 rounded-[12px]" />
      </div>
    );
  }

  const pending = request && (request.status === 'PENDING_PAYMENT' || request.status === 'PENDING_APPROVAL');
  const rejected = request?.status === 'REJECTED';
  const approved = request?.status === 'APPROVED';

  return (
    <div className="flex flex-col gap-4 px-4.5 pt-4 pb-8">
      <Link href="/profile" className="self-start text-[13px] font-bold text-ink">
        ← رجوع
      </Link>
      <h1 className="text-lg font-extrabold text-ink">التحويل إلى حساب أعمال</h1>

      {pending && (
        <div className="flex flex-col items-center gap-3.5 py-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-full border-[1.5px] border-gold text-center text-xs font-extrabold leading-tight text-gold-deep">
            قيد
            <br />
            المراجعة
          </div>
          <h2 className="text-[17px] font-extrabold text-ink">ملفك التجاري قيد الإنشاء والمراجعة</h2>
          <p className="text-[13px] leading-8 text-gray-500">
            بعد تأكيد الدفع وموافقة المشرف، سينتقل نشاطك التجاري إلى صفحة الأسواق وستحصل على لوحة تحكم خاصة.
          </p>
          <div className="flex w-full flex-col gap-2.5 rounded-[12px] border border-gray-300 bg-white p-3.5 text-right">
            <div className="flex items-center gap-2.5">
              <span className="size-2 rounded-full bg-green-700" />
              <span className="text-[13px] font-bold">تأكيد الدفع ({request.feeUsd}$)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="size-2 rounded-full bg-gold" />
              <span className="text-[13px] font-bold">بانتظار موافقة المشرف</span>
            </div>
          </div>
        </div>
      )}

      {rejected && (
        <div className="flex flex-col gap-3.5">
          <div className="rounded-[12px] bg-red-100 p-4 text-[13px] leading-7 text-red-700">
            تم رفض طلب التحويل السابق{request.rejectionReason ? `: ${request.rejectionReason}` : '.'}
          </div>
          <Link
            href="/profile/business/form"
            className="rounded-[12px] bg-green-700 py-3.5 text-center text-[14.5px] font-extrabold text-white"
          >
            إعادة تقديم الطلب
          </Link>
        </div>
      )}

      {approved && (
        <div className="rounded-[12px] bg-green-100 p-4 text-[13px] leading-7 text-green-900">
          تمت الموافقة على حسابك التجاري. سجّل الخروج ثم أعد تسجيل الدخول للوصول إلى لوحة التاجر.
        </div>
      )}

      {!request && (
        <>
          <div className="rounded-[12px] border border-[#ecdca0] bg-[#fff9e8] p-3.5 text-[13px] leading-7 text-[#6b5a17]">
            إن إنشاء الحساب التجاري ليس مجانياً — تكلفة الإنشاء <b>{FEE_USD}$</b>. سيتم إرسال رابط الدفع بعد المتابعة.
          </div>
          <Link
            href="/profile/business/form"
            className="rounded-[12px] bg-green-700 py-3.5 text-center text-[14.5px] font-extrabold text-white"
          >
            متابعة وإرسال رابط الدفع
          </Link>
        </>
      )}
    </div>
  );
}
