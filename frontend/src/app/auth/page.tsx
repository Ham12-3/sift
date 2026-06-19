'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SiftMark } from '@/components/Logo';
import { IconGithub } from '@/components/icons';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';

type Mode = 'login' | 'register';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ?? 'http://localhost:4000/api';

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated, skip the form.
  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  // Surface errors handed back by the GitHub OAuth redirect.
  useEffect(() => {
    const err = params.get('error');
    if (err === 'github_not_configured') {
      setError('GitHub sign-in isn’t configured yet. Add OAuth credentials to the backend .env (see README), or use email & password.');
    } else if (err === 'github_failed') {
      setError('GitHub sign-in failed. Please try again or use email & password.');
    }
  }, [params]);

  const isRegister = mode === 'register';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isRegister) await register(name, email, password);
      else await login(email, password);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const tabClass = (active: boolean) =>
    `flex-1 rounded-[9px] py-[9px] text-sm font-semibold border ${
      active
        ? 'border-brand/34 bg-brand/[0.18] text-[#e9e4fb]'
        : 'border-transparent bg-transparent text-text/70'
    }`;

  return (
    <div className="flex min-h-screen items-center justify-center px-5 pb-[90px] pt-8">
      <div className="w-full max-w-[420px]">
        <Link href="/" className="mb-7 flex items-center justify-center gap-[11px] font-display text-[21px] font-bold tracking-[-0.03em]">
          <span className="grid h-8 w-8 place-items-center rounded-[7px] border border-brand/45 bg-[#0d0a17]"><SiftMark size={21} /></span>
          Sift
        </Link>

        <div className="relative rounded-[20px] border border-white/10 p-[30px_28px]" style={{ background: 'linear-gradient(180deg,rgba(24,20,38,.85),rgba(14,11,24,.9))', backdropFilter: 'blur(20px)', boxShadow: '0 30px 90px rgba(76,29,149,.4)' }}>
          <div className="pointer-events-none absolute left-1/2 top-[-30%] h-[160px] w-[80%] -translate-x-1/2" style={{ background: 'radial-gradient(closest-side,rgba(139,92,246,.4),transparent 70%)', filter: 'blur(34px)' }} />
          <div className="relative">
            <div className="mb-6 flex gap-[6px] rounded-[12px] border border-white/[0.07] bg-white/[0.04] p-[5px]">
              <button type="button" onClick={() => setMode('login')} className={tabClass(!isRegister)}>Sign in</button>
              <button type="button" onClick={() => setMode('register')} className={tabClass(isRegister)}>Register</button>
            </div>

            <h1 className="m-0 text-[23px] font-semibold tracking-[-0.02em]">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
            <p className="mb-[22px] mt-[7px] text-sm text-text-muted">
              {isRegister ? 'Start reviewing your codebase in seconds.' : 'Sign in to continue reviewing your code.'}
            </p>

            <a
              href={`${API_URL}/auth/github`}
              className="mb-[18px] flex w-full items-center justify-center gap-[10px] rounded-[11px] border border-white/[0.14] bg-white/[0.04] py-[11px] text-sm font-medium text-[#e7e3f3] hover:bg-white/[0.07]"
            >
              <IconGithub size={17} /> Continue with GitHub
            </a>

            <div className="mb-[18px] flex items-center gap-3 text-xs text-[#76728c]">
              <span className="h-px flex-1 bg-white/[0.08]" />or<span className="h-px flex-1 bg-white/[0.08]" />
            </div>

            <form onSubmit={onSubmit}>
              {isRegister && (
                <>
                  <label className="label">Full name</label>
                  <input className="field mb-4" type="text" placeholder="Ada Lovelace" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
                </>
              )}
              <label className="label">Email</label>
              <input className="field mb-4" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <label className="label">Password</label>
              <input className="field mb-2" type="password" placeholder="••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />

              {error && <p className="mb-3 mt-2 text-[13px] text-sev-critical-fg">{error}</p>}

              <button type="submit" disabled={submitting} className="mt-3 w-full rounded-[11px] py-[13px] text-[14.5px] font-semibold text-white" style={{ background: 'linear-gradient(180deg,#9b6cf8,#7c3aed)', boxShadow: '0 10px 28px rgba(124,58,237,.45),inset 0 1px 0 rgba(255,255,255,.25)', opacity: submitting ? 0.6 : 1 }}>
                {submitting ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>

        <p className="mt-[18px] text-center text-[13px] text-[#76728c]">
          {isRegister ? 'Already have an account? Switch to Sign in above.' : 'New to Sift? Switch to Register above.'}
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center"><div className="h-8 w-8 animate-spin2 rounded-full border-2 border-white/15 border-t-brand" /></div>}>
      <AuthForm />
    </Suspense>
  );
}
