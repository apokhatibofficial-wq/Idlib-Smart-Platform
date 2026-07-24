import { ComplaintCategory, ComplaintPriority, ComplaintStatus } from '@prisma/client';

export const COMPLAINT_CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  ROADS: 'شكوى الطرق',
  CLEANLINESS: 'شكوى النظافة',
  PRICING: 'مخالفات الأسعار',
  BRIBERY: 'الإبلاغ عن الرشوة',
};

export const COMPLAINT_PRIORITY_LABELS: Record<ComplaintPriority, string> = {
  LOW: 'منخفضة',
  MEDIUM: 'متوسطة',
  HIGH: 'عالية',
  URGENT: 'عاجلة',
};

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  UNDER_REVIEW: 'قيد الدراسة',
  IN_PROGRESS: 'قيد التنفيذ',
  RESOLVED: 'تم الحل',
};

export const COMPLAINT_STATUS_ORDER: ComplaintStatus[] = [
  'UNDER_REVIEW',
  'IN_PROGRESS',
  'RESOLVED',
];

export function formatComplaintDisplayId(sequenceNumber: number): string {
  return String(sequenceNumber).padStart(5, '0');
}
