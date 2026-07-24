import { z } from 'zod';
import type { ComplaintCategory } from '@/types/api';

export function createComplaintSchema(category: ComplaintCategory) {
  return z.object({
    description: z.string().min(10, 'وصف البلاغ يجب أن يتكون من 10 أحرف على الأقل').max(2000),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], { message: 'اختر درجة الأولوية' }),
    employeeName:
      category === 'BRIBERY'
        ? z.string().min(2, 'اسم الموظف مطلوب في بلاغات الرشوة').max(120)
        : z.string().max(120).optional(),
    witness1: z.string().max(120).optional(),
    witness2: z.string().max(120).optional(),
  });
}

export type ComplaintFormInput = z.infer<ReturnType<typeof createComplaintSchema>>;
