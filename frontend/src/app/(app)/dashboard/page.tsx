'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import type { Project, Review } from '@/lib/types';
import { initials, formatDate, setActiveProject } from '@/lib/util';
import { Modal } from '@/components/Modal';
import { StatusBadge, deriveTone } from '@/components/StatusBadge';
import { IconPlus, IconFile, IconHistory, IconTrash, IconExplorer } from '@/components/icons';

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [p, r] = await Promise.all([api.get<Project[]>('/projects'), api.get<Review[]>('/reviews')]);
      setProjects(p);
      setReviews(r);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  // Latest review per project, for the status badge.
  const latestByProject = useMemo(() => {
    const map = new Map<string, Review>();
    for (const r of reviews) {
      if (!map.has(r.project)) map.set(r.project, r); // reviews come newest-first
    }
    return map;
  }, [reviews]);

  function openProject(p: Project) {
    setActiveProject(p.id);
    router.push(`/projects/${p.id}/explorer`);
  }

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const project = await api.post<Project>('/projects', { name, description });
      setCreating(false);
      setName('');
      setDescription('');
      setActiveProject(project.id);
      router.push(`/projects/${project.id}/explorer`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create project');
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteProject() {
    if (!confirmDelete) return;
    await api.delete(`/projects/${confirmDelete.id}`);
    setConfirmDelete(null);
    load();
  }

  return (
    <div>
      <div className="mb-[26px] flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-[28px] font-semibold tracking-[-0.02em]">Projects</h1>
          <p className="mt-[6px] text-sm text-text-muted">Upload a codebase and let Sift review it.</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary px-[18px] py-[11px] text-sm">
          <IconPlus size={17} /> New Project
        </button>
      </div>

      {loading ? (
        <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="card h-[168px] animate-pulse" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="mt-2 rounded-[20px] border border-dashed border-white/[0.16] bg-white/[0.015] p-[70px_28px] text-center">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-[18px] border border-brand/30 bg-brand/[0.12] text-brand-soft" style={{ boxShadow: '0 12px 34px rgba(139,92,246,.3)' }}>
            <IconExplorer size={28} />
          </div>
          <h2 className="m-0 text-[20px] font-semibold">No projects yet</h2>
          <p className="mx-auto mb-6 mt-2 max-w-[42ch] text-sm leading-[1.55] text-text-muted">
            Create your first project to upload a codebase and run an AI review. Sift indexes every file in seconds.
          </p>
          <button onClick={() => setCreating(true)} className="btn-primary mx-auto px-5 py-3 text-sm">
            <IconPlus size={17} /> New Project
          </button>
        </div>
      ) : (
        <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <div key={p.id} className="group card cursor-pointer p-5 transition hover:-translate-y-[2px] hover:border-brand/40" onClick={() => openProject(p)}>
              <div className="mb-[14px] flex items-start justify-between gap-3">
                <span className="grid h-[42px] w-[42px] place-items-center rounded-[11px] border border-brand/30 bg-brand/[0.14] font-mono text-sm font-semibold text-brand-soft">
                  {initials(p.name)}
                </span>
                <div className="flex items-center gap-2">
                  <StatusBadge tone={deriveTone(latestByProject.get(p.id))} />
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(p); }}
                    className="text-text-dim opacity-0 transition group-hover:opacity-100 hover:text-sev-critical-fg"
                    title="Delete project"
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
              </div>
              <div className="font-mono text-base font-semibold tracking-[-0.01em]">{p.name}</div>
              <p className="mb-4 mt-[6px] line-clamp-2 text-[13.5px] leading-[1.5] text-[#a09bb5]">{p.description || 'No description'}</p>
              <div className="flex items-center gap-4 border-t border-white/[0.06] pt-3 text-[12.5px] text-[#76728c]">
                <span className="flex items-center gap-[6px]"><IconFile size={14} />{p.fileCount} files</span>
                <span className="flex items-center gap-[6px]"><IconHistory size={14} />{formatDate(p.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New project">
        <form onSubmit={createProject}>
          <label className="label">Name</label>
          <input className="field mb-4" placeholder="auth-gateway" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          <label className="label">Description</label>
          <textarea className="field mb-4 min-h-[84px] resize-y" placeholder="OAuth2 / OIDC identity provider" value={description} onChange={(e) => setDescription(e.target.value)} />
          {error && <p className="mb-3 text-[13px] text-sev-critical-fg">{error}</p>}
          <div className="flex justify-end gap-[10px]">
            <button type="button" onClick={() => setCreating(false)} className="btn-ghost px-4 py-[10px] text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary px-5 py-[10px] text-sm">{submitting ? 'Creating…' : 'Create project'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete project?">
        <p className="mb-5 text-sm leading-[1.55] text-text-muted">
          This permanently deletes <b className="text-text">{confirmDelete?.name}</b> along with its files, reviews, and chats. This cannot be undone.
        </p>
        <div className="flex justify-end gap-[10px]">
          <button onClick={() => setConfirmDelete(null)} className="btn-ghost px-4 py-[10px] text-sm">Cancel</button>
          <button onClick={deleteProject} className="rounded-[10px] border border-sev-critical/40 bg-sev-critical/[0.14] px-5 py-[10px] text-sm font-semibold text-sev-critical-fg">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
