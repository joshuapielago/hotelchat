'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const categories = [
  { value: 'property_info', label: 'Property Info' },
  { value: 'rooms_rates', label: 'Rooms & Rates' },
  { value: 'amenities_services', label: 'Amenities & Services' },
  { value: 'policies', label: 'Policies' },
  { value: 'location_transport', label: 'Location & Transport' },
  { value: 'dining', label: 'Dining' },
  { value: 'custom_faq', label: 'Custom FAQ' },
  { value: 'promotions', label: 'Promotions' },
];

interface KnowledgeEntryFormProps {
  entry?: {
    id: string;
    category: string;
    question: string;
    answer: string;
    language: string;
    active: boolean;
    tags: string[];
    sortOrder: number;
  };
  hotelId: string;
}

export default function KnowledgeEntryForm({ entry, hotelId }: KnowledgeEntryFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const form = new FormData(e.currentTarget);
    const data = {
      hotelId,
      category: form.get('category') as string,
      question: form.get('question') as string,
      answer: form.get('answer') as string,
      language: form.get('language') as string,
      active: form.get('active') === 'on',
      tags: (form.get('tags') as string).split(',').map((t) => t.trim()).filter(Boolean),
      sortOrder: parseInt(form.get('sortOrder') as string, 10) || 0,
    };

    const url = entry ? `/api/knowledge/${entry.id}` : '/api/knowledge';
    const method = entry ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error('Failed to save');
      router.push('/knowledge');
      router.refresh();
    } catch {
      setError('Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!entry || !confirm('Delete this entry?')) return;
    try {
      await fetch(`/api/knowledge/${entry.id}`, { method: 'DELETE' });
      router.push('/knowledge');
      router.refresh();
    } catch {
      setError('Failed to delete entry.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 max-w-2xl">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            name="category"
            defaultValue={entry?.category || 'custom_faq'}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ely-500 focus:border-ely-500"
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
          <select
            name="language"
            defaultValue={entry?.language || 'en'}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ely-500 focus:border-ely-500"
          >
            <option value="en">English</option>
            <option value="fil">Filipino (Tagalog)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
        <input
          name="question"
          defaultValue={entry?.question || ''}
          required
          placeholder="e.g., What are your check-in and check-out times?"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ely-500 focus:border-ely-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
        <textarea
          name="answer"
          defaultValue={entry?.answer || ''}
          required
          rows={5}
          placeholder="Provide the answer the AI should give when asked this question..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ely-500 focus:border-ely-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
          <input
            name="tags"
            defaultValue={entry?.tags?.join(', ') || ''}
            placeholder="e.g., checkin, hours, schedule"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ely-500 focus:border-ely-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
          <input
            name="sortOrder"
            type="number"
            defaultValue={entry?.sortOrder || 0}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ely-500 focus:border-ely-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          name="active"
          type="checkbox"
          defaultChecked={entry?.active ?? true}
          className="rounded border-gray-300 text-ely-600 focus:ring-ely-500"
        />
        <label className="text-sm text-gray-700">Active (visible to AI)</label>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div>
          {entry && (
            <button type="button" onClick={handleDelete} className="text-red-600 hover:text-red-700 text-sm">
              Delete entry
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-ely-600 text-white rounded-lg text-sm hover:bg-ely-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : entry ? 'Update Entry' : 'Create Entry'}
          </button>
        </div>
      </div>
    </form>
  );
}
