import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const severity = searchParams.get('severity');
  const type = searchParams.get('type');

  const hotel = await db.hotel.findFirst({ where: { active: true } });
  if (!hotel) return NextResponse.json({ events: [], total: 0 });

  const where = {
    hotelId: hotel.id,
    ...(severity ? { severity: severity as any } : {}),
    ...(type ? { type: type as any } : {}),
  };

  const [events, total, bySeverity, byType] = await Promise.all([
    db.guardrailEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.guardrailEvent.count({ where }),
    db.guardrailEvent.groupBy({ by: ['severity'], where: { hotelId: hotel.id }, _count: true }),
    db.guardrailEvent.groupBy({ by: ['type'], where: { hotelId: hotel.id }, _count: true, orderBy: { _count: { type: 'desc' } } }),
  ]);

  return NextResponse.json({
    events,
    total,
    page,
    limit,
    summary: {
      bySeverity: bySeverity.map((s) => ({ severity: s.severity, count: s._count })),
      byType: byType.map((t) => ({ type: t.type, count: t._count })),
    },
  });
}
