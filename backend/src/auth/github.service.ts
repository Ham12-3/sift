import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GithubProfile {
  githubId: string;
  email: string;
  name: string;
  avatarUrl: string;
}

export interface GithubRepo {
  fullName: string;
  name: string;
  private: boolean;
  defaultBranch: string;
  htmlUrl: string;
  updatedAt: string;
}

/**
 * Encapsulates the GitHub OAuth web flow (no extra Passport strategy needed):
 * build the authorize URL, exchange the code for a token, and fetch the profile.
 */
@Injectable()
export class GithubService {
  constructor(private readonly config: ConfigService) {}

  /** True only when the operator has supplied OAuth app credentials. */
  isConfigured(): boolean {
    return Boolean(this.config.get('GITHUB_CLIENT_ID') && this.config.get('GITHUB_CLIENT_SECRET'));
  }

  get frontendUrl(): string {
    return (this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000').replace(/\/+$/, '');
  }

  private get callbackUrl(): string {
    return (
      this.config.get<string>('GITHUB_CALLBACK_URL') ??
      'http://localhost:4000/api/auth/github/callback'
    );
  }

  buildAuthorizeUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.get<string>('GITHUB_CLIENT_ID') ?? '',
      redirect_uri: this.callbackUrl,
      // `repo` lets the issued token read the user's private repositories so we
      // can import them. (OAuth apps have no read-only private-repo scope.)
      scope: 'read:user user:email repo',
      state,
      allow_signup: 'true',
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForProfile(code: string): Promise<{ profile: GithubProfile; accessToken: string }> {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: this.config.get('GITHUB_CLIENT_ID'),
        client_secret: this.config.get('GITHUB_CLIENT_SECRET'),
        code,
        redirect_uri: this.callbackUrl,
      }),
    });
    const tokenJson = (await tokenRes.json()) as { access_token?: string; error?: string };
    if (!tokenJson.access_token) {
      throw new BadGatewayException(`GitHub token exchange failed: ${tokenJson.error ?? 'unknown'}`);
    }
    const token = tokenJson.access_token;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Sift',
    };

    const userRes = await fetch('https://api.github.com/user', { headers });
    if (!userRes.ok) throw new BadGatewayException('Failed to read GitHub profile');
    const ghUser = (await userRes.json()) as {
      id: number;
      login: string;
      name: string | null;
      email: string | null;
      avatar_url: string;
    };

    // Primary email may be private; fetch the verified primary from /user/emails.
    let email = ghUser.email;
    if (!email) {
      const emailRes = await fetch('https://api.github.com/user/emails', { headers });
      if (emailRes.ok) {
        const emails = (await emailRes.json()) as {
          email: string;
          primary: boolean;
          verified: boolean;
        }[];
        email = emails.find((e) => e.primary && e.verified)?.email ?? emails[0]?.email ?? null;
      }
    }
    if (!email) email = `${ghUser.login}@users.noreply.github.com`;

    return {
      profile: {
        githubId: String(ghUser.id),
        email: email.toLowerCase(),
        name: ghUser.name || ghUser.login,
        avatarUrl: ghUser.avatar_url,
      },
      accessToken: token,
    };
  }

  /** Lists repositories the token can access, most-recently-updated first. */
  async listRepos(token: string): Promise<GithubRepo[]> {
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Sift',
    };
    const repos: GithubRepo[] = [];
    // Two pages (200 repos) keeps the list useful without unbounded paging.
    for (let page = 1; page <= 2; page++) {
      const res = await fetch(
        `https://api.github.com/user/repos?per_page=100&sort=updated&page=${page}`,
        { headers },
      );
      if (!res.ok) break;
      const batch = (await res.json()) as Array<{
        full_name: string;
        name: string;
        private: boolean;
        default_branch: string;
        html_url: string;
        updated_at: string;
      }>;
      repos.push(
        ...batch.map((r) => ({
          fullName: r.full_name,
          name: r.name,
          private: r.private,
          defaultBranch: r.default_branch,
          htmlUrl: r.html_url,
          updatedAt: r.updated_at,
        })),
      );
      if (batch.length < 100) break;
    }
    return repos;
  }
}
