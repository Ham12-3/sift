/** Small stroke-icon set used across the app, matching the mockup's line style. */
type IconProps = { size?: number; className?: string };

function base(size = 18, className?: string) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
  };
}

export const IconDashboard = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M3 3h7v7H3z" />
    <path d="M14 3h7v7h-7z" />
    <path d="M14 14h7v7h-7z" />
    <path d="M3 14h7v7H3z" />
  </svg>
);

export const IconExplorer = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M3 7l2-2h4l2 2h8a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V7z" />
  </svg>
);

export const IconShield = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M12 3l8 3v5c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V6z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

export const IconHistory = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const IconChat = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M21 15a2 2 0 01-2 2H8l-4 4V5a2 2 0 012-2h13a2 2 0 012 2z" />
  </svg>
);

export const IconSettings = ({ size, className }: IconProps) => (
  <svg {...base(size, className)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 13a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-2.9 1.2V21a2 2 0 11-4 0v-.1A1.7 1.7 0 006.8 19l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00-1.2-2.9H3a2 2 0 110-4h.1A1.7 1.7 0 005 6.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H10a1.7 1.7 0 001-1.6V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.6 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V10a1.7 1.7 0 001.6 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
  </svg>
);

export const IconPlus = ({ size, className }: IconProps) => (
  <svg {...base(size, className)} strokeWidth={2}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconArrowRight = ({ size, className }: IconProps) => (
  <svg {...base(size, className)} strokeWidth={1.9}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const IconChevronRight = ({ size, className }: IconProps) => (
  <svg {...base(size, className)} strokeWidth={1.8}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const IconChevronDown = ({ size, className }: IconProps) => (
  <svg {...base(size, className)} strokeWidth={1.8}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const IconFile = ({ size, className }: IconProps) => (
  <svg {...base(size, className)} strokeWidth={1.5}>
    <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
    <path d="M13 2v7h7" />
  </svg>
);

export const IconFolder = ({ size, className }: IconProps) => (
  <svg {...base(size, className)} strokeWidth={1.5}>
    <path d="M3 7l2-2h4l2 2h8a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V7z" />
  </svg>
);

export const IconUpload = ({ size, className }: IconProps) => (
  <svg {...base(size, className)} strokeWidth={1.8}>
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <path d="M7 10l5 5 5-5M12 15V3" />
  </svg>
);

export const IconSearch = ({ size, className }: IconProps) => (
  <svg {...base(size, className)} strokeWidth={1.8}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4-4" />
  </svg>
);

export const IconTrash = ({ size, className }: IconProps) => (
  <svg {...base(size, className)} strokeWidth={1.8}>
    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

export const IconGithub = ({ size = 18, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M12 2a10 10 0 00-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.6 0 0 .8-.3 2.7 1a9.4 9.4 0 015 0c1.9-1.3 2.7-1 2.7-1 .5 1.3.2 2.3.1 2.6.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .3.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0012 2z" />
  </svg>
);

export const IconEye = ({ size, className }: IconProps) => (
  <svg {...base(size, className)} strokeWidth={1.7}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const IconLogout = ({ size, className }: IconProps) => (
  <svg {...base(size, className)} strokeWidth={1.8}>
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </svg>
);
