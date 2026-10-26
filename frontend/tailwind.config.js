/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hg: {
          slate: {
            950: '#070C18',
            900: '#0B132B',
            850: '#111D3E',
            800: '#1C2541',
            700: '#3A506B',
            600: '#475569',
            500: '#64748B',
            400: '#94A3B8',
            200: '#E2E8F0',
            100: '#F1F5F9',
            50: '#F8FAFC'
          },
          primary: {
            DEFAULT: '#1D4ED8',
            hover: '#1E40AF',
            light: '#DBEAFE'
          },
          alert: {
            red: '#DC2626',
            redLight: '#FEE2E2',
            amber: '#D97706',
            amberLight: '#FEF3C7',
            emerald: '#059669',
            emeraldLight: '#D1FAE5'
          }
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      }
    },
  },
  plugins: [],
}
