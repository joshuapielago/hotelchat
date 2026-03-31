import { db } from '../utils/db';
import type { KnowledgeContext } from '../types';
import { logger } from '../utils/logger';

export class KnowledgeService {
  async getContextForHotel(hotelId: string, language = 'en'): Promise<KnowledgeContext | null> {
    const hotel = await db.hotel.findUnique({
      where: { id: hotelId },
      include: {
        config: true,
        knowledgeEntries: {
          where: { active: true, language },
          orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
        },
      },
    });

    if (!hotel) {
      logger.warn({ hotelId }, 'Hotel not found');
      return null;
    }

    return {
      hotelName: hotel.name,
      entries: hotel.knowledgeEntries.map((e) => ({
        category: e.category,
        question: e.question,
        answer: e.answer,
      })),
      config: {
        personality: hotel.config?.aiPersonality || 'warm_professional',
        welcomeMessage: hotel.config?.welcomeMessage || undefined,
        handoffMessage: hotel.config?.handoffMessage || "Let me connect you with our team. They'll be with you shortly.",
        competitorBlocklist: hotel.config?.competitorBlocklist || [],
        activePromotions: hotel.config?.activePromotions || [],
      },
    };
  }

  formatKnowledgeBase(context: KnowledgeContext): string {
    if (context.entries.length === 0) {
      return 'No knowledge base entries available.';
    }

    const grouped = new Map<string, Array<{ question: string; answer: string }>>();

    for (const entry of context.entries) {
      const category = entry.category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      if (!grouped.has(category)) grouped.set(category, []);
      grouped.get(category)!.push({ question: entry.question, answer: entry.answer });
    }

    const sections: string[] = [];
    for (const [category, entries] of grouped) {
      const qaPairs = entries.map((e) => `Q: ${e.question}\nA: ${e.answer}`).join('\n\n');
      sections.push(`## ${category}\n\n${qaPairs}`);
    }

    return sections.join('\n\n---\n\n');
  }
}

export const knowledgeService = new KnowledgeService();
