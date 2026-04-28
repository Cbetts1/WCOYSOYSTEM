'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    setEmail(localStorage.getItem('role') === 'admin' ? '[admin] ' : '' +
      (localStorage.getItem('userId') ?? ''));
  }, [router]);

  function logout() {
    localStorage.clear();
    router.push('/auth/login');
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-400">VAGA Dashboard</h1>
          <button
            onClick={logout}
            className="text-sm text-gray-400 hover:text-red-400 transition"
          >
            Logout
          </button>
        </div>
        <p className="text-gray-400 mb-8 text-sm">Welcome, {email}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NavCard href="/docks" title="Docks & VMs" description="Manage your virtual docks and VMs" />
          <NavCard href="/tasks" title="Tasks" description="Submit intents and view results" />
          <NavCard href="/auth/login" title="Logout" description="Sign out of VAGA portal" onClick={logout} />
        </div>
      </div>
    </div>
  );
}

function NavCard({
  href,
  title,
  description,
  onClick,
}: {
  href: string;
  title: string;
  description: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-indigo-600 transition group"
    >
      <h2 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition mb-1">
        {title}
      </h2>
      <p className="text-gray-500 text-sm">{description}</p>
    </Link>
  );
}
