/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: '#0A0A0B',
          surface: '#111115',
          overlay: '#17171C',
          muted: '#252529',
          border: 'rgba(255,255,255,0.07)',
        },
        accent: {
          DEFAULT: '#E8531D',
          hover: '#D44419',
          subtle: 'rgba(232,83,29,0.12)',
          muted: 'rgba(232,83,29,0.06)',
        },
        link: {
          DEFAULT: '#3D7EFF',
          hover: '#5990FF',
        },
        status: {
          green: '#22C55E',
          greenBg: 'rgba(34,197,94,0.1)',
          greenBorder: 'rgba(34,197,94,0.25)',
          red: '#EF4444',
          redBg: 'rgba(239,68,68,0.1)',
          redBorder: 'rgba(239,68,68,0.25)',
          amber: '#F59E0B',
          amberBg: 'rgba(245,158,11,0.1)',
          amberBorder: 'rgba(245,158,11,0.25)',
          gray: '#6B7280',
          grayBg: 'rgba(107,114,128,0.1)',
          grayBorder: 'rgba(107,114,128,0.2)',
        },
        // Legacy hg tokens for backward compatibility
        hg: {
          slate: {
            950: '#0A0A0B',
            900: '#111115',
            850: '#17171C',
            800: '#252529',
            700: '#3A3A40',
            600: '#52525A',
            500: '#71717A',
            400: '#A1A1AA',
            200: '#E4E4E7',
            100: '#F4F4F5',
            50: '#FAFAFA',
          },
          primary: {
            DEFAULT: '#E8531D',
            hover: '#D44419',
            light: 'rgba(232,83,29,0.1)',
          },
          alert: {
            red: '#EF4444',
            redLight: 'rgba(239,68,68,0.1)',
            amber: '#F59E0B',
            amberLight: 'rgba(245,158,11,0.1)',
            emerald: '#22C55E',
            emeraldLight: 'rgba(34,197,94,0.1)',
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
