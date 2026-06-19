/**
 * Lightweight keyword-overlap retrieval. The assessment explicitly allows
 * "simple context retrieval", so rather than pull in a vector database we score
 * each file by how many distinct query terms appear in its path and content,
 * weighting path matches higher (a filename match is a strong signal).
 */
export interface RetrievableFile {
  path: string;
  language: string;
  content: string;
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'how', 'does', 'do', 'what', 'which', 'where',
  'in', 'on', 'of', 'to', 'and', 'or', 'for', 'this', 'that', 'with', 'it',
  'work', 'works', 'explain', 'show', 'me', 'my', 'code', 'file', 'files',
]);

function tokenize(text: string): string[] {
  const matches: string[] = text.toLowerCase().match(/[a-z0-9_]+/g) ?? [];
  return matches.filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

export function selectRelevantFiles(
  query: string,
  files: RetrievableFile[],
  limit = 6,
): RetrievableFile[] {
  const terms = Array.from(new Set(tokenize(query)));
  if (!terms.length) {
    // No usable query terms — fall back to the largest/most central files.
    return [...files].sort((a, b) => b.content.length - a.content.length).slice(0, limit);
  }

  const scored = files.map((file) => {
    const pathLower = file.path.toLowerCase();
    const contentLower = file.content.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (pathLower.includes(term)) score += 5;
      const occurrences = contentLower.split(term).length - 1;
      score += Math.min(occurrences, 5); // cap so one huge file can't dominate
    }
    return { file, score };
  });

  const ranked = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.file);

  // If nothing matched, return a small sample so the model still has context.
  return ranked.length ? ranked : files.slice(0, Math.min(limit, files.length));
}

/** Builds a fenced, path-labelled context block within a character budget. */
export function buildChatContext(files: RetrievableFile[], maxChars = 40_000): string {
  const blocks: string[] = [];
  let used = 0;
  for (const file of files) {
    const header = `\n--- ${file.path} ---\n`;
    const body = '```' + file.language + '\n' + file.content + '\n```\n';
    const chunk = header + body;
    if (used + chunk.length > maxChars) break;
    blocks.push(chunk);
    used += chunk.length;
  }
  return blocks.join('');
}
