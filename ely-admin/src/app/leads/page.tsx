import { db } from '@/lib/db';
import LeadsTable from '@/components/LeadsTable';

async function getLeads() {
  const hotel = await db.hotel.findFirst({ where: { active: true } });
  if (!hotel) return { leads: [], total: 0, hotel: null };

  const [leads, total] = await Promise.all([
    db.lead.findMany({
      where: { hotelId: hotel.id },
      orderBy: { capturedAt: 'desc' },
      take: 50,
    }),
    db.lead.count({ where: { hotelId: hotel.id } }),
  ]);

  return { leads, total, hotel };
}

export default async function LeadsPage() {
  const { leads, total, hotel } = await getLeads();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Leads</h2>
          <p className="text-gray-500 mt-1">{total} total leads captured</p>
        </div>
        <a
          href="/api/leads/export"
          className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
        >
          Export CSV
        </a>
      </div>

      {!hotel ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-amber-800">
          No hotel configured yet.
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center text-gray-500">
          <p className="text-lg font-medium">No leads captured yet</p>
          <p className="mt-2">Leads are captured automatically during AI conversations.</p>
        </div>
      ) : (
        <LeadsTable leads={leads} />
      )}
    </div>
  );
}
