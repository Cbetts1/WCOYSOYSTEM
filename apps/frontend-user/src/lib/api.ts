const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) ?? {}),
  };
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const json = (await res.json()) as { success: boolean; data?: T; error?: string };
  if (!json.success) throw new Error(json.error ?? 'API error');
  return json.data as T;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiFetch<{ token: string; userId: string; email: string; role: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string) =>
    apiFetch<{ token: string; userId: string; email: string; role: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => apiFetch('/auth/me'),

  // Docks
  createDock: (name: string) =>
    apiFetch('/docks', { method: 'POST', body: JSON.stringify({ name }) }),
  listDocks: () => apiFetch<unknown[]>('/docks'),
  getDock: (dockId: string) => apiFetch(`/docks/${dockId}`),

  // VMs
  createVM: (dockId: string, name: string, type: string) =>
    apiFetch(`/docks/${dockId}/vms`, { method: 'POST', body: JSON.stringify({ name, type }) }),
  listVMs: (dockId: string) => apiFetch<unknown[]>(`/docks/${dockId}/vms`),
  startVM: (vmId: string) => apiFetch(`/vms/${vmId}/start`, { method: 'POST' }),
  stopVM: (vmId: string) => apiFetch(`/vms/${vmId}/stop`, { method: 'POST' }),

  // Tasks
  submitIntent: (intent: string, dockId?: string, vmId?: string) =>
    apiFetch('/tasks', {
      method: 'POST',
      body: JSON.stringify({ intent, dockId, vmId }),
    }),
  listTasks: () => apiFetch<unknown[]>('/tasks'),
  getTask: (id: string) => apiFetch(`/tasks/${id}`),
};
