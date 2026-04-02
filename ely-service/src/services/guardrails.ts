import { db } from '../utils/db';
import type { GuardrailResult, KnowledgeContext } from '../types';
import { logger } from '../utils/logger';

export class GuardrailService {
  // Layer 2: Input validation — run before LLM call
  validateInput(input: string): GuardrailResult {
    // Check for prompt injection attempts
    const injectionPatterns = [
      /ignore\s+(all\s+)?previous\s+instructions/i,
      /ignore\s+(all\s+)?above/i,
      /you\s+are\s+now\s+(a|an)\s+/i,
      /system\s*:\s*/i,
      /\[INST\]/i,
      /\<\|system\|?\>/i,
      /forget\s+(everything|all|your)/i,
      /pretend\s+you\s+are/i,
      /act\s+as\s+if\s+you/i,
      /new\s+instructions?\s*:/i,
      /override\s+(your|the)\s+(instructions|prompt|rules)/i,
    ];

    for (const pattern of injectionPatterns) {
      if (pattern.test(input)) {
        return {
          passed: false,
          type: 'prompt_injection',
          severity: 'high',
          details: `Potential prompt injection detected: matched pattern ${pattern.source}`,
        };
      }
    }

    // Check for payment/credit card info in input
    const cardPattern = /\b(?:\d{4}[- ]?){3}\d{4}\b/;
    if (cardPattern.test(input)) {
      return {
        passed: false,
        type: 'payment_info',
        severity: 'critical',
        details: 'Guest attempted to share payment card information',
      };
    }

    return { passed: true };
  }

  // Layer 2: Output validation — run after LLM response
  validateOutput(output: string, context: KnowledgeContext): GuardrailResult {
    // Check for competitor mentions
    for (const competitor of context.config.competitorBlocklist) {
      if (output.toLowerCase().includes(competitor.toLowerCase())) {
        return {
          passed: false,
          type: 'competitor_mention',
          severity: 'high',
          details: `Response mentions competitor: ${competitor}`,
        };
      }
    }

    // Check for system prompt leakage
    const leakPatterns = [
      /system\s+prompt/i,
      /my\s+instructions\s+are/i,
      /i\s+was\s+(told|instructed|programmed)\s+to/i,
      /my\s+rules\s+(are|say|state)/i,
    ];

    for (const pattern of leakPatterns) {
      if (pattern.test(output)) {
        return {
          passed: false,
          type: 'system_prompt_leak',
          severity: 'critical',
          details: 'Response may leak system prompt information',
        };
      }
    }

    // Check for inappropriate content patterns
    const inappropriatePatterns = [
      /\b(fuck|shit|damn|hell|ass)\b/i,
    ];

    for (const pattern of inappropriatePatterns) {
      if (pattern.test(output)) {
        return {
          passed: false,
          type: 'inappropriate_content',
          severity: 'high',
          details: 'Response contains inappropriate language',
        };
      }
    }

    return { passed: true };
  }

  // Log a guardrail event to the database
  async logEvent(
    hotelId: string,
    conversationId: number | undefined,
    messageId: number | undefined,
    result: GuardrailResult,
    inputText?: string,
    outputText?: string,
    action = 'blocked',
  ): Promise<void> {
    if (result.passed) return;

    try {
      await db.guardrailEvent.create({
        data: {
          hotelId,
          chatwootConversationId: conversationId,
          chatwootMessageId: messageId,
          type: (result.type as any) || 'off_topic',
          severity: (result.severity as any) || 'medium',
          details: { message: result.details },
          inputText,
          outputText,
          action,
        },
      });
    } catch (err) {
      logger.error({ err, hotelId, type: result.type }, 'Failed to log guardrail event');
    }
  }
}

export const guardrailService = new GuardrailService();
