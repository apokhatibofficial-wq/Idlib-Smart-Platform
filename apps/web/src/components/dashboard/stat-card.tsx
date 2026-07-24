import { cn } from '@/lib/utils';

export function StatCard({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="rounded-[14px] bg-white p-4.5">
      <div className="text-[11.5px] font-bold text-gray-500">{label}</div>
      <div className={cn('mt-1.5 text-[26px] font-extrabold text-ink', valueClassName)}>{value}</div>
    </div>
  );
}
