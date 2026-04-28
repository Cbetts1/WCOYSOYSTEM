const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminToken');
}

async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
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

export const adminApi = {
  login: (email: string, password: string) =>
    apiFetch<{ token: string; role: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  health: () => apiFetch('/admin/system/health'),
  nodes: () => apiFetch<unknown[]>('/admin/system/nodes'),
  users: () => apiFetch<unknown[]>('/admin/users'),
  docks: () => apiFetch<unknown[]>('/admin/docks'),
  vms: () => apiFetch<unknown[]>('/admin/vms'),
  tasks: () => apiFetch<unknown[]>('/admin/tasks'),
  arrowJobs: () => apiFetch<unknown[]>('/admin/arrow-jobs'),
};
