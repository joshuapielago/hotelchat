import { db } from '@/lib/db';
import KnowledgeEntryForm from '@/components/KnowledgeEntryForm';

export default async function NewKnowledgeEntryPage() {
  const hotel = await db.hotel.findFirst({ where: { active: true } });

  if (!hotel) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-amber-800">
        No hotel configured. Go to Settings first.
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Add Knowledge Base Entry</h2>
      <KnowledgeEntryForm hotelId={hotel.id} />
    </div>
  );
}
