'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/api';

interface Task { id: string; intent: string; status: string; result: string | null; user_id: string; created_at: string }

export default function AdminTasksPage() {
  const router = useRouter();
  const [items, setItems] = useState<Task[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.push('/admin/login'); return; }
    adminApi.tasks().then((d) => setItems(d as Task[])).catch((e) => setError(String(e)));
  }, [router]);

  const statusColor: Record<string, string> = { pending: 'text-yellow-400', running: 'text-blue-400', complete: 'text-green-400', failed: 'text-red-400' };

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/overview" className="text-gray-500 hover:text-amber-400">← Back</Link>
          <h1 className="text-2xl font-bold text-amber-400">All Tasks</h1>
        </div>
        {error && <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4 text-red-300 text-sm">{error}</div>}
        <div className="space-y-3">
          {items.map((t) => (
            <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm text-gray-200 font-medium">{t.intent}</p>
                <span className={`text-xs font-bold ${statusColor[t.status] ?? 'text-gray-400'}`}>{t.status.toUpperCase()}</span>
              </div>
              {t.result && <p className="text-xs text-gray-400 bg-gray-800 rounded p-2 mt-1">{t.result}</p>}
              <div className="flex gap-4 mt-2 text-xs text-gray-600">
                <span>User: {t.user_id.slice(0, 8)}…</span>
                <span>{new Date(t.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-gray-500 text-sm">No tasks yet.</p>}
        </div>
      </div>
    </div>
  );
}
