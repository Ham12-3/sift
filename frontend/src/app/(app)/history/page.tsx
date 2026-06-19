'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Review, Project } from '@/lib/types';
import { TEMPLATE_LABEL, reviewResultLine, topSeverityDot } from '@/lib/severity';
import { relativeTime, setActiveProject } from '@/lib/util';
import { IconSearch, IconChevronRight } from '@/components/icons';

export default function HistoryPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [projects, setProjects] = useState<Record<string, Project>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get<Review[]>('/reviews'), api.get<Project[]>('/projects')])
      .then(([r, p]) => {
        setReviews(r);
        setProjects(Object.fromEntries(p.map((proj) => [proj.id, proj])));
      })
      .finally(() => setLoading(false));
  }, []);

  // Client-side filter so typing feels instant; mirrors the server's fields.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return reviews;
    return reviews.filter((r) => {
      const projectName = projects[r.project]?.name ?? '';
      return (
        projectName.toLowerCase().includes(q) ||
        TEMPLATE_LABEL[r.template].toLowerCase().includes(q) ||
        r.scope.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q)
      );
    });
  }, [search, reviews, projects]);

  function open(r: Review) {
    setActiveProject(r.project);
    router.push(`/projects/${r.project}/review`);
  }

  return (
    <div className="max-w-[960px]">
      <div className="mb-[22px]">
        <h1 className="m-0 text-[28px] font-semibold tracking-[-0.02em]">Review History</h1>
        <p className="mt-[6px] text-sm text-text-muted">Every review across your projects.</p>
      </div>

      <div className="relative mb-[18px]">
        <IconSearch size={17} className="absolute left-[14px] top-1/2 -translate-y-1/2 text-text-dim" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reviews by project, mode, or scope…"
          className="field pl-10"
        />
      </div>

      {loading ? (
        <div className="card h-[300px] animate-pulse" />
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-sm text-text-muted">
          {reviews.length === 0 ? 'No reviews yet. Run your first review from a project.' : 'No reviews match your search.'}
        </div>
      ) : (
        <div className="card overflow-hidden">
          {filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => open(r)}
              className="flex w-full items-center gap-4 border-b border-white/[0.06] px-5 py-4 text-left last:border-b-0 hover:bg-brand/[0.06]"
            >
              <span className="h-[9px] w-[9px] flex-none rounded-full" style={{ background: topSeverityDot(r.topSeverity), boxShadow: `0 0 10px ${topSeverityDot(r.topSeverity)}` }} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-[15px] font-semibold tracking-[-0.01em]">{projects[r.project]?.name ?? 'Unknown project'}</div>
                <div className="mt-[3px] truncate text-[13px] text-text-muted">
                  {r.status === 'completed' ? reviewResultLine(r.severityCounts ?? { critical: 0, high: 0, medium: 0, low: 0 }) : r.status === 'failed' ? 'Failed' : 'Reviewing…'}
                </div>
              </div>
              <div className="flex flex-none items-center gap-[18px]">
                <span className="hidden rounded-full border border-white/10 bg-white/[0.03] px-[11px] py-[5px] text-[12.5px] text-text/80 sm:inline">{TEMPLATE_LABEL[r.template]}</span>
                <span className="hidden text-[13px] text-[#8e89a6] md:inline">{r.scope === 'project' ? 'Full repository' : `${r.targetPaths.length} file(s)`}</span>
                <span className="min-w-[92px] text-right text-[13px] text-text-dim">{relativeTime(r.createdAt)}</span>
                <IconChevronRight size={17} className="text-brand" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
