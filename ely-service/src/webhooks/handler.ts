import type { ChatwootWebhookEvent } from '../types';
import { chatwootClient } from '../services/chatwoot';
import { aiService } from '../services/ai';
import { knowledgeService } from '../services/knowledge';
import { guardrailService } from '../services/guardrails';
import { leadService } from '../services/leads';
import { db } from '../utils/db';
import { checkRateLimit, getConversationState, setConversationState } from '../utils/redis';
import { logger } from '../utils/logger';

export class WebhookHandler {
  async handle(event: ChatwootWebhookEvent): Promise<void> {
    switch (event.event) {
      case 'message_created':
        await this.handleMessageCreated(event);
        break;
      case 'conversation_opened':
        // Conversation was reopened — check if bot should re-engage
        logger.info({ conversationId: event.conversation?.id }, 'Conversation reopened');
        break;
      case 'conversation_resolved':
        // Clean up conversation state
        if (event.conversation?.id) {
          await setConversationState(event.conversation.id, { humanResponded: false });
        }
        break;
      default:
        logger.debug({ event: event.event }, 'Unhandled webhook event');
    }
  }

  private async handleMessageCreated(event: ChatwootWebhookEvent): Promise<void> {
    // Only process incoming (guest) messages
    if (event.message_type !== 'incoming') return;

    const conversationId = event.conversation?.id;
    const messageContent = event.content;
    const accountId = event.account?.id;

    if (!conversationId || !messageContent || !accountId) {
      logger.warn({ event: event.event }, 'Missing required fields in webhook event');
      return;
    }

    // Check if a human has already taken over this conversation
    const convState = await getConversationState(conversationId);
    if (convState?.humanResponded) {
      logger.info({ conversationId }, 'Human has taken over, skipping AI response');
      return;
    }

    // Find the hotel for this Chatwoot account
    const hotel = await db.hotel.findFirst({
      where: { chatwootAccountId: accountId, active: true },
      include: { config: true },
    });

    if (!hotel) {
      logger.warn({ accountId }, 'No active hotel found for Chatwoot account');
      return;
    }

    // Rate limiting per contact
    const contactId = event.sender?.id;
    if (contactId) {
      const withinLimit = await checkRateLimit(`contact:${contactId}`, 20, 60);
      if (!withinLimit) {
        logger.warn({ contactId, conversationId }, 'Rate limit exceeded for contact');
        await chatwootClient.sendMessage(
          conversationId,
          "You're sending messages very quickly. Please wait a moment and try again.",
        );
        return;
      }
    }

    // Layer 2: Input validation (guardrails)
    const inputCheck = guardrailService.validateInput(messageContent);
    if (!inputCheck.passed) {
      await guardrailService.logEvent(hotel.id, conversationId, event.id, inputCheck, messageContent);

      if (inputCheck.type === 'payment_info') {
        await chatwootClient.sendMessage(
          conversationId,
          "For your security, please don't share payment card details in chat. Our team can assist you securely. Let me connect you with them.",
        );
        await chatwootClient.handoffConversation(
          conversationId,
          hotel.config?.handoffMessage || "Let me connect you with our team.",
        );
        return;
      }

      // For prompt injection, respond normally but log the attempt
      logger.warn({ conversationId, type: inputCheck.type }, 'Guardrail triggered on input');
    }

    // Get hotel knowledge base
    const detectedLang = messageContent.match(/\b(po|naman|lang|mga|ang|ko|mo|salamat|kumusta|magkano|paano|saan)\b/i)
      ? 'fil'
      : 'en';
    const context = await knowledgeService.getContextForHotel(hotel.id, detectedLang);

    if (!context) {
      logger.error({ hotelId: hotel.id }, 'Failed to load knowledge context');
      return;
    }

    // Fetch conversation history for context
    const messages = await chatwootClient.getConversationMessages(conversationId);

    // Generate AI response
    const aiResponse = await aiService.generateResponse(context, messages, messageContent);

    // Layer 2: Output validation (guardrails)
    const outputCheck = guardrailService.validateOutput(aiResponse.content, context);
    if (!outputCheck.passed) {
      await guardrailService.logEvent(
        hotel.id,
        conversationId,
        event.id,
        outputCheck,
        messageContent,
        aiResponse.content,
      );

      // Replace with safe fallback
      aiResponse.content = "I'd be happy to help with that. Let me connect you with our team for the most accurate information.";
      aiResponse.resolved = false;
      aiResponse.handoffReason = `Guardrail: ${outputCheck.type}`;
      aiResponse.guardrailTriggered = true;
    }

    // Log AI interaction
    await db.aIInteractionLog.create({
      data: {
        hotelId: hotel.id,
        chatwootConversationId: conversationId,
        chatwootMessageId: event.id,
        inputTokens: aiResponse.inputTokens,
        outputTokens: aiResponse.outputTokens,
        model: 'claude-haiku-4-5-20251001',
        latencyMs: aiResponse.latencyMs,
        resolved: aiResponse.resolved,
        handoffReason: aiResponse.handoffReason,
        detectedLanguage: aiResponse.detectedLanguage,
        detectedIntent: aiResponse.detectedIntent,
      },
    });

    // Extract and save lead data from guest message
    const extractedLead = leadService.extractLeadData(aiResponse.content, messageContent);
    const leadData = aiResponse.leadData || extractedLead;

    if (leadData) {
      if (aiResponse.detectedIntent) leadData.intent = aiResponse.detectedIntent;
      const channelType = event.inbox?.channel_type || event.conversation?.channel;
      await leadService.saveLead(hotel.id, conversationId, contactId, leadData, channelType);

      // Also update the Chatwoot contact with captured info
      if (contactId) {
        const updateData: Record<string, unknown> = {};
        if (leadData.email) updateData.email = leadData.email;
        if (leadData.phone) updateData.phone_number = leadData.phone;
        if (leadData.name) updateData.name = leadData.name;
        if (Object.keys(updateData).length > 0) {
          await chatwootClient.updateContact(contactId, updateData);
        }
      }
    }

    // Handle handoff or send response
    if (!aiResponse.resolved && aiResponse.handoffReason) {
      await chatwootClient.sendMessage(conversationId, aiResponse.content);

      // Add internal note with handoff context
      await chatwootClient.sendMessage(
        conversationId,
        `🤖 AI Handoff — Reason: ${aiResponse.handoffReason} | Intent: ${aiResponse.detectedIntent || 'unknown'} | Language: ${aiResponse.detectedLanguage} | Confidence: ${(aiResponse.confidence * 100).toFixed(0)}%`,
        true, // private note
      );

      await chatwootClient.handoffConversation(
        conversationId,
        '', // Already sent the message above
      );

      await chatwootClient.addLabel(conversationId, 'ai-handoff');

      logger.info({ conversationId, reason: aiResponse.handoffReason }, 'Conversation handed off to human');
    } else {
      // Send AI response to guest
      await chatwootClient.sendMessage(conversationId, aiResponse.content);

      logger.info(
        { conversationId, latencyMs: aiResponse.latencyMs, confidence: aiResponse.confidence },
        'AI response sent',
      );
    }
  }
}

export const webhookHandler = new WebhookHandler();
