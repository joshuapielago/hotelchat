import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const hotel = await db.hotel.findFirst({ where: { active: true } });
  if (!hotel) return new NextResponse('No hotel configured', { status: 404 });

  const leads = await db.lead.findMany({
    where: { hotelId: hotel.id },
    orderBy: { capturedAt: 'desc' },
  });

  const headers = ['Name', 'Email', 'Phone', 'Intent', 'Source Channel', 'Captured At'];
  const rows = leads.map((l) => [
    l.name || '',
    l.email || '',
    l.phone || '',
    l.intent || '',
    l.sourceChannel || '',
    l.capturedAt.toISOString(),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="ely-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
