/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // LNMIIT Institutional Palette (Medium Persian Blue + Spanish Orange + Clean Campus Whites)
        lnmiit: {
          blue: {
            DEFAULT: '#0067A5',
            dark: '#004C7A',
            deep: '#003353',
            light: '#E6F0F8',
            border: '#B3D4EA',
          },
          orange: {
            DEFAULT: '#E86100',
            dark: '#C75300',
            light: '#FFF2E6',
          },
          slate: {
            50: '#F8FAFC',
            100: '#F1F5F9',
            200: '#E2E8F0',
            300: '#CBD5E1',
            600: '#475569',
            700: '#334155',
            800: '#1E293B',
            900: '#0F172A',
          }
        },
        base: {
          DEFAULT: '#F4F7FB',
          surface: '#FFFFFF',
          overlay: '#FFFFFF',
          muted: '#F1F5F9',
          border: '#E2E8F0',
        },
        accent: {
          DEFAULT: '#0067A5',
          hover: '#004C7A',
          subtle: '#E6F0F8',
          muted: '#F0F7FC',
        },
        link: {
          DEFAULT: '#0067A5',
          hover: '#004C7A',
        },
        status: {
          green: '#16A34A',
          greenBg: '#DCFCE7',
          greenBorder: '#86EFAC',
          red: '#DC2626',
          redBg: '#FEE2E2',
          redBorder: '#FCA5A5',
          amber: '#D97706',
          amberBg: '#FEF3C7',
          amberBorder: '#FCD34D',
          gray: '#475569',
          grayBg: '#F1F5F9',
          grayBorder: '#CBD5E1',
        },
        // Backward compatibility tokens
        hg: {
          slate: {
            950: '#F4F7FB',
            900: '#FFFFFF',
            850: '#F8FAFC',
            800: '#E2E8F0',
            700: '#CBD5E1',
            600: '#64748B',
            500: '#475569',
            400: '#334155',
            200: '#1E293B',
            100: '#0F172A',
            50: '#020617',
          },
          primary: {
            DEFAULT: '#0067A5',
            hover: '#004C7A',
            light: '#E6F0F8',
          },
          alert: {
            red: '#DC2626',
            redLight: '#FEE2E2',
            amber: '#D97706',
            amberLight: '#FEF3C7',
            emerald: '#16A34A',
            emeraldLight: '#DCFCE7',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.05em' }],
      },
      borderRadius: {
        DEFAULT: '6px',
      },
      boxShadow: {
        erp: '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'erp-card': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'erp-dropdown': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'led-blink': {
          '0%, 90%, 100%': { opacity: '1' },
          '95%': { opacity: '0.3' },
        },
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.2s ease-out',
        'led-blink': 'led-blink 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
