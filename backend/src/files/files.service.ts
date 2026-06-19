import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import AdmZip from 'adm-zip';
import { CodeFile, CodeFileDocument } from './file.schema';
import { ProjectsService } from '../projects/projects.service';
import { UsersService } from '../users/users.service';
import {
  buildTree,
  detectLanguage,
  looksBinary,
  normalizePath,
  shouldIgnore,
  TreeNode,
} from './file-utils';

/** A single file ready to persist. */
interface IngestEntry {
  path: string;
  content: string;
  size: number;
}

// Skip files larger than this (per file) — they bloat storage and AI context.
const MAX_FILE_BYTES = 512 * 1024; // 512 KB

@Injectable()
export class FilesService {
  constructor(
    @InjectModel(CodeFile.name) private readonly fileModel: Model<CodeFileDocument>,
    private readonly projects: ProjectsService,
    private readonly users: UsersService,
  ) {}

  // ── Ingestion sources ────────────────────────────────

  async ingestZip(userId: string, projectId: string, buffer: Buffer): Promise<{ added: number }> {
    await this.projects.getOwned(userId, projectId);
    let zip: AdmZip;
    try {
      zip = new AdmZip(buffer);
    } catch {
      throw new BadRequestException('Could not read the uploaded archive — is it a valid .zip?');
    }
    const entries = zip
      .getEntries()
      .filter((e) => !e.isDirectory)
      .map((e) => ({ path: normalizePath(e.entryName), buffer: e.getData() }));
    return this.persist(projectId, this.toEntries(stripCommonRoot(entries)));
  }

  async ingestUploads(
    userId: string,
    projectId: string,
    files: { originalname: string; buffer: Buffer }[],
  ): Promise<{ added: number }> {
    await this.projects.getOwned(userId, projectId);
    const raw = files.map((f) => ({ path: normalizePath(f.originalname), buffer: f.buffer }));
    return this.persist(projectId, this.toEntries(raw));
  }

  async ingestGithub(
    userId: string,
    projectId: string,
    repoUrl: string,
    explicitToken?: string,
  ): Promise<{ added: number }> {
    await this.projects.getOwned(userId, projectId);
    // Prefer a token the user pasted; otherwise fall back to their stored
    // GitHub OAuth token (set when they signed in with GitHub). Either enables
    // private-repo access; with neither, only public repos resolve.
    const token = explicitToken?.trim() || (await this.users.getGithubToken(userId)) || undefined;
    const buffer = await downloadGithubZip(repoUrl, token);
    return this.ingestZip(userId, projectId, buffer);
  }

  // ── Reads ────────────────────────────────────────────

  async getTree(userId: string, projectId: string): Promise<TreeNode[]> {
    await this.projects.getOwned(userId, projectId);
    const files = await this.fileModel
      .find({ project: new Types.ObjectId(projectId) }, 'path language size')
      .lean()
      .exec();
    return buildTree(files.map((f) => ({ path: f.path, language: f.language, size: f.size })));
  }

  async getFileByPath(userId: string, projectId: string, path: string): Promise<CodeFileDocument> {
    await this.projects.getOwned(userId, projectId);
    const file = await this.fileModel
      .findOne({ project: new Types.ObjectId(projectId), path: normalizePath(path) })
      .exec();
    if (!file) {
      throw new BadRequestException('File not found in this project');
    }
    return file;
  }

  /** Loads file documents for a set of paths (used by the review/chat engines). */
  async getFilesForContext(
    projectId: string,
    paths?: string[],
  ): Promise<{ path: string; language: string; content: string }[]> {
    const query: Record<string, unknown> = { project: new Types.ObjectId(projectId) };
    if (paths && paths.length) {
      query.path = { $in: paths.map(normalizePath) };
    }
    const files = await this.fileModel.find(query, 'path language content').lean().exec();
    return files.map((f) => ({ path: f.path, language: f.language, content: f.content }));
  }

