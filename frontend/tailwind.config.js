/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#312e81',
        },
        surface: {
          950: '#080d18',
          900: '#0b1120',
          800: '#111827',
          700: '#1f2937',
        },
      },
      boxShadow: {
        glow: '0 24px 80px rgba(99, 102, 241, 0.14)',
      },
      backgroundImage: {
        'slate-radial': 'radial-gradient(circle at top left, rgba(99, 102, 241, 0.10), transparent 22%), radial-gradient(circle at 80% 6%, rgba(129, 140, 248, 0.08), transparent 20%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-soft': 'glowSoft 2.5s ease-in-out infinite alternate',
      },
      keyframes: {
        glowSoft: {
          '0%': { boxShadow: '0 0 18px rgba(79, 70, 229, 0.16)' },
          '100%': { boxShadow: '0 0 32px rgba(79, 70, 229, 0.08)' },
        },
      },
    },
  },
  plugins: [],
}
