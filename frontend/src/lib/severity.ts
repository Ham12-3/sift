import type { Severity, ReviewTemplate } from './types';

/** Inline-style color sets per severity, matching sevMap in the mockup. */
export const SEVERITY_STYLE: Record<
  Severity,
  { fg: string; bg: string; bd: string; accent: string; label: string }
> = {
  critical: { fg: '#ffb3bc', bg: 'rgba(244,63,94,.14)', bd: 'rgba(244,63,94,.4)', accent: '#fb5b6b', label: 'Critical' },
  high: { fg: '#ffd2a8', bg: 'rgba(251,146,60,.14)', bd: 'rgba(251,146,60,.4)', accent: '#fb923c', label: 'High' },
  medium: { fg: '#fde68a', bg: 'rgba(251,191,36,.14)', bd: 'rgba(251,191,36,.4)', accent: '#fbbf24', label: 'Medium' },
  low: { fg: '#bfdbfe', bg: 'rgba(96,165,250,.14)', bd: 'rgba(96,165,250,.4)', accent: '#60a5fa', label: 'Low' },
};

export const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low'];

/** Dot color for a review's headline status, mirroring statusMap. */
export function topSeverityDot(top: Severity | 'none'): string {
  if (top === 'none') return '#34d399';
  return SEVERITY_STYLE[top].accent;
}

export const TEMPLATE_LABEL: Record<ReviewTemplate, string> = {
  security: 'Security',
  performance: 'Performance',
  quality: 'Code Quality',
};

/** Short human result line for a review, e.g. "1 critical · 2 high". */
export function reviewResultLine(counts: Record<Severity, number>): string {
  const parts = SEVERITY_ORDER.filter((s) => counts[s] > 0).map(
    (s) => `${counts[s]} ${s}`,
  );
  return parts.length ? parts.join(' · ') : 'Clean — 0 issues';
}
