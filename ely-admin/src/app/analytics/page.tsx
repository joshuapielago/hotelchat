import { db } from '@/lib/db';

async function getAnalytics() {
  const hotel = await db.hotel.findFirst({ where: { active: true } });
  if (!hotel) return null;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const where = { hotelId: hotel.id, createdAt: { gte: thirtyDaysAgo } };

  const [total, resolved, avgStats, handoffReasons, languages, intents] = await Promise.all([
    db.aIInteractionLog.count({ where }),
    db.aIInteractionLog.count({ where: { ...where, resolved: true } }),
    db.aIInteractionLog.aggregate({ where, _avg: { latencyMs: true, inputTokens: true, outputTokens: true } }),
    db.aIInteractionLog.groupBy({
      by: ['handoffReason'],
      where: { ...where, resolved: false, handoffReason: { not: null } },
      _count: true,
      orderBy: { _count: { handoffReason: 'desc' } },
      take: 10,
    }),
    db.aIInteractionLog.groupBy({ by: ['detectedLanguage'], where, _count: true }),
    db.aIInteractionLog.groupBy({
      by: ['detectedIntent'],
      where: { ...where, detectedIntent: { not: null } },
      _count: true,
      orderBy: { _count: { detectedIntent: 'desc' } },
      take: 10,
    }),
  ]);

  const resolutionRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : '0';
  const handoffRate = total > 0 ? (((total - resolved) / total) * 100).toFixed(1) : '0';
  const costPerConversation = (
    ((avgStats._avg.inputTokens || 0) / 1_000_000) * 1 +
    ((avgStats._avg.outputTokens || 0) / 1_000_000) * 5
  );

  return {
    hotel,
    total,
    resolved,
    resolutionRate,
    handoffRate,
    avgLatencyMs: Math.round(avgStats._avg.latencyMs || 0),
    costPerConversation: costPerConversation.toFixed(4),
    handoffReasons,
    languages,
    intents,
  };
}

export default async function AnalyticsPage() {
  const data = await getAnalytics();

  if (!data) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-amber-800">
        No hotel configured yet.
      </div>
    );
  }

  const metrics = [
    { label: 'Total AI Conversations', value: data.total.toLocaleString() },
    { label: 'AI Resolution Rate', value: `${data.resolutionRate}%`, highlight: parseFloat(data.resolutionRate) >= 50 },
    { label: 'Handoff Rate', value: `${data.handoffRate}%` },
    { label: 'Avg Response Time', value: `${data.avgLatencyMs}ms`, highlight: data.avgLatencyMs < 3000 },
    { label: 'Cost per Conversation', value: `$${data.costPerConversation}` },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">AI Analytics</h2>
      <p className="text-gray-500 mb-6">Last 30 days &middot; {data.hotel.name}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{m.label}</p>
            <p className={`text-2xl font-bold mt-1 ${m.highlight === true ? 'text-green-600' : m.highlight === false ? 'text-red-600' : ''}`}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold mb-4">Top Handoff Reasons</h3>
          {data.handoffReasons.length === 0 ? (
            <p className="text-gray-400 text-sm">No handoffs recorded</p>
          ) : (
            <div className="space-y-2">
              {data.handoffReasons.map((r) => (
                <div key={r.handoffReason} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{r.handoffReason}</span>
                  <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{r._count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold mb-4">Top Guest Intents</h3>
          {data.intents.length === 0 ? (
            <p className="text-gray-400 text-sm">No intents detected</p>
          ) : (
            <div className="space-y-2">
              {data.intents.map((i) => (
                <div key={i.detectedIntent} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{i.detectedIntent?.replace(/_/g, ' ')}</span>
                  <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{i._count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold mb-4">Language Distribution</h3>
          {data.languages.length === 0 ? (
            <p className="text-gray-400 text-sm">No data</p>
          ) : (
            <div className="space-y-2">
              {data.languages.map((l) => (
                <div key={l.detectedLanguage} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{l.detectedLanguage === 'fil' ? 'Filipino' : 'English'}</span>
                  <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{l._count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
