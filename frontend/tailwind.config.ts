import type { Config } from "tailwindcss"

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          900: '#0F172A',
        },

        surface: '#F8FAFC',
        muted:   '#64748B',

        status: {
          // Primary colors
          pending:   '#D97706',
          review:    '#7C3AED',
          approved:  '#16A34A',
          completed: '#0D9488',
          rejected:  '#DC2626',

          // Light background variants
          'pending-bg':   '#FFFBEB',
          'review-bg':    '#F0E7FF',
          'approved-bg':  '#DCFCE7',
          'completed-bg': '#CCFBF1',
          'rejected-bg':  '#FEE2E2',
        },

        neutral: {
          50:  '#F9FAFB',
          200: '#E5E7EB',
          700: '#374151',
          900: '#111827',
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config