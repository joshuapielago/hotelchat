'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface HotelData {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  languages: string[];
  chatwootAccountId: number;
  chatwootBotId: number | null;
  chatwootBotToken: string | null;
  config: {
    aiPersonality: string;
    welcomeMessage: string | null;
    handoffMessage: string;
    competitorBlocklist: string[];
    activePromotions: unknown;
    confidenceThreshold: number;
    maxHistoryTurns: number;
  } | null;
}

const personalities = [
  { value: 'warm_professional', label: 'Warm & Professional', desc: 'Like a skilled front desk agent' },
  { value: 'formal', label: 'Formal & Polished', desc: 'Like a luxury concierge' },
  { value: 'casual_friendly', label: 'Casual & Friendly', desc: 'Like a helpful local friend' },
];

export default function HotelSettingsForm({ hotel }: { hotel: HotelData | null }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const form = new FormData(e.currentTarget);
    const data = {
      id: hotel?.id,
      name: form.get('name') as string,
      slug: form.get('slug') as string,
      timezone: form.get('timezone') as string,
      languages: (form.get('languages') as string).split(',').map((l) => l.trim()),
      chatwootAccountId: parseInt(form.get('chatwootAccountId') as string, 10),
      chatwootBotId: form.get('chatwootBotId') ? parseInt(form.get('chatwootBotId') as string, 10) : null,
      chatwootBotToken: (form.get('chatwootBotToken') as string) || null,
      aiPersonality: form.get('aiPersonality') as string,
      welcomeMessage: (form.get('welcomeMessage') as string) || null,
      handoffMessage: form.get('handoffMessage') as string,
      competitorBlocklist: (form.get('competitorBlocklist') as string).split('\n').map((l) => l.trim()).filter(Boolean),
    };

    const method = hotel ? 'PUT' : 'POST';

    try {
      const res = await fetch('/api/hotels', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error('Failed to save');
      setSuccess('Settings saved successfully.');
      router.refresh();
    } catch {
      setError('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-8 max-w-2xl">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">{success}</div>}

      <section>
        <h3 className="text-lg font-semibold mb-4">Hotel Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Name</label>
            <input name="name" defaultValue={hotel?.name || ''} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ely-500 focus:border-ely-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input name="slug" defaultValue={hotel?.slug || ''} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ely-500 focus:border-ely-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <input name="timezone" defaultValue={hotel?.timezone || 'Asia/Manila'} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ely-500 focus:border-ely-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Languages (comma-separated)</label>
            <input name="languages" defaultValue={hotel?.languages?.join(', ') || 'en, fil'} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ely-500 focus:border-ely-500" />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">Chatwoot Integration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chatwoot Account ID</label>
            <input name="chatwootAccountId" type="number" defaultValue={hotel?.chatwootAccountId || ''} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ely-500 focus:border-ely-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bot ID</label>
              <input name="chatwootBotId" type="number" defaultValue={hotel?.chatwootBotId || ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ely-500 focus:border-ely-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bot Access Token</label>
              <input name="chatwootBotToken" type="password" defaultValue={hotel?.chatwootBotToken || ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ely-500 focus:border-ely-500" />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">AI Personality</h3>
        <div className="space-y-3">
          {personalities.map((p) => (
            <label key={p.value} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="aiPersonality"
                value={p.value}
                defaultChecked={(hotel?.config?.aiPersonality || 'warm_professional') === p.value}
                className="mt-1 text-ely-600 focus:ring-ely-500"
              />
              <div>
                <p className="text-sm font-medium">{p.label}</p>
                <p className="text-xs text-gray-500">{p.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">Messages</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Message (optional)</label>
            <textarea name="welcomeMessage" rows={2} defaultValue={hotel?.config?.welcomeMessage || ''} placeholder="Shown when a new conversation starts..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ely-500 focus:border-ely-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Handoff Message</label>
            <textarea name="handoffMessage" rows={2} defaultValue={hotel?.config?.handoffMessage || "Let me connect you with our team. They'll be with you shortly."} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ely-500 focus:border-ely-500" />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">Guardrails</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Competitor Blocklist (one per line)</label>
          <textarea
            name="competitorBlocklist"
            rows={4}
            defaultValue={hotel?.config?.competitorBlocklist?.join('\n') || ''}
            placeholder="Enter competitor hotel names, one per line..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ely-500 focus:border-ely-500"
          />
        </div>
      </section>

      <div className="pt-4 border-t border-gray-100">
        <button type="submit" disabled={saving} className="px-6 py-2 bg-ely-600 text-white rounded-lg text-sm hover:bg-ely-700 disabled:opacity-50">
          {saving ? 'Saving...' : hotel ? 'Update Settings' : 'Create Hotel'}
        </button>
      </div>
    </form>
  );
}
