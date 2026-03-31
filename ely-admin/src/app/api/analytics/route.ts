import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') || '30', 10);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const hotel = await db.hotel.findFirst({ where: { active: true } });
  if (!hotel) return NextResponse.json({ error: 'No hotel' }, { status: 404 });

  const where = { hotelId: hotel.id, createdAt: { gte: since } };

  const [total, resolved, avgLatency, handoffReasons, languages, intents] = await Promise.all([
    db.aIInteractionLog.count({ where }),
    db.aIInteractionLog.count({ where: { ...where, resolved: true } }),
    db.aIInteractionLog.aggregate({ where, _avg: { latencyMs: true, inputTokens: true, outputTokens: true } }),
    db.aIInteractionLog.groupBy({ by: ['handoffReason'], where: { ...where, resolved: false, handoffReason: { not: null } }, _count: true, orderBy: { _count: { handoffReason: 'desc' } } }),
    db.aIInteractionLog.groupBy({ by: ['detectedLanguage'], where, _count: true }),
    db.aIInteractionLog.groupBy({ by: ['detectedIntent'], where: { ...where, detectedIntent: { not: null } }, _count: true, orderBy: { _count: { detectedIntent: 'desc' } }, take: 10 }),
  ]);

  const resolutionRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : '0';
  const avgCostPerConversation = (
    ((avgLatency._avg.inputTokens || 0) / 1_000_000) * 1 +
    ((avgLatency._avg.outputTokens || 0) / 1_000_000) * 5
  );

  return NextResponse.json({
    total,
    resolved,
    resolutionRate,
    avgLatencyMs: Math.round(avgLatency._avg.latencyMs || 0),
    avgCostPerConversation: avgCostPerConversation.toFixed(4),
    handoffReasons: handoffReasons.map((r) => ({ reason: r.handoffReason, count: r._count })),
    languages: languages.map((l) => ({ language: l.detectedLanguage, count: l._count })),
    topIntents: intents.map((i) => ({ intent: i.detectedIntent, count: i._count })),
  });
}