  // ── Internals ────────────────────────────────────────

  private toEntries(raw: { path: string; buffer: Buffer }[]): IngestEntry[] {
    const entries: IngestEntry[] = [];
    for (const { path, buffer } of raw) {
      if (!path || shouldIgnore(path)) continue;
      if (buffer.length > MAX_FILE_BYTES || looksBinary(buffer)) continue;
      entries.push({ path, content: buffer.toString('utf8'), size: buffer.length });
    }
    return entries;
  }

  private async persist(projectId: string, entries: IngestEntry[]): Promise<{ added: number }> {
    if (!entries.length) {
      throw new BadRequestException('No readable source files were found in the upload');
    }
    const pid = new Types.ObjectId(projectId);
    await this.fileModel.bulkWrite(
      entries.map((e) => ({
        updateOne: {
          filter: { project: pid, path: e.path },
          update: {
            $set: {
              project: pid,
              path: e.path,
              content: e.content,
              size: e.size,
              language: detectLanguage(e.path),
            },
          },
          upsert: true,
        },
      })),
    );
    await this.projects.recountFiles(pid);
    return { added: entries.length };
  }
}

/** GitHub zips wrap everything in a `owner-repo-sha/` folder; uploads may share a root too. */
function stripCommonRoot(
  entries: { path: string; buffer: Buffer }[],
): { path: string; buffer: Buffer }[] {
  if (entries.length === 0) return entries;
  const firstSegments = entries.map((e) => e.path.split('/')[0]);
  const root = firstSegments[0];
  const allShareRoot =
    root && firstSegments.every((s) => s === root) && entries.some((e) => e.path.includes('/'));
  if (!allShareRoot) return entries;
  return entries.map((e) => ({ path: e.path.slice(root.length + 1), buffer: e.buffer }));
}

/**
 * Resolves a GitHub repo URL to a downloadable zip and fetches it.
 * - With a token: uses the authenticated GitHub API zipball endpoint, which
 *   works for private repos the token can access (and public ones too).
 * - Without a token: uses the public codeload endpoint.
 */
async function downloadGithubZip(repoUrl: string, token?: string): Promise<Buffer> {
  const match = repoUrl
    .trim()
    .replace(/\.git$/, '')
    .match(/github\.com\/([^/]+)\/([^/]+?)(?:\/tree\/([^/]+))?\/?$/i);
  if (!match) {
    throw new BadRequestException('Expected a URL like https://github.com/owner/repo');
  }
  const [, owner, repo, branch] = match;

  if (token) {
    // GitHub's zipball endpoint redirects to a pre-signed codeload URL. Node's
    // fetch strips the Authorization header across that cross-origin redirect,
    // so we follow it manually: the redirect target is already authenticated.
    const refPath = branch ? `/${encodeURIComponent(branch)}` : '';
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/zipball${refPath}`;
    const res = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'Sift',
      },
      redirect: 'manual',
    });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (location) {
        const dl = await fetch(location);
        if (dl.ok) return Buffer.from(await dl.arrayBuffer());
      }
    } else if (res.ok) {
      return Buffer.from(await res.arrayBuffer());
    }
    if (res.status === 404) {
      throw new BadRequestException(
        'Repository not found or not accessible with your GitHub access. If it is private, re-connect GitHub (to grant repo access) or paste a token with repo scope.',
      );
    }
    throw new BadRequestException('Could not fetch this repository with your GitHub access.');
  }

  // Public path: codeload serves a zip without authentication.
  const refs = branch ? [branch] : ['main', 'master'];
  for (const ref of refs) {
    const url = `https://codeload.github.com/${owner}/${repo}/zip/refs/heads/${ref}`;
    const res = await fetch(url);
    if (res.ok) {
      return Buffer.from(await res.arrayBuffer());
    }
  }
  throw new BadRequestException(
    'Could not fetch this repository. Make sure it is public (sign in with GitHub or paste a token for private repos) and the branch exists.',
  );
}
