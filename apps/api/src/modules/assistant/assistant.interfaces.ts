export interface AssistantAnswer {
  answer: string;
  matchedIntent?: string;
}

/**
 * Abstraction over "how the assistant decides what to say". The current
 * implementation (KeywordAssistantEngine) is a deterministic, Idlib-scoped
 * keyword matcher mirroring the design prototype's rule set exactly. Swapping
 * in a real LLM later means implementing this same interface (e.g. a
 * retrieval-augmented call constrained to Idlib-governorate topics) and
 * rebinding the ASSISTANT_ENGINE provider in assistant.module.ts — no
 * controller/service changes required.
 */
export interface AssistantEngine {
  answer(question: string): Promise<AssistantAnswer>;
}

export const ASSISTANT_ENGINE = Symbol('ASSISTANT_ENGINE');
