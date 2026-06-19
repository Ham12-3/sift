'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import type { GithubRepo, GithubReposResponse } from '@/lib/types';
import { Modal } from './Modal';
import { IconUpload, IconGithub, IconFolder, IconSearch } from './icons';

interface Props {
  projectId: string;
  onUploaded: (added: number) => void;
  compact?: boolean;
}

export function UploadActions({ projectId, onUploaded, compact }: Props) {
  const zipRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const [githubOpen, setGithubOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // GitHub picker state
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [connected, setConnected] = useState(false);
  const [reposLoading, setReposLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [manual, setManual] = useState(false); // paste-a-URL fallback
  const [githubUrl, setGithubUrl] = useState('');
  const [githubToken, setGithubToken] = useState('');

  // Load the user's repositories when the dialog opens.
  useEffect(() => {
    if (!githubOpen) return;
    setReposLoading(true);
    setError('');
    api
      .get<GithubReposResponse>('/github/repos')
      .then((res) => {
        setConnected(res.connected);
        setRepos(res.repos);
        setManual(!res.connected); // no GitHub token → manual entry
      })
      .catch(() => {
        setConnected(false);
        setManual(true);
      })
      .finally(() => setReposLoading(false));
  }, [githubOpen]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? repos.filter((r) => r.fullName.toLowerCase().includes(q)) : repos;
  }, [repos, search]);

  async function run(fn: () => Promise<{ added: number }>) {
    setBusy(true);
    setError('');
    try {
      const { added } = await fn();
      onUploaded(added);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  function uploadZip(file: File) {
    const form = new FormData();
    form.append('file', file);
    return run(() => api.upload(`/projects/${projectId}/files/upload/zip`, form));
  }

  function uploadFileList(files: FileList) {
    const form = new FormData();
    Array.from(files).forEach((f) => {
      const path = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
      form.append('files', f, path);
    });
    return run(() => api.upload(`/projects/${projectId}/files/upload/files`, form));
  }

  function importUrl(url: string, token?: string) {
    return run(async () => {
      const body: { url: string; token?: string } = { url };
      if (token?.trim()) body.token = token.trim();
      const res = await api.post<{ added: number }>(`/projects/${projectId}/files/upload/github`, body);
      setGithubOpen(false);
      setGithubUrl('');
      setGithubToken('');
      setSearch('');
      return res;
    });
  }

  const btn = compact
    ? 'flex items-center gap-[7px] rounded-[10px] border border-white/[0.12] bg-white/[0.02] px-[13px] py-[9px] text-[13px] text-text/80 hover:text-text disabled:opacity-50'
    : 'btn-ghost px-4 py-[10px] text-sm disabled:opacity-50';

  return (
    <div className="flex flex-wrap items-center gap-[10px]">
      <input ref={zipRef} type="file" accept=".zip" className="hidden" onChange={(e) => e.target.files?.[0] && uploadZip(e.target.files[0])} />
      <input ref={folderRef} type="file" className="hidden" multiple {...({ webkitdirectory: '', directory: '' } as any)} onChange={(e) => e.target.files?.length && uploadFileList(e.target.files)} />

      <button disabled={busy} onClick={() => zipRef.current?.click()} className={btn}>
        <IconUpload size={15} /> Upload ZIP
      </button>
      <button disabled={busy} onClick={() => folderRef.current?.click()} className={btn}>
        <IconFolder size={15} /> Upload folder
      </button>
      <button disabled={busy} onClick={() => setGithubOpen(true)} className={btn}>
        <IconGithub size={15} /> GitHub
      </button>

      {busy && <span className="text-xs text-text-muted">Uploading…</span>}
      {error && !githubOpen && <span className="text-xs text-sev-critical-fg">{error}</span>}

      <Modal open={githubOpen} onClose={() => !busy && setGithubOpen(false)} title="Import from GitHub" maxWidth={520}>
        {reposLoading ? (
          <div className="grid h-[220px] place-items-center">
            <div className="h-7 w-7 animate-spin2 rounded-full border-2 border-white/15 border-t-brand" />
          </div>
        ) : !manual ? (
          <>
            {/* repo picker */}
            <div className="relative mb-3">
              <IconSearch size={16} className="absolute left-[13px] top-1/2 -translate-y-1/2 text-text-dim" />
              <input className="field pl-9" placeholder="Search your repositories…" value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
            </div>

            <div className="max-h-[300px] overflow-y-auto rounded-[10px] border border-white/[0.08]">
              {filtered.length === 0 ? (
                <p className="p-4 text-center text-sm text-text-dim">No repositories match.</p>
              ) : (
                filtered.map((r) => (
                  <button
                    key={r.fullName}
                    disabled={busy}
                    onClick={() => importUrl(r.htmlUrl)}
                    className="flex w-full items-center gap-3 border-b border-white/[0.05] px-4 py-[11px] text-left last:border-b-0 hover:bg-brand/[0.08] disabled:opacity-50"
                  >
                    <IconGithub size={16} className="flex-none text-text-muted" />
                    <span className="min-w-0 flex-1 truncate font-mono text-[13px]">{r.fullName}</span>
                    <span
                      className={`flex-none rounded-full border px-2 py-[2px] text-[11px] ${
                        r.private
                          ? 'border-sev-medium/40 bg-sev-medium/[0.12] text-sev-medium-fg'
                          : 'border-white/10 bg-white/[0.03] text-text-dim'
                      }`}
                    >
                      {r.private ? 'Private' : 'Public'}
                    </span>
                  </button>
                ))
              )}
            </div>

            {error && <p className="mt-3 text-[13px] text-sev-critical-fg">{error}</p>}

            <div className="mt-4 flex items-center justify-between">
              <button onClick={() => setManual(true)} className="text-[13px] text-brand hover:underline">Paste a URL instead</button>
              <span className="text-xs text-text-dim">{busy ? 'Importing…' : `${repos.length} repositories`}</span>
            </div>
          </>
        ) : (
          <>
            {/* manual URL + optional token */}
            {!connected && (
              <p className="mb-3 rounded-[10px] border border-white/[0.08] bg-white/[0.02] p-3 text-xs text-text-muted">
                Tip: sign in with GitHub to pick from a list of your public and private repos automatically.
              </p>
            )}
            <label className="label">Repository URL</label>
            <input className="field mb-2 font-mono text-[13px]" placeholder="https://github.com/owner/repo" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} autoFocus />
            <p className="mb-4 text-xs text-text-dim">We fetch the default branch (main/master) or a /tree/&lt;branch&gt; URL.</p>

            <label className="label">Access token <span className="text-text-dim">(optional — for private repos)</span></label>
            <input className="field mb-2 font-mono text-[13px]" type="password" placeholder="ghp_…  (leave blank if you signed in with GitHub)" value={githubToken} onChange={(e) => setGithubToken(e.target.value)} />
            <p className="mb-4 text-xs text-text-dim">Token needs <span className="font-mono">repo</span> scope. Used once, never stored.</p>

            {error && <p className="mb-3 text-[13px] text-sev-critical-fg">{error}</p>}
            <div className="flex items-center justify-between">
              {connected ? (
                <button onClick={() => { setManual(false); setError(''); }} className="text-[13px] text-brand hover:underline">Back to my repos</button>
              ) : <span />}
              <div className="flex gap-[10px]">
                <button onClick={() => setGithubOpen(false)} className="btn-ghost px-4 py-[10px] text-sm">Cancel</button>
                <button disabled={busy || !githubUrl} onClick={() => importUrl(githubUrl, githubToken)} className="btn-primary px-5 py-[10px] text-sm">{busy ? 'Importing…' : 'Import'}</button>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
