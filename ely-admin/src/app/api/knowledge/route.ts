import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const entry = await db.knowledgeEntry.create({
    data: {
      hotelId: body.hotelId,
      category: body.category,
      question: body.question,
      answer: body.answer,
      language: body.language || 'en',
      active: body.active ?? true,
      tags: body.tags || [],
      sortOrder: body.sortOrder || 0,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
