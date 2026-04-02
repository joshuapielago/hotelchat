import Link from 'next/link';
import { db } from '@/lib/db';

const categoryLabels: Record<string, string> = {
  property_info: 'Property Info',
  rooms_rates: 'Rooms & Rates',
  amenities_services: 'Amenities & Services',
  policies: 'Policies',
  location_transport: 'Location & Transport',
  dining: 'Dining',
  custom_faq: 'Custom FAQ',
  promotions: 'Promotions',
};

async function getEntries(hotelId?: string) {
  const hotel = await db.hotel.findFirst({ where: { active: true } });
  if (!hotel) return { entries: [], hotel: null };

  const entries = await db.knowledgeEntry.findMany({
    where: { hotelId: hotel.id },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  });

  return { entries, hotel };
}

export default async function KnowledgeBasePage() {
  const { entries, hotel } = await getEntries();

  const grouped = entries.reduce(
    (acc, entry) => {
      const cat = entry.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(entry);
      return acc;
    },
    {} as Record<string, typeof entries>,
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Knowledge Base</h2>
          {hotel && <p className="text-gray-500 mt-1">{hotel.name}</p>}
        </div>
        <Link
          href="/knowledge/new"
          className="bg-ely-600 text-white px-4 py-2 rounded-lg hover:bg-ely-700 transition-colors"
        >
          + Add Entry
        </Link>
      </div>

      {!hotel ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-amber-800">
          No hotel configured yet. Go to Settings to create one.
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center text-gray-500">
          <p className="text-lg font-medium">No knowledge base entries yet</p>
          <p className="mt-2">Add FAQ entries to train your AI assistant.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-3 text-ely-800">
                {categoryLabels[category] || category}
                <span className="text-sm font-normal text-gray-400 ml-2">({items.length})</span>
              </h3>
              <div className="space-y-2">
                {items.map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/knowledge/${entry.id}`}
                    className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-ely-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{entry.question}</p>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{entry.answer}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">{entry.language}</span>
                        {!entry.active && (
                          <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-600">Inactive</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
