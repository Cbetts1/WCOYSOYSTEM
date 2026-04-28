'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/api';

interface User { id: string; email: string; role: string; created_at: string }

export default function AdminUsersPage() {
  const router = useRouter();
  const [items, setItems] = useState<User[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.push('/admin/login'); return; }
    adminApi.users().then((d) => setItems(d as User[])).catch((e) => setError(String(e)));
  }, [router]);

  return (
    <AdminTable title="Users" backHref="/admin/overview" error={error} columns={['Email', 'Role', 'Created']}>
      {items.map((u) => (
        <tr key={u.id} className="border-t border-gray-800">
          <td className="px-4 py-2 text-sm text-gray-300">{u.email}</td>
          <td className="px-4 py-2 text-sm"><span className={`px-2 py-0.5 rounded text-xs ${u.role === 'admin' ? 'bg-amber-900/50 text-amber-300' : 'bg-gray-800 text-gray-400'}`}>{u.role}</span></td>
          <td className="px-4 py-2 text-xs text-gray-500">{new Date(u.created_at).toLocaleString()}</td>
        </tr>
      ))}
    </AdminTable>
  );
}

function AdminTable({ title, backHref, error, columns, children }: {
  title: string; backHref: string; error: string; columns: string[]; children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href={backHref} className="text-gray-500 hover:text-amber-400">← Back</Link>
          <h1 className="text-2xl font-bold text-amber-400">{title}</h1>
        </div>
        {error && <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4 text-red-300 text-sm">{error}</div>}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-gray-800">{columns.map((c) => <th key={c} className="px-4 py-3 text-left text-xs text-gray-400 font-semibold uppercase">{c}</th>)}</tr></thead>
            <tbody>{children}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
