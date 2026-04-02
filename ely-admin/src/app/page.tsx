import { db } from '@/lib/db';

async function getStats() {
  const [hotels, leads, interactions, guardrailEvents] = await Promise.all([
    db.hotel.count({ where: { active: true } }),
    db.lead.count(),
    db.aIInteractionLog.count(),
    db.guardrailEvent.count(),
  ]);

  const resolved = await db.aIInteractionLog.count({ where: { resolved: true } });
  const resolutionRate = interactions > 0 ? ((resolved / interactions) * 100).toFixed(1) : '0';

  const avgLatency = await db.aIInteractionLog.aggregate({ _avg: { latencyMs: true } });

  return { hotels, leads, interactions, guardrailEvents, resolutionRate, avgLatency: avgLatency._avg.latencyMs || 0 };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: 'Active Hotels', value: stats.hotels, color: 'bg-blue-500' },
    { label: 'Total Conversations', value: stats.interactions.toLocaleString(), color: 'bg-green-500' },
    { label: 'AI Resolution Rate', value: `${stats.resolutionRate}%`, color: 'bg-purple-500' },
    { label: 'Leads Captured', value: stats.leads.toLocaleString(), color: 'bg-amber-500' },
    { label: 'Avg Response Time', value: `${Math.round(stats.avgLatency)}ms`, color: 'bg-cyan-500' },
    { label: 'Guardrail Events', value: stats.guardrailEvents.toLocaleString(), color: 'bg-red-500' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${card.color}`} />
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
