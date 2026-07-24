import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ASSISTANT_ENGINE, AssistantEngine } from './assistant.interfaces';

export const ASSISTANT_SUGGESTIONS = [
  'أين أقرب صيدلية؟',
  'كيف أقدم شكوى؟',
  'ما رقم الدفاع المدني؟',
  'من أنشأ التطبيق؟',
];

@Injectable()
export class AssistantService {
  constructor(
    @Inject(ASSISTANT_ENGINE) private readonly engine: AssistantEngine,
    private readonly prisma: PrismaService,
  ) {}

  suggestions() {
    return ASSISTANT_SUGGESTIONS;
  }

  async ask(userId: string | undefined, question: string) {
    const { answer, matchedIntent } = await this.engine.answer(question);

    await this.prisma.assistantInteraction.create({
      data: { userId, question, answer, matchedIntent },
    });

    return { answer };
  }
}
