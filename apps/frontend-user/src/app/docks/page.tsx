'use client';
import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Dock {
  id: string;
  name: string;
  created_at: string;
}

interface VM {
  id: string;
  name: string;
  type: string;
  status: string;
  created_at: string;
}

export default function DocksPage() {
  const router = useRouter();
  const [docks, setDocks] = useState<Dock[]>([]);
  const [selectedDock, setSelectedDock] = useState<Dock | null>(null);
  const [vms, setVMs] = useState<VM[]>([]);
  const [dockName, setDockName] = useState('');
  const [vmName, setVmName] = useState('');
  const [vmType, setVmType] = useState('analysis-vm');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/auth/login'); return; }
    loadDocks();
  }, [router]);

  async function loadDocks() {
    try {
      const data = await api.listDocks();
      setDocks(data as Dock[]);
    } catch (err) { setError(String(err)); }
  }

  async function loadVMs(dockId: string) {
    try {
      const data = await api.listVMs(dockId);
      setVMs(data as VM[]);
    } catch (err) { setError(String(err)); }
  }

  async function handleSelectDock(dock: Dock) {
    setSelectedDock(dock);
    await loadVMs(dock.id);
  }

  async function handleCreateDock(e: FormEvent) {
    e.preventDefault();
    try {
      await api.createDock(dockName || 'My Dock');
      setDockName('');
      await loadDocks();
    } catch (err) { setError(String(err)); }
  }

  async function handleCreateVM(e: FormEvent) {
    e.preventDefault();
    if (!selectedDock) return;
    try {
      await api.createVM(selectedDock.id, vmName || 'My VM', vmType);
      setVmName('');
      await loadVMs(selectedDock.id);
    } catch (err) { setError(String(err)); }
  }

  async function handleStartVM(vmId: string) {
    try { await api.startVM(vmId); await loadVMs(selectedDock!.id); }
    catch (err) { setError(String(err)); }
  }

  async function handleStopVM(vmId: string) {
    try { await api.stopVM(vmId); await loadVMs(selectedDock!.id); }
    catch (err) { setError(String(err)); }
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="text-gray-500 hover:text-indigo-400">← Dashboard</Link>
          <h1 className="text-2xl font-bold text-indigo-400">Docks & VMs</h1>
        </div>
        {error && <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4 text-red-300 text-sm">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Docks panel */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Your Docks</h2>
            <form onSubmit={handleCreateDock} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Dock name"
                value={dockName}
                onChange={(e) => setDockName(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 text-sm focus:outline-none focus:border-indigo-500"
              />
              <button type="submit" className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm">
                + Create
              </button>
            </form>
            <div className="space-y-2">
              {docks.length === 0 && <p className="text-gray-500 text-sm">No docks yet.</p>}
              {docks.map((dock) => (
                <button
                  key={dock.id}
                  onClick={() => handleSelectDock(dock)}
                  className={`w-full text-left px-4 py-2 rounded-lg border transition text-sm ${
                    selectedDock?.id === dock.id
                      ? 'border-indigo-500 bg-indigo-900/30 text-indigo-300'
                      : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-indigo-600'
                  }`}
                >
                  <span className="font-medium">{dock.name}</span>
                  <span className="text-gray-500 ml-2 text-xs">{dock.id.slice(0, 8)}…</span>
                </button>
              ))}
            </div>
          </div>

          {/* VMs panel */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              {selectedDock ? `VMs in "${selectedDock.name}"` : 'Select a dock'}
            </h2>
            {selectedDock && (
              <>
                <form onSubmit={handleCreateVM} className="flex flex-col gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="VM name"
                    value={vmName}
                    onChange={(e) => setVmName(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex gap-2">
                    <select
                      value={vmType}
                      onChange={(e) => setVmType(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 text-sm focus:outline-none"
                    >
                      <option value="analysis-vm">analysis-vm</option>
                      <option value="automation-vm">automation-vm</option>
                      <option value="knowledge-vm">knowledge-vm</option>
                    </select>
                    <button type="submit" className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm">
                      + VM
                    </button>
                  </div>
                </form>
                <div className="space-y-2">
                  {vms.length === 0 && <p className="text-gray-500 text-sm">No VMs yet.</p>}
                  {vms.map((vm) => (
                    <div
                      key={vm.id}
                      className="flex items-center justify-between px-4 py-2 rounded-lg bg-gray-800 border border-gray-700"
                    >
                      <div>
                        <span className="text-sm font-medium text-gray-100">{vm.name}</span>
                        <span className="ml-2 text-xs text-gray-500">{vm.type}</span>
                        <span className={`ml-2 text-xs font-semibold ${vm.status === 'running' ? 'text-green-400' : 'text-gray-500'}`}>
                          {vm.status}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleStartVM(vm.id)}
                          className="px-2 py-1 text-xs rounded bg-green-700 hover:bg-green-600 text-white"
                        >Start</button>
                        <button
                          onClick={() => handleStopVM(vm.id)}
                          className="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-white"
                        >Stop</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
