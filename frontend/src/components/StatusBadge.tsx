import type { Review, Severity } from '@/lib/types';

type Tone = 'Passed' | 'Issues' | 'Critical' | 'Reviewing' | 'Not reviewed';

const TONE_STYLE: Record<Tone, { fg: string; bg: string; bd: string; dot: string }> = {
  Passed: { fg: '#6ee7b7', bg: 'rgba(52,211,153,.12)', bd: 'rgba(52,211,153,.32)', dot: '#34d399' },
  Issues: { fg: '#fde68a', bg: 'rgba(251,191,36,.12)', bd: 'rgba(251,191,36,.32)', dot: '#fbbf24' },
  Critical: { fg: '#ffb3bc', bg: 'rgba(244,63,94,.12)', bd: 'rgba(244,63,94,.32)', dot: '#fb5b6b' },
  Reviewing: { fg: '#c4b5fd', bg: 'rgba(139,92,246,.14)', bd: 'rgba(139,92,246,.34)', dot: '#a78bfa' },
  'Not reviewed': { fg: '#a39fb8', bg: 'rgba(255,255,255,.04)', bd: 'rgba(255,255,255,.1)', dot: '#76728c' },
};

/** Derives a project status from its most recent review. */
export function deriveTone(latest: Review | undefined): Tone {
  if (!latest) return 'Not reviewed';
  if (latest.status === 'pending') return 'Reviewing';
  if (latest.status === 'failed') return 'Issues';
  const top = latest.topSeverity as Severity | 'none';
  if (top === 'critical' || top === 'high') return 'Critical';
  if (top === 'medium' || top === 'low') return 'Issues';
  return 'Passed';
}

export function StatusBadge({ tone }: { tone: Tone }) {
  const s = TONE_STYLE[tone];
  return (
    <span className="inline-flex items-center gap-[6px] rounded-full border px-[10px] py-[5px] text-xs font-medium" style={{ color: s.fg, background: s.bg, borderColor: s.bd }}>
      <span className="h-[6px] w-[6px] rounded-full" style={{ background: s.dot }} />
      {tone}
    </span>
  );
}
