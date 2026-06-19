'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { useProject } from '@/lib/project-context';
import type { Review, ReviewTemplate, ReviewTemplateMeta, Provider, TreeNode, EnvDefaultInfo } from '@/lib/types';
import { SEVERITY_STYLE, SEVERITY_ORDER, TEMPLATE_LABEL } from '@/lib/severity';
import { relativeTime } from '@/lib/util';
import { IconShield } from '@/components/icons';

export default function ReviewPage() {
  const { project } = useProject();
  const [templates, setTemplates] = useState<ReviewTemplateMeta[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [envDefault, setEnvDefault] = useState<EnvDefaultInfo | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [history, setHistory] = useState<Review[]>([]);

  const [mode, setMode] = useState<ReviewTemplate>('security');
  const [scope, setScope] = useState<'project' | 'files'>('project');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [active, setActive] = useState<Review | null>(null);

  useEffect(() => {
    api.get<ReviewTemplateMeta[]>('/review-templates').then(setTemplates).catch(() => undefined);
    api.get<Provider[]>('/providers').then(setProviders).catch(() => undefined);
    api.get<EnvDefaultInfo>('/providers/env-default').then(setEnvDefault).catch(() => undefined);
    api.get<TreeNode[]>(`/projects/${project.id}/files/tree`).then((t) => setFiles(flatten(t)));
    refreshHistory();
  }, [project.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function refreshHistory() {
    api.get<Review[]>(`/projects/${project.id}/reviews`).then((r) => {
      setHistory(r);
      if (!active && r.length) setActive(r[0]);
    });
  }

  const hasProvider = providers.length > 0 || !!envDefault?.configured;

  async function runReview() {
    setError('');
    setRunning(true);
    try {
      const paths = scope === 'files' ? Array.from(selected) : [];
      if (scope === 'files' && paths.length === 0) {
        setError('Select at least one file, or switch scope to the entire project.');
        return;
      }
      const review = await api.post<Review>(`/projects/${project.id}/reviews`, { template: mode, paths });
      setActive(review);
      refreshHistory();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Review failed');
    } finally {
      setRunning(false);
    }
  }

  function toggleFile(path: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_300px]">
      {/* main column */}
      <div className="min-w-0 max-w-[920px]">
        {/* controls */}
        <div className="card mb-4 p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-text-dim">Mode</span>
            {(['security', 'performance', 'quality'] as ReviewTemplate[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex items-center gap-2 rounded-[10px] border px-[14px] py-[8px] text-[13.5px] ${
                  mode === m ? 'border-brand/34 bg-brand/[0.12] text-[#e7e3f3]' : 'border-white/[0.1] bg-white/[0.02] text-text-muted hover:text-text'
                }`}
              >
                {m === 'security' && <IconShield size={15} className="text-brand-soft" />}
                {TEMPLATE_LABEL[m]}
              </button>
            ))}
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-text-dim">Scope</span>
            {(['project', 'files'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`rounded-[10px] border px-[14px] py-[8px] text-[13.5px] ${
                  scope === s ? 'border-brand/34 bg-brand/[0.12] text-[#e7e3f3]' : 'border-white/[0.1] bg-white/[0.02] text-text-muted hover:text-text'
                }`}
              >
                {s === 'project' ? 'Entire project' : 'Specific files'}
              </button>
            ))}
          </div>

          {scope === 'files' && (
            <div className="mb-4 max-h-[180px] overflow-y-auto rounded-[10px] border border-white/[0.08] bg-white/[0.02] p-2 font-mono text-[12.5px]">
              {files.length === 0 ? (
                <p className="p-2 text-text-dim">No files uploaded yet.</p>
              ) : (
                files.map((f) => (
                  <label key={f} className="flex cursor-pointer items-center gap-2 rounded-[6px] px-2 py-[5px] hover:bg-white/[0.03]">
                    <input type="checkbox" checked={selected.has(f)} onChange={() => toggleFile(f)} className="accent-[#7c3aed]" />
                    <span className="truncate text-text/80">{f}</span>
                  </label>
                ))
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={runReview} disabled={running || !hasProvider} className="btn-primary px-5 py-[11px] text-sm disabled:opacity-50">
              {running ? 'Reviewing…' : 'Run review'}
            </button>
            {!hasProvider && (
              <span className="text-[13px] text-sev-medium-fg">
                No AI provider configured — <Link href="/settings" className="text-brand underline">add one in Settings</Link>.
              </span>
            )}
            {error && <span className="text-[13px] text-sev-critical-fg">{error}</span>}
          </div>
        </div>

        {running && (
          <div className="card mb-4 flex items-center gap-3 p-5 text-sm text-text-muted">
            <div className="h-5 w-5 animate-spin2 rounded-full border-2 border-white/15 border-t-brand" />
            Analyzing {scope === 'files' ? `${selected.size} file(s)` : `${project.fileCount} files`} in {TEMPLATE_LABEL[mode]} mode…
          </div>
        )}

        {active ? <ReviewResult review={active} /> : (
          !running && (
            <div className="card p-8 text-center text-sm text-text-muted">
              No reviews yet. Pick a mode and run your first review.
            </div>
          )
        )}
      </div>

      {/* history sidebar */}
      <div className="card p-3">
        <div className="px-2 pb-2 pt-1 text-[11px] uppercase tracking-[0.08em] text-text-dim">This project</div>
        {history.length === 0 ? (
          <p className="px-2 py-2 text-[13px] text-text-dim">No past reviews.</p>
        ) : (
          history.map((r) => {
            const isActive = active?.id === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setActive(r)}
                className={`mb-1 flex w-full items-center gap-2 rounded-[9px] border px-3 py-[9px] text-left text-[13px] ${
                  isActive ? 'border-brand/34 bg-brand/[0.12]' : 'border-transparent hover:bg-white/[0.03]'
                }`}
              >
                <span className="h-[7px] w-[7px] flex-none rounded-full" style={{ background: r.topSeverity === 'none' ? '#34d399' : SEVERITY_STYLE[r.topSeverity as keyof typeof SEVERITY_STYLE]?.accent ?? '#76728c' }} />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{TEMPLATE_LABEL[r.template]}</span>
                  <span className="block text-[11.5px] text-text-dim">{relativeTime(r.createdAt)} · {r.scope}</span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function ReviewResult({ review }: { review: Review }) {
  const counts = useMemo(
    () => review.severityCounts ?? { critical: 0, high: 0, medium: 0, low: 0 },
    [review.severityCounts],
  );
  const total = useMemo(() => SEVERITY_ORDER.reduce((a, s) => a + (counts[s] ?? 0), 0), [counts]);

  if (review.status === 'failed') {
    return <div className="card border-sev-critical/30 p-5 text-sm text-sev-critical-fg">Review failed: {review.error}</div>;
  }

  return (
    <div>
      {/* summary — calm header, severity shown as accent dots not filled cards */}
      <div className="card mb-5 p-[22px]">
        <p className="m-0 text-[15px] leading-[1.6] text-[#cfcadd]">{review.summary || 'No summary returned.'}</p>
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/[0.06] pt-4">
          {SEVERITY_ORDER.map((s) => {
            const st = SEVERITY_STYLE[s];
            const n = counts[s] ?? 0;
            return (
              <div key={s} className="flex items-center gap-2" style={{ opacity: n === 0 ? 0.45 : 1 }}>
                <span className="h-2 w-2 rounded-full" style={{ background: st.accent }} />
                <span className="text-[15px] font-semibold tabular-nums" style={{ color: n > 0 ? st.fg : '#9692ad' }}>{n}</span>
                <span className="text-[13px] text-text-muted">{st.label}</span>
              </div>
            );
          })}
          <span className="ml-auto text-xs text-text-dim">
            {total === 0 ? 'No issues found' : `${total} issue${total === 1 ? '' : 's'}`} · {review.model || 'unknown'} · {review.targetPaths.length} file(s)
          </span>
        </div>
      </div>

      {/* issues — neutral cards; severity is a small dot + label, not a color wash */}
      {review.issues.length > 0 && (
        <section className="mb-5">
          <h2 className="mb-3 text-[15px] font-semibold tracking-[-0.01em]">Issues</h2>
          <div className="flex flex-col gap-[10px]">
            {review.issues.map((issue, i) => {
              const st = SEVERITY_STYLE[issue.severity];
              return (
                <div key={i} className="card p-[16px_18px]">
                  <div className="mb-[6px] flex items-center gap-2">
                    <span className="inline-flex items-center gap-[6px] text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: st.fg }}>
                      <span className="h-[7px] w-[7px] rounded-full" style={{ background: st.accent }} />
                      {st.label}
                    </span>
                    {(issue.file || issue.line) && (
                      <span className="ml-auto truncate font-mono text-[12px] text-text-dim">
                        {issue.file}{issue.line ? `:${issue.line}` : ''}
                      </span>
                    )}
                  </div>
                  <div className="text-[15px] font-semibold text-text-bright">{issue.title}</div>
                  <p className="m-0 mt-[6px] text-[14px] leading-[1.55] text-[#c2bdd2]">{issue.description}</p>
                  {issue.recommendation && (
                    <p className="m-0 mt-[10px] text-[13.5px] leading-[1.55] text-text-muted">
                      <span className="font-medium text-ok-fg">Fix&nbsp;&nbsp;</span>{issue.recommendation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* recommendations — plain list, no numbered color badges */}
      {review.recommendations.length > 0 && (
        <section>
          <h2 className="mb-3 text-[15px] font-semibold tracking-[-0.01em]">Recommendations</h2>
          <ul className="card m-0 flex list-none flex-col gap-[14px] p-[20px_22px]">
            {review.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-[14px]">
                <span className="mt-[8px] h-[6px] w-[6px] flex-none rounded-full bg-brand/70" />
                <p className="m-0 text-[14px] leading-[1.55] text-[#cfcadd]">{rec}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function flatten(nodes: TreeNode[]): string[] {
  const out: string[] = [];
  const walk = (ns: TreeNode[]) => ns.forEach((n) => (n.type === 'file' ? out.push(n.path) : n.children && walk(n.children)));
  walk(nodes);
  return out;
}
