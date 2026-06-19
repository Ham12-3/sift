'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setToken } from '@/lib/api';
import { SiftMark } from '@/components/Logo';

/**
 * Landing point for the GitHub OAuth redirect. The backend appends the freshly
 * minted JWT as ?token=…; we persist it and do a full navigation to /dashboard
 * so the AuthProvider re-initializes and loads the user via /auth/me.
 */
function CallbackInner() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      setToken(token);
      window.location.href = '/dashboard';
    } else {
      router.replace('/auth?error=github_failed');
    }
  }, [params, router]);

  return (
    <div className="grid min-h-screen place-items-center">
      <div className="flex flex-col items-center gap-4">
        <span className="grid h-12 w-12 place-items-center rounded-[10px] border border-brand/45 bg-[#0d0a17]">
          <SiftMark size={28} />
        </span>
        <p className="text-sm text-text-muted">Signing you in…</p>
      </div>
    </div>
  );
}

export default function GithubCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackInner />
    </Suspense>
  );
}
