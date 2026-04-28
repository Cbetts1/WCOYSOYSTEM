'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/api';

interface VM { id: string; name: string; type: string; status: string; dock_id: string; created_at: string }

export default function AdminVMsPage() {
  const router = useRouter();
  const [items, setItems] = useState<VM[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.push('/admin/login'); return; }
    adminApi.vms().then((d) => setItems(d as VM[])).catch((e) => setError(String(e)));
  }, [router]);

  const statusColor: Record<string, string> = { running: 'text-green-400', stopped: 'text-gray-500', error: 'text-red-400' };

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/overview" className="text-gray-500 hover:text-amber-400">← Back</Link>
          <h1 className="text-2xl font-bold text-amber-400">All VMs</h1>
        </div>
        {error && <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4 text-red-300 text-sm">{error}</div>}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-gray-800">
              {['Name', 'Type', 'Status', 'Dock', 'Created'].map((c) => <th key={c} className="px-4 py-3 text-left text-xs text-gray-400 font-semibold uppercase">{c}</th>)}
            </tr></thead>
            <tbody>
              {items.map((v) => (
                <tr key={v.id} className="border-t border-gray-800">
                  <td className="px-4 py-2 text-sm text-gray-300">{v.name}</td>
                  <td className="px-4 py-2 text-xs text-gray-400">{v.type}</td>
                  <td className={`px-4 py-2 text-xs font-semibold ${statusColor[v.status] ?? 'text-gray-400'}`}>{v.status}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{v.dock_id.slice(0, 8)}…</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{new Date(v.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
