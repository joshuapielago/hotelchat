import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get('hotelId');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const search = searchParams.get('search') || '';

  const hotel = hotelId
    ? await db.hotel.findUnique({ where: { id: hotelId } })
    : await db.hotel.findFirst({ where: { active: true } });

  if (!hotel) return NextResponse.json({ leads: [], total: 0 });

  const where = {
    hotelId: hotel.id,
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search } },
            { name: { contains: search, mode: 'insensitive' as const } },
            { intent: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [leads, total] = await Promise.all([
    db.lead.findMany({
      where,
      orderBy: { capturedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.lead.count({ where }),
  ]);

  return NextResponse.json({ leads, total, page, limit });
}
