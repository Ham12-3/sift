'use client';

import Link from 'next/link';
import { Logo, SiftMark } from '@/components/Logo';
import { IconArrowRight, IconExplorer, IconShield, IconChat, IconUpload } from '@/components/icons';

export default function LandingPage() {
  return (
    <div>
      {/* nav */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] backdrop-blur-xl" style={{ background: 'rgba(8,6,15,.72)' }}>
        <nav className="mx-auto flex max-w-[1180px] items-center gap-6 px-7 py-[15px]">
          <Logo />
          <div className="ml-[22px] hidden flex-1 gap-[26px] text-[13.5px] text-text-muted md:flex">
            <a href="#features" className="hover:text-text">Features</a>
            <a href="#modes" className="hover:text-text">Review modes</a>
            <a href="#pricing" className="hover:text-text">Pricing</a>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/auth" className="px-[6px] py-2 text-[13.5px] font-medium text-text/80">Sign in</Link>
            <Link href="/auth" className="rounded-lg bg-[#e9e4fb] px-4 py-[9px] text-[13.5px] font-semibold text-[#0c0a14]">Get started</Link>
          </div>
        </nav>
      </header>

      {/* hero */}
      <section className="mx-auto max-w-[1180px] px-7 pb-[92px] pt-20">
        <div className="grid items-center gap-[52px] lg:grid-cols-2">
          <div className="min-w-0">
            <div className="mb-[26px] flex items-center gap-3 font-mono text-xs uppercase tracking-[0.14em] text-[#8f7bd6]">
              <span className="h-px w-[26px] bg-brand" />
              AI code review
            </div>
            <h1 className="m-0 font-display text-[clamp(44px,5.7vw,74px)] font-extrabold leading-[0.96] tracking-[-0.04em] text-[#f4f2fb]">
              Find the flaw<br />
              <span className="text-brand">humans miss.</span>
            </h1>
            <p className="mt-7 max-w-[46ch] text-[17px] leading-[1.62] text-[#9d98b3]">
              Sift reviews every file with full-repository context — flagging security holes, performance traps, and quality smells, each with a concrete fix, in seconds.
            </p>
            <div className="mt-[34px] flex flex-wrap gap-3">
              <Link href="/auth" className="rounded-[10px] bg-[#ece9f5] px-6 py-[14px] text-[15px] font-semibold text-[#0c0a14]">Start reviewing free</Link>
              <Link href="/auth" className="btn-ghost px-[22px] py-[14px] text-[15px] font-medium">
                See a live review <IconArrowRight size={16} />
              </Link>
            </div>
            <div className="mt-[42px] flex items-center gap-[18px] font-mono text-[11px] tracking-[0.12em] text-[#6f6b85]">
              <span>TRUSTED&nbsp;BY</span>
              <span className="flex flex-wrap items-center gap-5 font-sans text-[13.5px] font-semibold tracking-normal text-[#9a96ad]">
                <span>Northwind</span><span>Apex Labs</span><span>Vela</span><span>Orbital</span>
              </span>
            </div>
          </div>

          {/* signature graphic — AI annotating a diff */}
          <div className="relative min-w-0">
            <div className="absolute right-[-4%] top-[6%] z-0 h-[72%] w-[78%]" style={{ background: 'radial-gradient(closest-side,rgba(124,58,237,.5),transparent 72%)', filter: 'blur(54px)' }} />
            <div className="relative z-[2] overflow-hidden rounded-[14px] border border-white/10 bg-[#0d0a18]" style={{ boxShadow: '0 30px 80px rgba(0,0,0,.55)' }}>
              <div className="flex items-center gap-2 border-b border-white/[0.07] px-[15px] py-3 font-mono text-xs text-[#7c7892]">
                <span className="h-[9px] w-[9px] rounded-full bg-[#2a2740]" />
                <span className="h-[9px] w-[9px] rounded-full bg-[#2a2740]" />
                <span className="h-[9px] w-[9px] rounded-full bg-[#2a2740]" />
                <span className="ml-2">src/auth.ts</span>
                <span className="ml-auto inline-flex items-center gap-[6px] text-brand">
                  <span className="h-[6px] w-[6px] animate-pulse2 rounded-full bg-brand" />reviewing
                </span>
              </div>
              <div className="flex font-mono text-[12.5px] leading-[1.85]">
                <div className="flex-none py-[14px] text-right text-[#48455c]">
                  {[38, 39, 40, 41, 42, 43, 44].map((n) => (
                    <div key={n} className="px-3" style={{ color: n === 41 ? '#fb5b6b' : n === 42 ? '#5fd08a' : undefined }}>{n}</div>
                  ))}
                </div>
                <div className="flex min-w-0 flex-col overflow-x-auto p-[14px_16px] text-[#cbc7da]">
                  <div className="whitespace-pre"><span className="text-[#6b6786]">{'// issue token'}</span></div>
                  <div className="whitespace-pre"><span className="text-[#c792ea]">export function</span> <span className="text-[#82aaff]">issueToken</span>(u) {'{'}</div>
                  <div className="whitespace-pre">  <span className="text-[#c792ea]">const</span> p = {'{'} sub: u.id {'}'};</div>
                  <div className="whitespace-pre" style={{ background: 'rgba(244,63,94,.13)', margin: '0 -16px', padding: '0 16px', borderLeft: '2px solid #fb5b6b' }}><span className="text-[#fb5b6b]">-</span> <span className="text-[#c792ea]">const</span> secret = <span className="text-[#c3e88d]">{"'s3cr3t-dev'"}</span>;</div>
                  <div className="whitespace-pre" style={{ background: 'rgba(52,211,153,.12)', margin: '0 -16px', padding: '0 16px', borderLeft: '2px solid #34d399' }}><span className="text-[#34d399]">+</span> <span className="text-[#c792ea]">const</span> secret = process.env.<span className="text-[#82aaff]">JWT_SECRET</span>;</div>
                  <div className="whitespace-pre">  <span className="text-[#c792ea]">return</span> jwt.<span className="text-[#82aaff]">sign</span>(p, secret);</div>
                  <div className="whitespace-pre">{'}'}</div>
                </div>
              </div>
            </div>
            <div className="absolute bottom-[-28px] right-[-14px] z-[3] w-[286px] max-w-[84%] rounded-[12px] border border-brand/40 bg-[#15111f]" style={{ boxShadow: '0 22px 54px rgba(0,0,0,.62)' }}>
              <div className="flex items-center gap-[9px] px-[15px] pb-2 pt-[13px]">
                <span className="grid h-[22px] w-[22px] place-items-center rounded-[6px] border border-brand/45 bg-[#0d0a17]"><SiftMark size={14} /></span>
                <span className="font-mono text-[10.5px] font-semibold tracking-[0.06em] text-[#fb8c98]">CRITICAL · LINE 41</span>
              </div>
              <p className="m-0 px-[15px] pb-[14px] text-[13px] leading-[1.5] text-[#c2bdd2]">Hardcoded signing secret. Anyone with repo access can forge tokens — move it to an env var.</p>
            </div>
          </div>
        </div>
      </section>

      {/* feature bento */}
      <section id="features" className="mx-auto max-w-[1180px] px-7 pb-[30px] pt-16">
        <div className="mb-[34px] flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="eyebrow mb-[14px] text-[#8f7bd6]">The platform</div>
            <h2 className="m-0 max-w-[18ch] font-display text-[clamp(28px,3.6vw,42px)] font-bold leading-[1.05] tracking-[-0.03em] text-[#f1eef9]">One surface, from upload to fix.</h2>
          </div>
          <p className="m-0 max-w-[32ch] text-[14.5px] leading-[1.6] text-text-muted">No plugins to wire up, no dashboards to stitch together. Point Sift at a repo and work the whole loop in one place.</p>
        </div>
        <div className="flex flex-wrap items-stretch gap-[14px]">
          <div className="grid min-w-0 flex-[2_1_440px] items-center gap-7 card p-[30px] sm:grid-cols-2">
            <div>
              <div className="mb-4 flex items-center gap-[11px]">
                <IconShield className="text-brand" size={22} />
                <span className="font-mono text-[11px] tracking-[0.1em] text-[#6f6b85]">CORE</span>
              </div>
              <div className="font-display text-2xl font-bold tracking-[-0.02em] text-[#f1eef9]">AI Review Engine</div>
              <p className="mt-[10px] max-w-[40ch] text-[14.5px] leading-[1.6] text-[#9d98b3]">Multi-pass analysis reads code in context, ranks every finding by severity, and writes the fix — not just the complaint.</p>
            </div>
            <div className="flex flex-col gap-[9px] rounded-[11px] border border-white/[0.07] bg-[#0c0916] p-[14px]">
              {[
                ['auth.ts · hardcoded secret', 'CRIT', '#fb5b6b', '#fb8c98'],
                ['users.ts · SQL injection', 'HIGH', '#fb923c', '#fbb072'],
                ['cache.ts · unawaited write', 'MED', '#5a566e', '#8b8799'],
              ].map(([t, tag, bar, fg], i) => (
                <div key={t} className="flex items-center gap-[10px]" style={{ opacity: i === 2 ? 0.6 : 1 }}>
                  <span className="h-[22px] w-[3px] rounded-[2px]" style={{ background: bar }} />
                  <span className="flex-1 font-mono text-[11.5px] text-[#b8b3c9]">{t}</span>
                  <span className="font-mono text-[10px]" style={{ color: fg }}>{tag}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex min-w-0 flex-[1_1_230px] flex-col gap-[14px]">
            <div className="card min-w-0 flex-1 p-6">
              <IconUpload className="mb-[14px] text-brand" size={20} />
              <div className="text-[16.5px] font-semibold tracking-[-0.01em]">Code Upload</div>
              <p className="mt-2 text-[13.5px] leading-[1.55] text-text-muted">ZIP, a GitHub URL, or a dragged folder. Indexed in seconds.</p>
            </div>
            <div className="card min-w-0 flex-1 p-6">
              <IconExplorer className="mb-[14px] text-brand" size={20} />
              <div className="text-[16.5px] font-semibold tracking-[-0.01em]">Code Explorer</div>
              <p className="mt-2 text-[13.5px] leading-[1.55] text-text-muted">A fast tree and syntax-aware previews with inline findings.</p>
            </div>
          </div>

          <div className="card flex flex-[1_1_100%] flex-wrap items-center gap-6 p-[24px_28px]">
            <div className="min-w-[240px] flex-1">
              <IconChat className="mb-[14px] text-brand" size={20} />
              <div className="text-[16.5px] font-semibold tracking-[-0.01em]">Chat with Code</div>
              <p className="mt-2 max-w-[52ch] text-[13.5px] leading-[1.55] text-text-muted">Ask in plain English. Sift answers with the loaded files as live context and cites the exact lines.</p>
            </div>
            <div className="flex flex-none flex-col gap-2 font-mono text-xs">
              <span className="self-end rounded-[10px_10px_3px_10px] border border-brand/30 bg-brand/[0.16] px-3 py-[7px] text-[#d6ccfb]">where&apos;s the secret defined?</span>
              <span className="self-start rounded-[10px_10px_10px_3px] border border-white/[0.08] bg-white/[0.04] px-3 py-[7px] text-[#b8b3c9]">src/auth.ts:41</span>
            </div>
          </div>
        </div>
      </section>

      {/* stats */}
      <section className="mx-auto my-[46px] max-w-[1180px] px-7">
        <div className="grid border-y border-white/[0.09] sm:grid-cols-3">
          {[['10M+', 'Lines analyzed'], ['94%', 'Bugs caught pre-merge'], ['8×', 'Faster review cycles']].map(([n, l], i) => (
            <div key={l} className={`px-7 py-8 ${i > 0 ? 'sm:border-l border-white/[0.09]' : ''}`}>
              <div className="font-display text-[clamp(38px,4.6vw,52px)] font-bold leading-none tracking-[-0.04em] text-[#f1eef9]">{n}</div>
              <div className="mt-2 font-mono text-[11.5px] uppercase tracking-[0.1em] text-[#7c7892]">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* review modes */}
      <section id="modes" className="mx-auto max-w-[1180px] px-7 pb-[30px] pt-16">
        <div className="flex flex-wrap items-start gap-[56px]">
          <div className="min-w-0 flex-[1_1_280px]">
            <div className="eyebrow mb-[14px] text-[#8f7bd6]">Review modes</div>
            <h2 className="m-0 font-display text-[clamp(28px,3.6vw,42px)] font-bold leading-[1.05] tracking-[-0.03em] text-[#f1eef9]">Point it at what<br />matters today.</h2>
            <p className="mt-[18px] max-w-[34ch] text-[14.5px] leading-[1.6] text-text-muted">Each mode is a different lens on the same codebase. Switch per review — or run them all.</p>
          </div>
          <div className="min-w-0 flex-[2_1_440px]">
            {[
              ['01', 'Security', 'Injection, auth flaws, secret leakage, and unsafe dependencies — ranked by exploitability.', ['OWASP Top 10', 'Secret scanning', 'CVE checks']],
              ['02', 'Performance', 'N+1 queries, blocking calls, memory churn, and hot-path allocations with measured impact.', ['Query hotspots', 'Async misuse', 'Bundle weight']],
              ['03', 'Code Quality', 'Readability, naming, duplication, and test-coverage gaps with concrete refactor suggestions.', ['Complexity', 'Duplication', 'Coverage gaps']],
            ].map(([num, title, desc, tags], i, arr) => (
              <div key={num as string} className={`flex items-baseline gap-5 border-t border-white/10 py-[22px] ${i === arr.length - 1 ? 'border-b' : ''}`}>
                <span className="w-[30px] flex-none font-display text-[18px] font-bold text-brand">{num}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[18px] font-semibold tracking-[-0.01em]">{title}</div>
                  <p className="mb-3 mt-[6px] text-[14px] leading-[1.55] text-text-muted">{desc}</p>
                  <div className="flex flex-wrap gap-2 font-mono text-[11px] text-[#9a96ad]">
                    {(tags as string[]).map((t) => (
                      <span key={t} className="rounded-[6px] border border-white/10 px-[9px] py-1">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* pricing */}
      <section id="pricing" className="mx-auto max-w-[1180px] px-7 pb-[30px] pt-[70px]">
        <div className="mb-[34px]">
          <div className="eyebrow mb-[14px] text-[#8f7bd6]">Pricing</div>
          <h2 className="m-0 font-display text-[clamp(28px,3.6vw,42px)] font-bold leading-[1.05] tracking-[-0.03em] text-[#f1eef9]">Start free, scale when you ship.</h2>
        </div>
        <div className="grid gap-[14px] md:grid-cols-3">
          {[
            { tier: 'Free', price: '$0', per: '/ month', blurb: 'For solo developers and side projects.', cta: 'Get started', feats: ['3 projects', '50 reviews / month', 'All review modes', 'Community support'], popular: false },
            { tier: 'Pro', price: '$29', per: '/ month', blurb: 'For teams shipping to production daily.', cta: 'Start Pro trial', feats: ['Unlimited projects', 'Unlimited reviews', 'Chat with code', 'GitHub & CI integration', 'Priority support'], popular: true },
            { tier: 'Enterprise', price: 'Custom', per: '', blurb: 'For organizations with compliance needs.', cta: 'Contact sales', feats: ['Self-hosted option', 'SSO & SAML', 'Bring your own model', 'Dedicated SLA'], popular: false },
          ].map((p) => (
            <div key={p.tier} className={`relative rounded-xl2 p-7 ${p.popular ? 'border border-brand/55 bg-brand/[0.06]' : 'card'}`}>
              {p.popular && <span className="absolute -top-[11px] left-7 rounded-[6px] bg-brand px-[10px] py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#0c0a14]">Most popular</span>}
              <div className={`font-mono text-xs uppercase tracking-[0.08em] ${p.popular ? 'text-brand-soft' : 'text-text-muted'}`}>{p.tier}</div>
              <div className="mb-1 mt-4 flex items-baseline gap-[6px]">
                <span className="font-display text-[46px] font-bold tracking-[-0.04em] text-[#f1eef9]">{p.price}</span>
                {p.per && <span className="text-[14px] text-[#7c7892]">{p.per}</span>}
              </div>
              <p className="mb-[22px] mt-0 text-[13.5px] text-text-muted">{p.blurb}</p>
              <Link href="/auth" className={`block w-full rounded-[10px] py-3 text-center text-[14px] font-semibold ${p.popular ? 'bg-brand text-[#0c0a14]' : 'border border-white/[0.16] text-[#e7e3f3]'}`}>{p.cta}</Link>
              <div className="mt-6 flex flex-col gap-[11px] text-[13.5px] text-[#aaa6bd]">
                {p.feats.map((f) => (
                  <span key={f} className="flex gap-[10px]"><span className={p.popular ? 'text-brand' : 'text-[#7c7892]'}>—</span> {f}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* final CTA */}
      <section className="mx-auto my-16 max-w-[1180px] px-7">
        <div className="relative flex flex-wrap items-center justify-between gap-8 overflow-hidden rounded-[20px] border border-brand/30 bg-[#0e0b1a] p-[54px_40px]">
          <div className="pointer-events-none absolute right-[-6%] top-[-60%] h-[240%] w-[48%]" style={{ background: 'radial-gradient(closest-side,rgba(124,58,237,.5),transparent 70%)', filter: 'blur(44px)' }} />
          <div className="relative min-w-0">
            <h2 className="m-0 max-w-[16ch] font-display text-[clamp(28px,4vw,44px)] font-bold leading-[1.04] tracking-[-0.03em] text-[#f4f2fb]">Your next review starts in seconds.</h2>
            <p className="mt-4 text-[15px] text-[#9d98b3]">No credit card. Point Sift at a repo and watch it work.</p>
          </div>
          <Link href="/auth" className="relative flex-none rounded-[11px] bg-[#ece9f5] px-7 py-[15px] text-[15px] font-semibold text-[#0c0a14]">Start reviewing free</Link>
        </div>
      </section>

      {/* footer */}
      <footer className="mt-[30px] border-t border-white/[0.07]">
        <div className="mx-auto grid max-w-[1180px] gap-[30px] px-7 py-[54px] sm:grid-cols-2 md:grid-cols-4">
          <div className="min-w-[200px]">
            <Logo size={18} />
            <p className="mt-[14px] max-w-[30ch] text-[13px] leading-[1.55] text-[#7c7892]">AI code review with full repository context.</p>
          </div>
          {[
            ['Product', ['Features', 'Review modes', 'Pricing', 'Changelog']],
            ['Resources', ['Docs', 'API reference', 'Guides', 'Status']],
            ['Company', ['About', 'Blog', 'Careers', 'Contact']],
          ].map(([title, links]) => (
            <div key={title as string}>
              <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.1em] text-[#6f6b85]">{title}</div>
              <div className="flex flex-col gap-[11px] text-[13.5px] text-[#9692ad]">
                {(links as string[]).map((l) => <a key={l} href="#" className="hover:text-text">{l}</a>)}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-white/[0.06] px-7 py-5 font-mono text-xs text-[#5c5874]">© 2026 Sift Labs, Inc.</div>
      </footer>
    </div>
  );
}
