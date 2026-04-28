'use client';
import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Task {
  id: string;
  intent: string;
  status: string;
  result: string | null;
  created_at: string;
}

interface Dock {
  id: string;
  name: string;
}

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [docks, setDocks] = useState<Dock[]>([]);
  const [intent, setIntent] = useState('');
  const [dockId, setDockId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/auth/login'); return; }
    loadTasks();
    loadDocks();
  }, [router]);

  async function loadTasks() {
    try {
      const data = await api.listTasks();
      setTasks(data as Task[]);
    } catch (err) { setError(String(err)); }
  }

  async function loadDocks() {
    try {
      const data = await api.listDocks();
      setDocks(data as Dock[]);
    } catch (err) { /* ignore */ }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!intent.trim()) return;
    setError('');
    setSubmitting(true);
    try {
      await api.submitIntent(intent, dockId || undefined);
      setIntent('');
      await loadTasks();
      // Poll for result
      setPolling(true);
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        await loadTasks();
        if (attempts >= 10) {
          clearInterval(poll);
          setPolling(false);
        }
      }, 2000);
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  }

  const statusColor: Record<string, string> = {
    pending: 'text-yellow-400',
    running: 'text-blue-400',
    complete: 'text-green-400',
    failed: 'text-red-400',
  };

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="text-gray-500 hover:text-indigo-400">← Dashboard</Link>
          <h1 className="text-2xl font-bold text-indigo-400">Tasks & Intents</h1>
          {polling && <span className="text-xs text-blue-400 animate-pulse">Polling for results…</span>}
        </div>
        {error && <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4 text-red-300 text-sm">{error}</div>}

        {/* Intent form */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Submit Intent to AURA</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder='e.g. "Analyze my dock and suggest next actions"'
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 text-sm focus:outline-none focus:border-indigo-500 resize-none"
            />
            <div className="flex gap-3">
              <select
                value={dockId}
                onChange={(e) => setDockId(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 text-sm focus:outline-none"
              >
                <option value="">No dock (optional)</option>
                {docks.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50 transition"
              >
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </form>
        </div>

        {/* Task history */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Task History</h2>
          {tasks.length === 0 && <p className="text-gray-500 text-sm">No tasks yet.</p>}
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm text-gray-200 font-medium">{task.intent}</p>
                  <span className={`text-xs font-bold ${statusColor[task.status] ?? 'text-gray-400'}`}>
                    {task.status.toUpperCase()}
                  </span>
                </div>
                {task.result && (
                  <p className="text-xs text-gray-400 mt-1 bg-gray-900 rounded p-2">{task.result}</p>
                )}
                <p className="text-xs text-gray-600 mt-1">{new Date(task.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
