import { OrderStatus, StoreCategory } from '@prisma/client';

export const STORE_CATEGORY_LABELS: Record<StoreCategory, string> = {
  FOOD: 'مطاعم',
  CLOTHES: 'ملابس',
  ELECTRONICS: 'إلكترونيات',
  HEALTH: 'صيدليات',
  OTHER: 'أخرى',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: 'جديد',
  PREPARING: 'قيد التحضير',
  DELIVERED: 'تم التوصيل',
  CANCELLED: 'ملغى',
};

export function formatOrderDisplayId(sequenceNumber: number): string {
  return String(sequenceNumber).padStart(4, '0');
}
