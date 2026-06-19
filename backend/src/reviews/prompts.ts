import { ReviewTemplate } from './review.schema';

/** Human-facing metadata for each review mode (also surfaced to the frontend). */
export const REVIEW_TEMPLATES: Record<
  ReviewTemplate,
  { label: string; description: string; focus: string[] }
> = {
  security: {
    label: 'Security Review',
    description: 'Find vulnerabilities and unsafe handling of data and secrets.',
    focus: [
      'Hardcoded credentials, API keys, and secrets',
      'Authentication and authorization flaws',
      'Missing or weak input validation',
      'Injection risks (SQL, command, XSS, SSRF)',
      'Insecure dependencies and unsafe deserialization',
    ],
  },
  performance: {
    label: 'Performance Review',
    description: 'Identify slow paths, wasteful work, and scaling risks.',
    focus: [
      'Slow or blocking operations on hot paths',
      'Inefficient rendering and unnecessary re-renders',
      'N+1 queries and unnecessary database round-trips',
      'Memory leaks and unbounded growth',
      'Missing caching, batching, or pagination',
    ],
  },
  quality: {
    label: 'Code Quality Review',
    description: 'Assess readability, structure, and long-term maintainability.',
    focus: [
      'Naming clarity and consistency',
      'Module structure and separation of concerns',
      'Readability and complexity',
      'Error handling and edge cases',
      'Duplication and maintainability',
    ],
  },
};

/**
 * The model is asked to return strict JSON. We describe the exact shape so the
 * response can be parsed and persisted without brittle text scraping.
 */
const OUTPUT_CONTRACT = `
Respond ONLY with a JSON object matching this TypeScript type — no markdown, no prose outside the JSON:

{
  "summary": string,              // 2-4 sentence high-level overview of findings
  "issues": Array<{
    "title": string,              // short problem statement
    "description": string,        // what and why it matters
    "severity": "critical" | "high" | "medium" | "low",
    "file": string,               // file path the issue is in (use "" if project-wide)
    "line": number | null,        // best-effort line number, or null
    "recommendation": string      // concrete suggested fix
  }>,
  "recommendations": string[]     // 3-6 high-level improvement suggestions
}

Severity guidance:
- critical: exploitable security hole, data loss, or crash in normal use
- high: serious bug or risk likely to bite in production
- medium: real issue worth fixing soon
- low: minor / stylistic / nice-to-have
If there are no issues, return an empty "issues" array and say so in the summary.`;

export function buildSystemPrompt(template: ReviewTemplate): string {
  const meta = REVIEW_TEMPLATES[template];
  return [
    `You are Sift, a meticulous senior engineer performing a ${meta.label}.`,
    `Focus your analysis on:`,
    ...meta.focus.map((f) => `- ${f}`),
    ``,
    `Be specific and actionable. Reference real symbols and paths from the provided code.`,
    `Do not invent issues; only report what the code actually shows.`,
    OUTPUT_CONTRACT,
  ].join('\n');
}

/** Concatenates the selected files into a fenced, path-labelled context block. */
export function buildCodeContext(
  files: { path: string; language: string; content: string }[],
  maxChars = 60_000,
): string {
  const blocks: string[] = [];
  let used = 0;
  for (const file of files) {
    const header = `\n=== FILE: ${file.path} ===\n`;
    const body = '```' + file.language + '\n' + file.content + '\n```\n';
    const chunk = header + body;
    if (used + chunk.length > maxChars) {
      blocks.push(`\n=== FILE: ${file.path} (truncated — review budget reached) ===\n`);
      break;
    }
    blocks.push(chunk);
    used += chunk.length;
  }
  return blocks.join('');
}

export function buildUserPrompt(
  files: { path: string; language: string; content: string }[],
): string {
  return [
    `Review the following ${files.length} file(s):`,
    buildCodeContext(files),
    ``,
    `Now produce your review as the specified JSON object.`,
  ].join('\n');
}
