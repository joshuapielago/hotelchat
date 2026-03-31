'use client';

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  intent: string | null;
  sourceChannel: string | null;
  capturedAt: string | Date;
}

export default function LeadsTable({ leads }: { leads: Lead[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Intent</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Channel</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Captured</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">{lead.name || '—'}</td>
              <td className="px-4 py-3 text-ely-600">{lead.email || '—'}</td>
              <td className="px-4 py-3">{lead.phone || '—'}</td>
              <td className="px-4 py-3">
                {lead.intent ? (
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">
                    {lead.intent.replace(/_/g, ' ')}
                  </span>
                ) : '—'}
              </td>
              <td className="px-4 py-3">
                {lead.sourceChannel ? (
                  <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs">
                    {lead.sourceChannel}
                  </span>
                ) : '—'}
              </td>
              <td className="px-4 py-3 text-gray-500">
                {new Date(lead.capturedAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
