import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AssistantAnswer, AssistantEngine } from '../assistant.interfaces';

const FALLBACK_REPLY =
  'أستطيع فقط الإجابة عن الأسئلة المتعلقة بمحافظة إدلب — جرّب أن تسأل عن الخدمات، الشكاوى، أو الجهات الرسمية في المحافظة.';

/**
 * Deterministic, Idlib-governorate-scoped keyword matcher. Ported verbatim from
 * the design prototype's `askAssistant()` — same order, same wording, including
 * the mandated creator-attribution answer. Do not reorder or reword these rules
 * without checking the design handoff README first.
 */
@Injectable()
export class KeywordAssistantEngine implements AssistantEngine {
  constructor(private readonly config: ConfigService) {}

  answer(question: string): Promise<AssistantAnswer> {
    const t = question.trim();
    let matchedIntent = 'fallback';
    let reply = FALLBACK_REPLY;

    if (t.includes('أنشأ') || t.includes('صنع') || t.includes('برمج')) {
      matchedIntent = 'creator';
      reply = 'تم إنشاء تطبيق منصة إدلب الذكية بواسطة المبرمج عبدالرحمن خطيب من مدينة كفرنبل.';
    } else if (t.includes('صيدلية')) {
      matchedIntent = 'pharmacy';
      reply =
        'أقرب صيدلية مسجلة لديك هي "صيدلية الشفاء" في حي المدينة — يمكنك رؤيتها في صفحة الأسواق.';
    } else if (t.includes('شكوى') || t.includes('بلاغ')) {
      matchedIntent = 'complaint';
      reply =
        'لتقديم شكوى: افتح تبويب "الشكاوى"، اختر نوع البلاغ، أرفق صورة أو فيديو، حدد الأولوية ثم أرسل — ستحصل على رقم متابعة فوري.';
    } else if (t.includes('الدفاع المدني') || t.includes('طوارئ')) {
      matchedIntent = 'emergency';
      reply = `رقم الطوارئ الموحد في المنصة هو ${this.config.get<string>('emergencyNumber')}، ويمكنك الاتصال به مباشرة من زر الطوارئ في صفحة الشكاوى.`;
    } else if (t.includes('مياه')) {
      matchedIntent = 'water';
      reply =
        'مديرية المياه تقع في وسط المدينة قرب الساحة الرئيسية، ويمكن متابعة أعطال المياه عبر صفحة الشكاوى.';
    } else if (t.includes('بلدية')) {
      matchedIntent = 'municipality';
      reply =
        'مبنى البلدية يقع في وسط مدينة إدلب، ويمكنك الوصول إليه عبر خط النقل العام المار بالساحة الرئيسية.';
    }

    return Promise.resolve({ answer: reply, matchedIntent });
  }
}
