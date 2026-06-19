/**
 * Typed fetch wrapper around the Sift API. Reads the JWT from localStorage and
 * attaches it as a Bearer token. Centralizes base URL, error shaping, and the
 * 401 → logout redirect so pages stay declarative.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ?? 'http://localhost:4000/api';

const TOKEN_KEY = 'sift_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Set false for FormData uploads (browser sets the multipart boundary). */
  json?: boolean;
  raw?: BodyInit;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, json = true, raw } = options;
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (raw !== undefined) {
    payload = raw;
  } else if (body !== undefined && json) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, { method, headers, body: payload });

  if (res.status === 401 && typeof window !== 'undefined') {
    setToken(null);
    if (!window.location.pathname.startsWith('/auth')) {
      window.location.href = '/auth';
    }
  }

  if (!res.ok) {
    const message = await extractError(res);
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function extractError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    const msg = data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
    return res.statusText;
  } catch {
    return res.statusText || 'Request failed';
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, form: FormData) =>
    request<T>(path, { method: 'POST', json: false, raw: form }),
};
