/** Maps a file extension (lowercase, no dot) to a highlight.js language id. */
const EXT_TO_LANG: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  py: 'python',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  java: 'java',
  kt: 'kotlin',
  c: 'c',
  h: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  hpp: 'cpp',
  cs: 'csharp',
  php: 'php',
  swift: 'swift',
  scala: 'scala',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  sql: 'sql',
  html: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  json: 'json',
  yml: 'yaml',
  yaml: 'yaml',
  toml: 'toml',
  xml: 'xml',
  md: 'markdown',
  markdown: 'markdown',
  vue: 'xml',
  svelte: 'xml',
  dockerfile: 'dockerfile',
  env: 'bash',
};

export function detectLanguage(path: string): string {
  const name = path.split('/').pop() ?? path;
  if (name.toLowerCase() === 'dockerfile') return 'dockerfile';
  const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';
  return EXT_TO_LANG[ext] ?? 'plaintext';
}

/** Directory/file patterns we never want to ingest (noise, binaries, secrets). */
const IGNORED_SEGMENTS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'out',
  'coverage',
  '.cache',
  'vendor',
  '__pycache__',
  '.venv',
  'venv',
  '.idea',
  '.vscode',
]);

const IGNORED_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'svg', 'bmp', 'tiff',
  'pdf', 'zip', 'tar', 'gz', 'rar', '7z', 'jar', 'war',
  'mp3', 'mp4', 'mov', 'avi', 'wav', 'ogg', 'webm',
  'woff', 'woff2', 'ttf', 'otf', 'eot',
  'exe', 'dll', 'so', 'dylib', 'bin', 'class', 'o', 'a',
  'lock', 'map', 'min.js', 'min.css',
]);

export function shouldIgnore(path: string): boolean {
  const segments = path.split('/');
  if (segments.some((s) => IGNORED_SEGMENTS.has(s))) return true;
  const name = segments[segments.length - 1] ?? '';
  const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';
  return IGNORED_EXTENSIONS.has(ext);
}

/** Heuristic: treat a buffer as binary if it contains a NUL byte in the first 8KB. */
export function looksBinary(buf: Buffer): boolean {
  const slice = buf.subarray(0, 8192);
  return slice.includes(0);
}

/** Normalizes a path: strips leading slashes, collapses backslashes, drops a common top-level folder. */
export function normalizePath(raw: string): string {
  return raw.replace(/\\/g, '/').replace(/^\/+/, '').replace(/^\.\//, '');
}

// ── File tree ──────────────────────────────────────────
export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  language?: string;
  size?: number;
  children?: TreeNode[];
}

/** Builds a nested folder/file tree from a flat list of file paths. */
export function buildTree(
  files: { path: string; language: string; size: number }[],
): TreeNode[] {
  const root: TreeNode = { name: '', path: '', type: 'dir', children: [] };

  for (const file of files) {
    const parts = file.path.split('/');
    let cursor = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLeaf = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join('/');
      if (isLeaf) {
        cursor.children!.push({
          name: part,
          path: currentPath,
          type: 'file',
          language: file.language,
          size: file.size,
        });
      } else {
        let dir = cursor.children!.find((c) => c.type === 'dir' && c.name === part);
        if (!dir) {
          dir = { name: part, path: currentPath, type: 'dir', children: [] };
          cursor.children!.push(dir);
        }
        cursor = dir;
      }
    }
  }

  // Sort: directories first, then files, alphabetically within each group.
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => n.children && sortNodes(n.children));
  };
  sortNodes(root.children!);
  return root.children!;
}
