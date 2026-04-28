'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/api';

interface Health { status: string; uptime: number }

const NAV_LINKS = [
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/docks', label: 'Docks' },
  { href: '/admin/vms', label: 'VMs' },
  { href: '/admin/tasks', label: 'Tasks' },
  { href: '/admin/arrow-jobs', label: 'Arrow Jobs' },
];

export default function AdminOverviewPage() {
  const router = useRouter();
  const [health, setHealth] = useState<Health | null>(null);
  const [nodes, setNodes] = useState<unknown[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) { router.push('/admin/login'); return; }
    adminApi.health().then((h) => setHealth(h as Health)).catch((e) => setError(String(e)));
    adminApi.nodes().then(setNodes).catch(() => {});
  }, [router]);

  function logout() { localStorage.removeItem('adminToken'); router.push('/admin/login'); }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-amber-400">VAGA Admin</h1>
          <button onClick={logout} className="text-sm text-gray-400 hover:text-red-400">Logout</button>
        </div>
        {error && <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4 text-red-300 text-sm">{error}</div>}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {NAV_LINKS.map((n) => (
            <Link key={n.href} href={n.href}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center hover:border-amber-600 transition">
              <span className="text-sm font-semibold text-gray-200">{n.label}</span>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3">System Health</h2>
            {health ? (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Status</span><span className="text-green-400 font-semibold">{health.status}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Uptime</span><span className="text-gray-200">{Math.floor(health.uptime)}s</span></div>
              </div>
            ) : <p className="text-gray-500 text-sm">Loading…</p>}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3">AIM Nodes</h2>
            <div className="space-y-1">
              {(nodes as Array<{ nodeId: string; name: string; type: string }>).map((n) => (
                <div key={n.nodeId} className="flex justify-between text-sm">
                  <span className="text-gray-300">{n.name}</span>
                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">{n.type}</span>
                </div>
              ))}
              {nodes.length === 0 && <p className="text-gray-500 text-sm">No nodes registered.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
