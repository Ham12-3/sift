/**
 * End-to-end smoke test for the Sift API (non-AI paths).
 * Assumes the API is running at BASE and MongoDB is reachable.
 * Run: node smoke-test.mjs
 */
import AdmZip from 'adm-zip';

const BASE = process.env.SMOKE_BASE ?? 'http://localhost:4000/api';
let pass = 0;
let fail = 0;

function ok(name, cond, extra = '') {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name} ${extra}`); }
}

async function j(method, path, body, token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !(body instanceof Buffer)) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? (body instanceof Buffer ? body : JSON.stringify(body)) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

async function upload(path, form, token) {
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

const run = async () => {
  console.log(`\nSift smoke test → ${BASE}\n`);
  const email = `smoke_${Date.now()}@test.dev`;

  // Auth
  let r = await j('POST', '/auth/register', { email, name: 'Smoke Test', password: 'password123' });
  ok('register returns token + user', r.status === 201 && r.data?.accessToken && r.data?.user?.email === email, JSON.stringify(r.data));
  const token = r.data.accessToken;

  r = await j('GET', '/auth/me', null, token);
  ok('me returns current user', r.status === 200 && r.data?.email === email);

  r = await j('GET', '/projects', null, null);
  ok('protected route rejects missing token (401)', r.status === 401);

  r = await j('POST', '/auth/login', { email, password: 'wrong' });
  ok('login rejects wrong password (401)', r.status === 401);

  // Projects
  r = await j('POST', '/projects', { name: 'auth-gateway', description: 'OAuth2 / OIDC' }, token);
  ok('create project', r.status === 201 && r.data?.id, JSON.stringify(r.data));
  const projectId = r.data.id;

  r = await j('GET', '/projects', null, token);
  ok('list projects shows the new one', r.status === 200 && r.data.some((p) => p.id === projectId));

  // Upload a ZIP
  const zip = new AdmZip();
  zip.addFile('src/auth.ts', Buffer.from(`export function issueToken(u){ const secret='s3cr3t'; return sign(u, secret); }\n`));
  zip.addFile('src/lib/db.ts', Buffer.from(`export const db = connect(process.env.DB_URL);\n`));
  zip.addFile('node_modules/junk/x.js', Buffer.from(`module.exports = 1;\n`)); // should be ignored
  zip.addFile('logo.png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x01])); // binary → ignored
  const form = new FormData();
  form.append('file', new Blob([zip.toBuffer()]), 'code.zip');
  r = await upload(`/projects/${projectId}/files/upload/zip`, form, token);
  ok('zip upload ingests source files only', r.status === 201 && r.data?.added === 2, JSON.stringify(r.data));

  // Tree + content
  r = await j('GET', `/projects/${projectId}/files/tree`, null, token);
  const hasSrcDir = Array.isArray(r.data) && r.data.some((n) => n.type === 'dir' && n.name === 'src');
  ok('file tree builds folder hierarchy', r.status === 200 && hasSrcDir, JSON.stringify(r.data));

  r = await j('GET', `/projects/${projectId}/files/content?path=src/auth.ts`, null, token);
  ok('file content + language detection', r.status === 200 && r.data?.language === 'typescript' && r.data.content.includes('issueToken'));

  // Project file count updated
  r = await j('GET', `/projects/${projectId}`, null, token);
  ok('project fileCount reflects upload (2)', r.status === 200 && r.data?.fileCount === 2, `count=${r.data?.fileCount}`);

  // Review templates
  r = await j('GET', '/review-templates', null, token);
  ok('review templates lists 3 modes', r.status === 200 && r.data.length === 3 && r.data.map((t) => t.key).sort().join(',') === 'performance,quality,security');

  // Provider CRUD (no real AI call)
  r = await j('POST', '/providers', { name: 'Local LM', baseUrl: 'http://localhost:1234/v1', model: 'test-model', apiKey: 'sk-secret-1234' }, token);
  ok('create provider (first is default)', r.status === 201 && r.data?.isDefault === true && r.data?.apiKeyHint?.includes('1234'));
  const providerId = r.data.id;
  ok('provider never returns raw key', !JSON.stringify(r.data).includes('sk-secret-1234'));

  // Review requires provider — but real review needs a reachable model; assert it at least reaches the engine
  r = await j('POST', `/projects/${projectId}/reviews`, { template: 'security', paths: [] }, token);
  ok('review reaches AI engine (502 bad gateway w/o real model, not 400/500)', r.status === 502 || r.status === 201, `status=${r.status} ${JSON.stringify(r.data)}`);

  // Chat session
  r = await j('POST', `/projects/${projectId}/chat/sessions`, {}, token);
  ok('create chat session', r.status === 201 && r.data?.id);

  // History
  r = await j('GET', '/reviews', null, token);
  ok('global review history returns array', r.status === 200 && Array.isArray(r.data));

  // Ownership isolation: a second user cannot see the project
  const email2 = `smoke2_${Date.now()}@test.dev`;
  const r2 = await j('POST', '/auth/register', { email: email2, name: 'Other', password: 'password123' });
  const token2 = r2.data.accessToken;
  r = await j('GET', `/projects/${projectId}`, null, token2);
  ok('ownership: other user gets 403/404 on foreign project', r.status === 403 || r.status === 404, `status=${r.status}`);

  // Cleanup / delete cascade
  r = await j('DELETE', `/projects/${projectId}`, null, token);
  ok('delete project', r.status === 200 && r.data?.success);
  r = await j('GET', `/projects/${projectId}`, null, token);
  ok('deleted project is gone (404)', r.status === 404);

  console.log(`\n${pass} passed, ${fail} failed\n`);
  process.exit(fail ? 1 : 0);
};

run().catch((e) => { console.error('Smoke test crashed:', e); process.exit(1); });
