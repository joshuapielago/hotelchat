import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import KnowledgeEntryForm from '@/components/KnowledgeEntryForm';

export default async function EditKnowledgeEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await db.knowledgeEntry.findUnique({ where: { id } });

  if (!entry) return notFound();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Edit Knowledge Base Entry</h2>
      <KnowledgeEntryForm
        hotelId={entry.hotelId}
        entry={{
          id: entry.id,
          category: entry.category,
          question: entry.question,
          answer: entry.answer,
          language: entry.language,
          active: entry.active,
          tags: entry.tags,
          sortOrder: entry.sortOrder,
        }}
      />
    </div>
  );
}
