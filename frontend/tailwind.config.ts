import type { Config } from "tailwindcss"


/** @type {import('tailwindcss').Config} */
export default {
  // content: paths to all files that use Tailwind classes.
  // Tailwind scans these at build time and tree-shakes unsused classes,
  // resulting in a minimal CSS output file.
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Custom color palette - uses these tokens through the app
      // instead of hardcoded hex values (consistency).
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        surface: '#f8fafc',
        muted: '#64748b',
      },
      fontFamily: {
        // font stack used across the entire app
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config

