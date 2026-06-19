'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useProject } from '@/lib/project-context';
import type { TreeNode, FileContent } from '@/lib/types';
import { readDroppedFiles } from '@/lib/dropfiles';
import { FileTree } from '@/components/FileTree';
import { CodeViewer } from '@/components/CodeViewer';
import { UploadActions } from '@/components/UploadActions';
import { IconShield, IconFile, IconUpload } from '@/components/icons';

export default function ExplorerPage() {
  const router = useRouter();
  const { project, reload } = useProject();
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [file, setFile] = useState<FileContent | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dropBusy, setDropBusy] = useState(false);

  const loadTree = useCallback(async () => {
    const nodes = await api.get<TreeNode[]>(`/projects/${project.id}/files/tree`);
    setTree(nodes);
    // Auto-open the first file so the preview isn't empty.
    if (!activePath) {
      const first = findFirstFile(nodes);
      if (first) selectFile(first);
    }
  }, [project.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  async function selectFile(path: string) {
    setActivePath(path);
    setLoadingFile(true);
    try {
      const content = await api.get<FileContent>(
        `/projects/${project.id}/files/content?path=${encodeURIComponent(path)}`,
      );
      setFile(content);
    } finally {
      setLoadingFile(false);
    }
  }

  function afterUpload() {
    reload();
    loadTree();
  }

  async function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    setDropBusy(true);
    try {
      const dropped = await readDroppedFiles(e.dataTransfer);
      if (!dropped.length) return;
      const form = new FormData();
      dropped.forEach(({ file: f, path }) => form.append('files', f, path));
      await api.upload(`/projects/${project.id}/files/upload/files`, form);
      afterUpload();
    } finally {
      setDropBusy(false);
    }
  }

  const hasFiles = tree.length > 0;

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className="relative"
    >
      <div className="mb-4 flex flex-wrap items-center gap-[10px]">
        <UploadActions projectId={project.id} onUploaded={afterUpload} compact />
        <button
          onClick={() => router.push(`/projects/${project.id}/review`)}
          disabled={!hasFiles}
          className="btn-primary ml-auto px-[18px] py-[9px] text-[13.5px] disabled:opacity-50"
        >
          <IconShield size={16} /> Review
        </button>
      </div>

      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center rounded-[14px] border-2 border-dashed border-brand/60 bg-brand/[0.08]">
          <div className="text-center text-brand-soft">
            <IconUpload size={32} className="mx-auto mb-2" />
            <p className="font-medium">Drop files or a folder to upload</p>
          </div>
        </div>
      )}

      {!hasFiles ? (
        <label className="block cursor-default rounded-[16px] border border-dashed border-white/[0.16] bg-white/[0.015] p-[70px_28px] text-center">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-[18px] border border-brand/30 bg-brand/[0.12] text-brand-soft">
            <IconUpload size={28} />
          </div>
          <h2 className="m-0 text-[20px] font-semibold">{dropBusy ? 'Uploading…' : 'No files yet'}</h2>
          <p className="mx-auto mb-6 mt-2 max-w-[44ch] text-sm leading-[1.55] text-text-muted">
            Drag and drop a folder here, or use Upload ZIP / Upload folder / GitHub URL above. Sift indexes every source file in seconds.
          </p>
          <div className="flex justify-center"><UploadActions projectId={project.id} onUploaded={afterUpload} /></div>
        </label>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[262px_1fr]">
          <div className="card max-h-[72vh] overflow-y-auto p-3">
            <div className="px-2 pb-[10px] pt-1 text-[11px] uppercase tracking-[0.08em] text-text-dim">Files</div>
            <FileTree nodes={tree} activePath={activePath} onSelect={selectFile} />
          </div>

          <div className="card overflow-hidden" style={{ background: 'rgba(10,8,18,.7)' }}>
            <div className="flex items-center gap-[10px] border-b border-white/[0.07] px-4 py-[11px] font-mono text-[12.5px] text-text-muted">
              <IconFile size={14} className="text-brand-soft" />
              {file ? file.path : 'Select a file'}
              {file && <span className="ml-auto text-text-dim">{file.language}</span>}
            </div>
            {loadingFile ? (
              <div className="grid h-[40vh] place-items-center"><div className="h-6 w-6 animate-spin2 rounded-full border-2 border-white/15 border-t-brand" /></div>
            ) : file ? (
              <div className="max-h-[68vh] overflow-y-auto"><CodeViewer content={file.content} language={file.language} /></div>
            ) : (
              <div className="grid h-[40vh] place-items-center text-sm text-text-dim">Pick a file from the tree to preview it.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function findFirstFile(nodes: TreeNode[]): string | null {
  for (const n of nodes) {
    if (n.type === 'file') return n.path;
    if (n.children) {
      const found = findFirstFile(n.children);
      if (found) return found;
    }
  }
  return null;
}
