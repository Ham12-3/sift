'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import type { Project } from '@/lib/types';
import { ProjectProvider } from '@/lib/project-context';
import { setActiveProject } from '@/lib/util';

const TABS = [
  { key: 'explorer', label: 'Code Explorer' },
  { key: 'review', label: 'AI Review' },
  { key: 'chat', label: 'Chat with Code' },
];

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const { id } = params;
  const pathname = usePathname();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api
      .get<Project>(`/projects/${id}`)
      .then((p) => {
        setProject(p);
        setActiveProject(p.id);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load project'));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm text-sev-critical-fg">{error}</p>
        <button onClick={() => router.push('/dashboard')} className="btn-ghost mt-4 px-4 py-2 text-sm">Back to projects</button>
      </div>
    );
  }

  if (!project) {
    return <div className="grid h-[60vh] place-items-center"><div className="h-7 w-7 animate-spin2 rounded-full border-2 border-white/15 border-t-brand" /></div>;
  }

  const activeTab = TABS.find((t) => pathname.includes(`/${t.key}`))?.key ?? 'explorer';

  return (
    <ProjectProvider value={{ project, reload: load }}>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Link href="/dashboard" className="text-sm text-text-dim hover:text-text">Projects</Link>
        <span className="text-text-dim">/</span>
        <h1 className="m-0 text-[22px] font-semibold tracking-[-0.02em]">{project.name}</h1>
        <span className="font-mono text-[12.5px] text-text-dim card px-[10px] py-1">{project.fileCount} files</span>
      </div>

      <div className="mb-6 flex gap-1 border-b border-white/[0.07]">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/projects/${id}/${t.key}`}
            className={`-mb-px border-b-2 px-4 py-[10px] text-sm font-medium ${
              activeTab === t.key ? 'border-brand text-text' : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {children}
    </ProjectProvider>
  );
}
