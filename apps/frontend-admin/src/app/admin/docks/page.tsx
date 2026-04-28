'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/api';

interface Dock { id: string; name: string; user_id: string; created_at: string }

export default function AdminDocksPage() {
  const router = useRouter();
  const [items, setItems] = useState<Dock[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.push('/admin/login'); return; }
    adminApi.docks().then((d) => setItems(d as Dock[])).catch((e) => setError(String(e)));
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/overview" className="text-gray-500 hover:text-amber-400">← Back</Link>
          <h1 className="text-2xl font-bold text-amber-400">All Docks</h1>
        </div>
        {error && <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4 text-red-300 text-sm">{error}</div>}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-gray-800">
              {['Name', 'User ID', 'Created'].map((c) => <th key={c} className="px-4 py-3 text-left text-xs text-gray-400 font-semibold uppercase">{c}</th>)}
            </tr></thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id} className="border-t border-gray-800">
                  <td className="px-4 py-2 text-sm text-gray-300">{d.name}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{d.user_id}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{new Date(d.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
