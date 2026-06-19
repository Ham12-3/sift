'use client';

import { useMemo } from 'react';
import hljs from 'highlight.js/lib/common';

/**
 * Syntax-highlighted code with a line-number gutter. Uses highlight.js's common
 * language bundle; falls back to auto-detection when the hinted language is
 * unknown. `white-space:pre` keeps one source line per rendered row so the
 * gutter stays aligned.
 */
export function CodeViewer({ content, language }: { content: string; language: string }) {
  const html = useMemo(() => {
    try {
      if (language && language !== 'plaintext' && hljs.getLanguage(language)) {
        return hljs.highlight(content, { language }).value;
      }
      return hljs.highlightAuto(content).value;
    } catch {
      return escapeHtml(content);
    }
  }, [content, language]);

  const lineCount = content.split('\n').length;

  return (
    <div className="flex overflow-x-auto font-mono text-[13px] leading-[1.7]">
      <div className="flex-none select-none border-r border-white/[0.05] bg-white/[0.015] py-4 text-right text-[#5a566e]">
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i} className="px-[14px]">{i + 1}</div>
        ))}
      </div>
      <pre className="m-0 min-w-0 flex-1 py-4 pl-[18px] pr-6">
        <code className="hljs" dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string);
}
