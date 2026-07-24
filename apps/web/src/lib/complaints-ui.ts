import type { ComplaintPriority, ComplaintStatus } from '@/types/api';

export const PRIORITY_OPTIONS: { key: ComplaintPriority; label: string; color: string }[] = [
  { key: 'LOW', label: 'منخفضة', color: '#4d9455' },
  { key: 'MEDIUM', label: 'متوسطة', color: '#cdb857' },
  { key: 'HIGH', label: 'عالية', color: '#d9822b' },
  { key: 'URGENT', label: 'عاجلة', color: '#b7262b' },
];

export const STATUS_COLORS: Record<ComplaintStatus, string> = {
  UNDER_REVIEW: '#cdb857',
  IN_PROGRESS: '#4d7fc9',
  RESOLVED: '#4d9455',
};

export const STATUS_STEPS: { key: ComplaintStatus; label: string }[] = [
  { key: 'UNDER_REVIEW', label: 'قيد الدراسة' },
  { key: 'IN_PROGRESS', label: 'قيد التنفيذ' },
  { key: 'RESOLVED', label: 'تم الحل' },
];

export function stepColor(stepIndex: number, currentStatus: ComplaintStatus): string {
  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === currentStatus);
  return stepIndex <= currentIndex ? STATUS_COLORS[STATUS_STEPS[Math.min(stepIndex, 2)].key] : '#d6d2c4';
}
