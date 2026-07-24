import Image from 'next/image';

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-cream px-6 text-center">
      <Image src="/images/logo-fazaa.png" alt="" width={72} height={72} className="object-contain opacity-80" />
      <h1 className="text-lg font-extrabold text-ink">لا يوجد اتصال بالإنترنت</h1>
      <p className="max-w-xs text-[13px] leading-7 text-gray-500">
        تعذّر تحميل هذه الصفحة. تحقّق من اتصالك وأعد المحاولة — أي بلاغ قمت بإرساله سيصل تلقائيًا فور عودة الاتصال.
      </p>
    </div>
  );
}
