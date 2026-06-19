'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from './Logo';
import {
  IconDashboard,
  IconExplorer,
  IconShield,
  IconHistory,
  IconChat,
  IconSettings,
  IconLogout,
} from './icons';
import { useAuth } from '@/lib/auth';
import { getActiveProject } from '@/lib/util';
import { initials } from '@/lib/util';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: (active: string | null) => string;
  match: (path: string) => boolean;
  needsProject?: boolean;
}

const NAV: NavItem[] = [
  { label: 'Projects', icon: <IconDashboard size={18} />, href: () => '/dashboard', match: (p) => p === '/dashboard' },
  { label: 'Code Explorer', icon: <IconExplorer size={18} />, href: (a) => (a ? `/projects/${a}/explorer` : '/dashboard'), match: (p) => p.includes('/explorer'), needsProject: true },
  { label: 'AI Review', icon: <IconShield size={18} />, href: (a) => (a ? `/projects/${a}/review` : '/dashboard'), match: (p) => p.includes('/review'), needsProject: true },
  { label: 'History', icon: <IconHistory size={18} />, href: () => '/history', match: (p) => p === '/history' },
  { label: 'Chat with Code', icon: <IconChat size={18} />, href: (a) => (a ? `/projects/${a}/chat` : '/dashboard'), match: (p) => p.includes('/chat'), needsProject: true },
  { label: 'Settings', icon: <IconSettings size={18} />, href: () => '/settings', match: (p) => p === '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [active, setActive] = useState<string | null>(null);

  // Track the active project for project-scoped links; re-read on navigation.
  useEffect(() => {
    setActive(getActiveProject());
  }, [pathname]);

  return (
    <aside className="sticky top-0 flex h-screen w-[248px] flex-none flex-col border-r border-white/[0.07] p-[22px_16px]" style={{ background: 'rgba(12,9,22,.6)', backdropFilter: 'blur(12px)' }}>
      <Link href="/" className="px-2 pb-[22px] pt-1">
        <Logo />
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const isActive = item.match(pathname);
          const href = item.href(active);
          return (
            <button
              key={item.label}
              onClick={() => {
                if (item.needsProject && !active) {
                  router.push('/dashboard');
                } else {
                  router.push(href);
                }
              }}
              className={`flex items-center gap-3 rounded-[10px] border px-3 py-[10px] text-left text-sm font-medium ${
                isActive
                  ? 'border-brand/34 bg-brand/[0.16] text-[#e9e4fb]'
                  : 'border-transparent bg-transparent text-text/70 hover:text-text'
              }`}
            >
              <span className="inline-flex">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[13px] border border-white/[0.08] bg-white/[0.025] p-[14px]">
        <div className="mb-2 text-xs text-text-muted">AI reviews run on your own provider</div>
        <Link href="/settings" className="block w-full rounded-[9px] py-[9px] text-center text-[13px] font-semibold text-white" style={{ background: 'linear-gradient(180deg,#9b6cf8,#7c3aed)' }}>
          Configure provider
        </Link>
      </div>

      <div className="mt-[14px] flex items-center gap-[10px] border-t border-white/[0.07] px-[6px] pt-[14px]">
        <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-full text-[13px] font-semibold" style={{ background: 'linear-gradient(150deg,#a78bfa,#6d28d9)' }}>
          {user ? initials(user.name) : '··'}
        </span>
        <div className="min-w-0 flex-1 leading-[1.3]">
          <div className="truncate text-[13.5px] font-medium">{user?.name ?? 'Loading…'}</div>
          <div className="truncate text-xs text-[#76728c]">{user?.email ?? ''}</div>
        </div>
        <button onClick={logout} title="Log out" className="flex-none text-text-dim hover:text-text">
          <IconLogout size={18} />
        </button>
      </div>
    </aside>
  );
}
