'use client';

import { useState } from 'react';
import type { TreeNode } from '@/lib/types';
import { IconChevronRight, IconChevronDown, IconFolder, IconFile } from './icons';

export function FileTree({
  nodes,
  activePath,
  onSelect,
}: {
  nodes: TreeNode[];
  activePath: string | null;
  onSelect: (path: string) => void;
}) {
  return (
    <div className="font-mono text-[13px]">
      {nodes.map((n) => (
        <TreeRow key={n.path} node={n} depth={0} activePath={activePath} onSelect={onSelect} />
      ))}
    </div>
  );
}

function TreeRow({
  node,
  depth,
  activePath,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  activePath: string | null;
  onSelect: (path: string) => void;
}) {
  // Open the first two levels by default so structure is visible immediately.
  const [open, setOpen] = useState(depth < 2);
  const pad = 8 + depth * 14;

  if (node.type === 'dir') {
    return (
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-[7px] rounded-[6px] py-[6px] pr-2 text-text/80 hover:bg-white/[0.03]"
          style={{ paddingLeft: pad }}
        >
          {open ? <IconChevronDown size={14} className="text-brand" /> : <IconChevronRight size={14} className="text-text-dim" />}
          <IconFolder size={14} className="text-brand" />
          <span className="truncate">{node.name}</span>
        </button>
        {open && node.children?.map((c) => (
          <TreeRow key={c.path} node={c} depth={depth + 1} activePath={activePath} onSelect={onSelect} />
        ))}
      </div>
    );
  }

  const active = node.path === activePath;
  return (
    <button
      onClick={() => onSelect(node.path)}
      className={`flex w-full items-center gap-[7px] rounded-[8px] py-[6px] pr-2 text-left ${
        active ? 'border border-brand/[0.34] bg-brand/[0.16] text-[#e9e4fb]' : 'border border-transparent text-[#94909f] hover:text-text'
      }`}
      style={{ paddingLeft: pad + 14 }}
    >
      <IconFile size={13} className={active ? 'text-brand-soft' : 'text-[#60a5fa]'} />
      <span className="truncate">{node.name}</span>
    </button>
  );
}
