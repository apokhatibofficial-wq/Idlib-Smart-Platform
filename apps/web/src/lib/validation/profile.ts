import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'الاسم يجب أن يتكون من حرفين على الأقل').max(80),
  username: z
    .string()
    .regex(/^[a-zA-Z0-9_.]{3,24}$/, 'اسم المستخدم يجب أن يتكون من 3 إلى 24 حرفًا (إنجليزي وأرقام و . _ فقط)'),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
    newPassword: z
      .string()
      .min(8, 'كلمة المرور يجب أن تتكون من 8 أحرف على الأقل')
      .regex(/(?=.*[a-zA-Z])(?=.*[0-9])/, 'كلمة المرور يجب أن تحتوي على أحرف وأرقام معًا'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'كلمتا المرور غير متطابقتين',
    path: ['confirmPassword'],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const businessAccountSchema = z.object({
  businessName: z.string().min(2, 'الاسم التجاري مطلوب').max(120),
  registrationNumber: z.string().min(1, 'رقم السجل التجاري مطلوب').max(60),
  phone: z.string().min(7, 'رقم الهاتف غير صالح').max(20),
  category: z.enum(['FOOD', 'CLOTHES', 'ELECTRONICS', 'HEALTH', 'OTHER'], { message: 'اختر نوع النشاط' }),
  description: z.string().min(10, 'وصف النشاط يجب أن يتكون من 10 أحرف على الأقل').max(1000),
  firstProductName: z.string().min(2, 'اسم المنتج مطلوب').max(120),
  firstProductPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'السعر يجب أن يكون رقمًا'),
  firstProductAvailable: z.enum(['AVAILABLE', 'OUT_OF_STOCK']),
});
export type BusinessAccountInput = z.infer<typeof businessAccountSchema>;
