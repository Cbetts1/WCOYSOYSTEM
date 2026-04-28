'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/api';

interface ArrowJob { id: string; task_id: string; status: string; result: string | null; created_at: string }

export default function AdminArrowJobsPage() {
  const router = useRouter();
  const [items, setItems] = useState<ArrowJob[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.push('/admin/login'); return; }
    adminApi.arrowJobs().then((d) => setItems(d as ArrowJob[])).catch((e) => setError(String(e)));
  }, [router]);

  const statusColor: Record<string, string> = { pending: 'text-yellow-400', running: 'text-blue-400', complete: 'text-green-400', failed: 'text-red-400' };

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/overview" className="text-gray-500 hover:text-amber-400">← Back</Link>
          <h1 className="text-2xl font-bold text-amber-400">Arrow Jobs</h1>
        </div>
        {error && <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4 text-red-300 text-sm">{error}</div>}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-gray-800">
              {['Job ID', 'Task', 'Status', 'Result', 'Created'].map((c) => <th key={c} className="px-4 py-3 text-left text-xs text-gray-400 font-semibold uppercase">{c}</th>)}
            </tr></thead>
            <tbody>
              {items.map((j) => (
                <tr key={j.id} className="border-t border-gray-800">
                  <td className="px-4 py-2 text-xs text-gray-400">{j.id.slice(0, 12)}…</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{j.task_id.slice(0, 8)}…</td>
                  <td className={`px-4 py-2 text-xs font-semibold ${statusColor[j.status] ?? 'text-gray-400'}`}>{j.status}</td>
                  <td className="px-4 py-2 text-xs text-gray-400 max-w-xs truncate">{j.result ?? '—'}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{new Date(j.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500 text-sm">No jobs yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
