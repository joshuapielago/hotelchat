import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const entry = await db.knowledgeEntry.update({
    where: { id },
    data: {
      category: body.category,
      question: body.question,
      answer: body.answer,
      language: body.language,
      active: body.active,
      tags: body.tags,
      sortOrder: body.sortOrder,
      version: { increment: 1 },
    },
  });

  return NextResponse.json(entry);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.knowledgeEntry.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
