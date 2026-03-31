import { db } from '../utils/db';
import type { LeadData } from '../types';
import { logger } from '../utils/logger';

export class LeadService {
  // Extract lead data from AI response content
  extractLeadData(aiResponse: string, guestMessage: string): LeadData | null {
    const lead: LeadData = {};

    // Extract email from guest message
    const emailMatch = guestMessage.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
    if (emailMatch) lead.email = emailMatch[0].toLowerCase();

    // Extract phone number (PH and international formats)
    const phonePatterns = [
      /(?:\+63|0)[\s-]?(?:9\d{2})[\s-]?\d{3}[\s-]?\d{4}/,  // PH mobile
      /(?:\+61|0)[\s-]?\d[\s-]?\d{4}[\s-]?\d{4}/,            // AU
      /\+\d{1,3}[\s-]?\d{4,14}/,                               // International
    ];

    for (const pattern of phonePatterns) {
      const match = guestMessage.match(pattern);
      if (match) {
        lead.phone = match[0].replace(/[\s-]/g, '');
        break;
      }
    }

    // Extract name if offered (simple heuristic)
    const namePatterns = [
      /(?:my name is|i'm|i am|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
      /(?:name|Name)\s*:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
    ];

    for (const pattern of namePatterns) {
      const match = guestMessage.match(pattern);
      if (match) {
        lead.name = match[1].trim();
        break;
      }
    }

    return (lead.email || lead.phone || lead.name) ? lead : null;
  }

  async saveLead(
    hotelId: string,
    conversationId: number,
    contactId: number | undefined,
    leadData: LeadData,
    sourceChannel?: string,
  ): Promise<void> {
    try {
      // De-duplicate: check if we already have this lead
      const existing = await db.lead.findFirst({
        where: {
          hotelId,
          OR: [
            leadData.email ? { email: leadData.email } : {},
            leadData.phone ? { phone: leadData.phone } : {},
          ].filter((c) => Object.keys(c).length > 0),
        },
      });

      if (existing) {
        // Update existing lead with any new info
        await db.lead.update({
          where: { id: existing.id },
          data: {
            email: leadData.email || existing.email,
            phone: leadData.phone || existing.phone,
            name: leadData.name || existing.name,
            intent: leadData.intent || existing.intent,
            chatwootConversationId: conversationId,
          },
        });
        logger.info({ leadId: existing.id, hotelId }, 'Updated existing lead');
      } else {
        await db.lead.create({
          data: {
            hotelId,
            chatwootConversationId: conversationId,
            chatwootContactId: contactId,
            email: leadData.email,
            phone: leadData.phone,
            name: leadData.name,
            intent: leadData.intent,
            sourceChannel,
          },
        });
        logger.info({ hotelId, conversationId }, 'New lead captured');
      }
    } catch (err) {
      logger.error({ err, hotelId, conversationId }, 'Failed to save lead');
    }
  }
}

export const leadService = new LeadService();
