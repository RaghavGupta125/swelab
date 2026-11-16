/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Modern Clean Canvas (GitHub / Vercel Light)
        base: {
          DEFAULT: '#FAFAFA',
          surface: '#FFFFFF',
          overlay: '#FFFFFF',
          muted: '#F4F4F5',
          border: '#E4E4E7',
        },
        accent: {
          DEFAULT: '#18181B',
          hover: '#27272A',
          subtle: '#F4F4F5',
          muted: '#FAFAFA',
        },
        link: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
        },
        status: {
          green: '#16A34A',
          greenBg: '#F0FDF4',
          greenBorder: '#BBF7D0',
          red: '#DC2626',
          redBg: '#FEF2F2',
          redBorder: '#FECACA',
          amber: '#D97706',
          amberBg: '#FFFBEB',
          amberBorder: '#FDE68A',
          gray: '#71717A',
          grayBg: '#F4F4F5',
          grayBorder: '#E4E4E7',
          blue: '#2563EB',
          blueBg: '#EFF6FF',
          blueBorder: '#BFDBFE',
        },
        // Legacy hg tokens mapped to clean modern light palette
        hg: {
          slate: {
            950: '#FAFAFA',
            900: '#FFFFFF',
            850: '#F4F4F5',
            800: '#E4E4E7',
            700: '#D4D4D8',
            600: '#A1A1AA',
            500: '#71717A',
            400: '#52525B',
            200: '#27272A',
            100: '#18181B',
            50: '#09090B',
          },
          primary: {
            DEFAULT: '#18181B',
            hover: '#27272A',
            light: '#F4F4F5',
          },
          alert: {
            red: '#DC2626',
            redLight: '#FEF2F2',
            amber: '#D97706',
            amberLight: '#FFFBEB',
            emerald: '#16A34A',
            emeraldLight: '#F0FDF4',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.04em' }],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        card: '0 2px 4px 0 rgba(0, 0, 0, 0.03), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        popover: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
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
