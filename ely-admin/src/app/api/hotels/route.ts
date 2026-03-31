import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const hotels = await db.hotel.findMany({ include: { config: true }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(hotels);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const hotel = await db.hotel.create({
    data: {
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      timezone: body.timezone || 'Asia/Manila',
      languages: body.languages || ['en', 'fil'],
      chatwootAccountId: body.chatwootAccountId,
      chatwootBotId: body.chatwootBotId,
      chatwootBotToken: body.chatwootBotToken,
      config: {
        create: {
          aiPersonality: body.aiPersonality || 'warm_professional',
          welcomeMessage: body.welcomeMessage,
          handoffMessage: body.handoffMessage || "Let me connect you with our team. They'll be with you shortly.",
          competitorBlocklist: body.competitorBlocklist || [],
        },
      },
    },
    include: { config: true },
  });

  return NextResponse.json(hotel, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  if (!body.id) return NextResponse.json({ error: 'Missing hotel id' }, { status: 400 });

  const hotel = await db.hotel.update({
    where: { id: body.id },
    data: {
      name: body.name,
      timezone: body.timezone,
      languages: body.languages,
      chatwootAccountId: body.chatwootAccountId,
      chatwootBotId: body.chatwootBotId,
      chatwootBotToken: body.chatwootBotToken,
      config: {
        upsert: {
          create: {
            aiPersonality: body.aiPersonality || 'warm_professional',
            welcomeMessage: body.welcomeMessage,
            handoffMessage: body.handoffMessage,
            competitorBlocklist: body.competitorBlocklist || [],
            activePromotions: body.activePromotions || [],
          },
          update: {
            aiPersonality: body.aiPersonality,
            welcomeMessage: body.welcomeMessage,
            handoffMessage: body.handoffMessage,
            competitorBlocklist: body.competitorBlocklist,
            activePromotions: body.activePromotions,
          },
        },
      },
    },
    include: { config: true },
  });

  return NextResponse.json(hotel);
}
