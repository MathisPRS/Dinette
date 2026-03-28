/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: 'var(--brand-50)',
          100: 'var(--brand-100)',
          200: 'var(--brand-200)',
          300: 'var(--brand-300)',
          400: 'var(--brand-400)',
          500: 'var(--brand-500)',
          600: 'var(--brand-600)',
          700: 'var(--brand-700)',
          800: 'var(--brand-800)',
          900: 'var(--brand-900)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      screens: {
        xs: '375px',
      },
      keyframes: {
        'card-leave': {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(16px) scale(0.95)' },
        },
      },
      animation: {
        'card-leave': 'card-leave 0.35s ease-in forwards',
      },
    },
  },
  plugins: [],
};
