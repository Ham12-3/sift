'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useProject } from '@/lib/project-context';
import { useAuth } from '@/lib/auth';
import type { ChatSession, ChatMessage } from '@/lib/types';
import { initials } from '@/lib/util';
import { IconChat, IconArrowRight } from '@/components/icons';

export default function ChatPage() {
  const { project } = useProject();
  const { user } = useAuth();
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reuse the latest conversation for this project, or start one.
  useEffect(() => {
    (async () => {
      const sessions = await api.get<ChatSession[]>(`/projects/${project.id}/chat/sessions`);
      const current = sessions[0] ?? (await api.post<ChatSession>(`/projects/${project.id}/chat/sessions`, {}));
      setSession(current);
      const msgs = await api.get<ChatMessage[]>(`/chat/sessions/${current.id}/messages`);
      setMessages(msgs);
    })().catch((e) => setError(e?.message ?? 'Failed to load chat'));
  }, [project.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !input.trim() || sending) return;
    const content = input.trim();
    setInput('');
    setError('');
    // Optimistically render the user's message.
    const optimistic: ChatMessage = { id: `tmp-${Date.now()}`, role: 'user', content, citedFiles: [], createdAt: new Date().toISOString() };
    setMessages((m) => [...m, optimistic]);
    setSending(true);
    try {
      const res = await api.post<{ user: ChatMessage; assistant: ChatMessage }>(
        `/chat/sessions/${session.id}/messages`,
        { content },
      );
      setMessages((m) => [...m.filter((x) => x.id !== optimistic.id), res.user, res.assistant]);
    } catch (err: any) {
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
      setInput(content);
      setError(err?.message ?? 'Message failed. Is an AI provider configured in Settings?');
    } finally {
      setSending(false);
    }
  }

  const contextCount = messages.find((m) => m.role === 'assistant')?.citedFiles.length;

  return (
    <div className="mx-auto flex h-[calc(100vh-220px)] max-w-[860px] flex-col">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="m-0 text-[20px] font-semibold tracking-[-0.02em]">Chat with Code</h2>
        <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/[0.1] px-[13px] py-[7px] text-[12.5px] text-brand-soft">
          <IconChat size={14} /> {project.fileCount} files available as context
        </span>
      </div>

      <div ref={scrollRef} className="flex flex-1 flex-col gap-[18px] overflow-y-auto p-[6px_2px_18px]">
        {messages.length === 0 && !sending && (
          <div className="m-auto max-w-[40ch] text-center text-sm text-text-muted">
            Ask anything about this codebase — e.g. <span className="text-text">“Explain how authentication works”</span> or <span className="text-text">“Which file handles database connections?”</span>
          </div>
        )}

        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="flex justify-end gap-3">
              <div className="max-w-[78%] whitespace-pre-wrap rounded-[14px_14px_4px_14px] border border-brand/34 bg-brand/[0.14] p-[13px_16px] text-[14.5px] leading-[1.55]">{m.content}</div>
              <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-full text-[13px] font-semibold" style={{ background: 'linear-gradient(150deg,#a78bfa,#6d28d9)' }}>{user ? initials(user.name) : 'ME'}</span>
            </div>
          ) : (
            <div key={m.id} className="flex gap-3">
              <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-full border border-brand/34 bg-brand/[0.16] text-brand-soft"><IconChat size={17} /></span>
              <div className="max-w-[80%] rounded-[14px_14px_14px_4px] border border-white/[0.08] bg-white/[0.03] p-[15px_17px]">
                <p className="m-0 whitespace-pre-wrap text-[14.5px] leading-[1.6] text-[#dad6e8]">{m.content}</p>
                {m.citedFiles.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-white/[0.06] pt-3">
                    {m.citedFiles.map((f) => (
                      <span key={f} className="rounded-[6px] border border-white/[0.08] bg-white/[0.03] px-2 py-[3px] font-mono text-[11px] text-brand-soft">{f}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ),
        )}

        {sending && (
          <div className="flex items-center gap-3">
            <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-full border border-brand/34 bg-brand/[0.16] text-brand-soft"><IconChat size={17} /></span>
            <div className="flex gap-[5px] rounded-[14px] border border-white/[0.08] bg-white/[0.03] p-[14px_16px]">
              <span className="h-[7px] w-[7px] animate-pulse2 rounded-full bg-brand" />
              <span className="h-[7px] w-[7px] animate-pulse2 rounded-full bg-brand [animation-delay:.2s]" />
              <span className="h-[7px] w-[7px] animate-pulse2 rounded-full bg-brand [animation-delay:.4s]" />
            </div>
          </div>
        )}
      </div>

      {error && <p className="mb-2 text-[13px] text-sev-critical-fg">{error}</p>}

      <form onSubmit={send} className="flex flex-none items-center gap-[10px] rounded-[14px] border border-white/[0.12] bg-white/[0.03] p-[6px_6px_6px_16px]">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about the loaded files…"
          className="flex-1 border-none bg-transparent py-[10px] text-[14.5px] text-text outline-none"
        />
        <button type="submit" disabled={sending || !input.trim()} className="grid h-10 w-10 flex-none place-items-center rounded-[10px] border border-white/[0.18] disabled:opacity-50" style={{ background: 'linear-gradient(180deg,#9b6cf8,#7c3aed)' }}>
          <IconArrowRight size={18} className="text-white" />
        </button>
      </form>
    </div>
  );
}
