import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './types/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'IBM Plex Mono', 'Menlo', 'monospace'],
      },
      colors: {
        ink: {
          50:  '#e8f0f8',
          100: '#c0d4e4',
          200: '#8fafc8',
          300: '#6a8ba8',
          400: '#4a6a88',
          500: '#2d4a62',
          600: '#1e3248',
          700: '#0e2030',
          800: '#070d18',
          900: '#040911',
        },
        signal: {
          green:  '#34d399',
          yellow: '#fbbf24',
          red:    '#f87171',
          blue:   '#4f8ef7',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(-4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
