import type { Config } from 'tailwindcss';

/**
 * Design tokens lifted directly from Sift.dc.html so Tailwind utilities map to
 * the mockup's exact palette, fonts, and radii.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#08060f', // page background
        panel: '#0d0a18', // raised surfaces (code, cards)
        'panel-2': '#15111f',
        text: {
          DEFAULT: '#ece9f5',
          bright: '#f4f2fb',
          muted: '#9692ad',
          dim: '#76728c',
          faint: '#5c5874',
        },
        brand: {
          DEFAULT: '#a78bfa',
          400: '#9b6cf8',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          soft: '#c4b5fd',
        },
        sev: {
          critical: '#fb5b6b',
          'critical-fg': '#fb8c98',
          high: '#fb923c',
          'high-fg': '#fbb072',
          medium: '#fbbf24',
          'medium-fg': '#fcd34d',
          low: '#60a5fa',
          'low-fg': '#93c5fd',
        },
        ok: '#34d399',
        'ok-fg': '#6ee7b7',
      },
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        display: ['Bricolage Grotesque', 'Geist', 'sans-serif'],
      },
      borderRadius: {
        xl2: '16px',
      },
      keyframes: {
        siftPulse: {
          '0%,100%': { opacity: '.35' },
          '50%': { opacity: '1' },
        },
        siftRise: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        siftSpin: { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        pulse2: 'siftPulse 1.4s ease-in-out infinite',
        rise: 'siftRise .4s ease both',
        spin2: 'siftSpin .8s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
