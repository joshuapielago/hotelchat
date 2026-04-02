import { db } from '@/lib/db';

const severityColors: Record<string, string> = {
  low: 'bg-blue-50 text-blue-700',
  medium: 'bg-amber-50 text-amber-700',
  high: 'bg-orange-50 text-orange-700',
  critical: 'bg-red-50 text-red-700',
};

const typeLabels: Record<string, string> = {
  prompt_injection: 'Prompt Injection',
  hallucination: 'Hallucination',
  competitor_mention: 'Competitor Mention',
  off_topic: 'Off Topic',
  inappropriate_content: 'Inappropriate Content',
  system_prompt_leak: 'System Prompt Leak',
  payment_info: 'Payment Info',
  confidence_low: 'Low Confidence',
};

async function getGuardrailData() {
  const hotel = await db.hotel.findFirst({ where: { active: true } });
  if (!hotel) return null;

  const [events, total, bySeverity, byType] = await Promise.all([
    db.guardrailEvent.findMany({
      where: { hotelId: hotel.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    db.guardrailEvent.count({ where: { hotelId: hotel.id } }),
    db.guardrailEvent.groupBy({ by: ['severity'], where: { hotelId: hotel.id }, _count: true }),
    db.guardrailEvent.groupBy({
      by: ['type'],
      where: { hotelId: hotel.id },
      _count: true,
      orderBy: { _count: { type: 'desc' } },
    }),
  ]);

  return { events, total, bySeverity, byType, hotel };
}

export default async function GuardrailsPage() {
  const data = await getGuardrailData();

  if (!data) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-amber-800">
        No hotel configured yet.
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Guardrail Monitor</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {data.bySeverity.map((s) => (
          <div key={s.severity} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 capitalize">{s.severity}</p>
            <p className="text-2xl font-bold mt-1">{s._count}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-1">
          <h3 className="font-semibold mb-4">Events by Type</h3>
          <div className="space-y-2">
            {data.byType.map((t) => (
              <div key={t.type} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{typeLabels[t.type] || t.type}</span>
                <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{t._count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2">
          <h3 className="font-semibold mb-4">Recent Events ({data.total} total)</h3>
          {data.events.length === 0 ? (
            <p className="text-gray-400 text-sm">No guardrail events. The AI is behaving well.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.events.map((event) => (
                <div key={event.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${severityColors[event.severity] || 'bg-gray-100'}`}>
                      {event.severity}
                    </span>
                    <span className="text-xs text-gray-500">{typeLabels[event.type] || event.type}</span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(event.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {event.inputText && (
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      Input: {event.inputText}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Action: {event.action} | Conv #{event.chatwootConversationId}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
