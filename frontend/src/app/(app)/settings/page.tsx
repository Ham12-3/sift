'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import type { Provider, EnvDefaultInfo } from '@/lib/types';
import { IconEye, IconPlus, IconTrash } from '@/components/icons';

const PRESETS = [
  { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o', needsKey: true },
  { name: 'LM Studio', baseUrl: 'http://localhost:1234/v1', model: 'local-model', needsKey: false },
  { name: 'Ollama', baseUrl: 'http://localhost:11434/v1', model: 'llama3.1', needsKey: false },
  { name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', model: 'anthropic/claude-3.5-sonnet', needsKey: true },
];

interface FormState {
  id: string | null;
  name: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  isDefault: boolean;
}

const EMPTY: FormState = { id: null, name: '', baseUrl: '', model: '', apiKey: '', isDefault: false };

export default function SettingsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [envDefault, setEnvDefault] = useState<EnvDefaultInfo | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [test, setTest] = useState<{ ok: boolean; message: string } | null>(null);
  const [error, setError] = useState('');

  function load() {
    api.get<Provider[]>('/providers').then(setProviders);
    api.get<EnvDefaultInfo>('/providers/env-default').then(setEnvDefault).catch(() => undefined);
  }
  useEffect(load, []);

  function applyPreset(p: (typeof PRESETS)[number]) {
    setForm((f) => ({ ...f, name: f.name || p.name, baseUrl: p.baseUrl, model: p.model }));
    setTest(null);
  }

  function editProvider(p: Provider) {
    setForm({ id: p.id, name: p.name, baseUrl: p.baseUrl, model: p.model, apiKey: '', isDefault: p.isDefault });
    setTest(null);
    setError('');
  }

  function newProvider() {
    setForm(EMPTY);
    setTest(null);
    setError('');
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        baseUrl: form.baseUrl,
        model: form.model,
        isDefault: form.isDefault,
      };
      // Only send the key when the user typed one (editing keeps the stored key).
      if (form.apiKey) payload.apiKey = form.apiKey;

      if (form.id) {
        await api.patch(`/providers/${form.id}`, payload);
      } else {
        const created = await api.post<Provider>('/providers', payload);
        setForm((f) => ({ ...f, id: created.id }));
      }
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save provider');
    } finally {
      setSaving(false);
    }
  }

  async function testConnection() {
    if (!form.id) {
      setTest({ ok: false, message: 'Save the provider first, then test.' });
      return;
    }
    setTesting(true);
    setTest(null);
    try {
      const res = await api.post<{ ok: boolean; message: string }>(`/providers/${form.id}/test`, {});
      setTest(res);
    } finally {
      setTesting(false);
    }
  }

  async function remove(id: string) {
    await api.delete(`/providers/${id}`);
    if (form.id === id) newProvider();
    load();
  }

  return (
    <div className="max-w-[720px]">
      <div className="mb-6">
        <h1 className="m-0 text-[28px] font-semibold tracking-[-0.02em]">AI Provider</h1>
        <p className="mt-[6px] text-sm text-text-muted">Connect the model that powers your reviews and chat. Configuration is per-account and never hardcoded.</p>
      </div>

      {envDefault?.configured && (
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-[12px] border border-brand/30 bg-brand/[0.08] p-[14px]">
          <span className="h-2 w-2 rounded-full bg-brand" style={{ boxShadow: '0 0 8px #a78bfa' }} />
          <span className="text-[13.5px] text-text">
            Environment default active: <b>{envDefault.name}</b>
            <span className="ml-2 font-mono text-[12px] text-text-muted">{envDefault.baseUrl} · {envDefault.model}</span>
          </span>
          <span className="ml-auto text-[12.5px] text-text-dim">Used when you have no provider below. Any provider you add overrides it.</span>
        </div>
      )}

      {/* saved providers */}
      {providers.length > 0 && (
        <div className="mb-6">
          <div className="mb-2 text-[11px] uppercase tracking-[0.08em] text-text-dim">Your providers</div>
          <div className="flex flex-col gap-2">
            {providers.map((p) => (
              <div key={p.id} className={`flex items-center gap-3 rounded-[12px] border p-[12px_14px] ${form.id === p.id ? 'border-brand/40 bg-brand/[0.1]' : 'border-white/[0.1] bg-white/[0.02]'}`}>
                <button onClick={() => editProvider(p)} className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-[14.5px] font-semibold">{p.name}</span>
                    {p.isDefault && <span className="rounded-full border border-brand/34 bg-brand/[0.14] px-2 py-[1px] text-[11px] text-brand-soft">Default</span>}
                  </div>
                  <div className="mt-1 font-mono text-[11.5px] text-text-dim">{p.baseUrl} · {p.model} {p.apiKeyHint && `· ${p.apiKeyHint}`}</div>
                </button>
                <button onClick={() => remove(p.id)} title="Delete" className="text-text-dim hover:text-sev-critical-fg"><IconTrash size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* presets */}
      <div className="mb-2 text-[11px] uppercase tracking-[0.08em] text-text-dim">Quick presets</div>
      <div className="mb-6 grid grid-cols-2 gap-[10px] sm:grid-cols-4">
        {PRESETS.map((p) => {
          const selected = form.baseUrl === p.baseUrl;
          return (
            <button
              key={p.name}
              onClick={() => applyPreset(p)}
              className={`rounded-[13px] border p-[15px] text-left ${selected ? 'border-brand/40 bg-brand/[0.12]' : 'border-white/[0.1] bg-white/[0.025] hover:border-white/20'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold">{p.name}</span>
                {selected && <span className="h-2 w-2 rounded-full bg-brand" style={{ boxShadow: '0 0 8px #a78bfa' }} />}
              </div>
              <div className="mt-[6px] truncate font-mono text-[11px] text-text-dim">{p.baseUrl.replace('https://', '').replace('http://', '')}</div>
            </button>
          );
        })}
      </div>

      {/* form */}
      <form onSubmit={save} className="card flex flex-col gap-5 p-6">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-text-muted">{form.id ? 'Editing provider' : 'New provider'}</span>
          {form.id && <button type="button" onClick={newProvider} className="flex items-center gap-1 text-[13px] text-brand hover:underline"><IconPlus size={14} /> Add another</button>}
        </div>

        <div>
          <label className="label">Display name</label>
          <input className="field" placeholder="OpenAI" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="label">Base URL</label>
          <input className="field font-mono text-[13.5px]" placeholder="https://api.openai.com/v1" value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} required />
        </div>
        <div>
          <label className="label">API Key</label>
          <div className="relative">
            <input
              className="field pr-11 font-mono text-[13.5px]"
              type={showKey ? 'text' : 'password'}
              placeholder={form.id ? 'Leave blank to keep current key' : 'sk-…  (leave blank for local servers)'}
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
            />
            <button type="button" onClick={() => setShowKey((s) => !s)} className="absolute right-[14px] top-1/2 -translate-y-1/2 text-text-dim hover:text-text"><IconEye size={17} /></button>
          </div>
          <p className="mt-2 text-[12.5px] text-text-dim">Stored encrypted (AES-256-GCM). Calls go from the backend directly to your provider.</p>
        </div>
        <div>
          <label className="label">Model name</label>
          <input className="field font-mono text-[13.5px]" placeholder="gpt-4o" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-[13.5px] text-text-muted">
          <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="accent-[#7c3aed]" />
          Use as default provider for reviews and chat
        </label>

        {error && <p className="m-0 text-[13px] text-sev-critical-fg">{error}</p>}

        <div className="flex flex-wrap items-center gap-[10px] pt-1">
          <button type="submit" disabled={saving} className="btn-primary px-5 py-[11px] text-sm">{saving ? 'Saving…' : 'Save changes'}</button>
          <button type="button" onClick={testConnection} disabled={testing} className="btn-ghost px-[18px] py-[11px] text-sm">{testing ? 'Testing…' : 'Test connection'}</button>
          {test && (
            <span className="ml-auto inline-flex items-center gap-[7px] text-[13px]" style={{ color: test.ok ? '#6ee7b7' : '#fb8c98' }}>
              <span className="h-2 w-2 rounded-full" style={{ background: test.ok ? '#34d399' : '#fb5b6b', boxShadow: `0 0 8px ${test.ok ? '#34d399' : '#fb5b6b'}` }} />
              {test.ok ? `Connected — ${test.message}` : test.message}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
