/** The Sift mark — six dots converging into a funnel, echoing "sifting". */
export function SiftMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#a78bfa" aria-hidden>
      <circle cx="4" cy="6" r="1.4" />
      <circle cx="12" cy="6" r="1.4" />
      <circle cx="20" cy="6" r="1.4" />
      <circle cx="8" cy="12" r="1.4" />
      <circle cx="16" cy="12" r="1.4" />
      <circle cx="12" cy="18" r="1.4" fill="#7c3aed" />
    </svg>
  );
}

export function Logo({ size = 19 }: { size?: number }) {
  return (
    <div
      className="flex items-center gap-[11px] font-display font-bold tracking-[-0.03em]"
      style={{ fontSize: size }}
    >
      <span className="grid h-[30px] w-[30px] place-items-center rounded-[7px] border border-brand/45 bg-[#0d0a17]">
        <SiftMark size={20} />
      </span>
      Sift
    </div>
  );
}
