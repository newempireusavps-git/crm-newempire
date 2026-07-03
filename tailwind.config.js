/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        empire: {
          dark: '#0d0d1a',
          navy: '#1a1a2e',
          gold: '#FFD700',
          'gold-dim': '#B8960C',
          card: '#16213e',
          border: '#2a2a4a',
          muted: '#6b7280',
        },
      },
    },
  },
  plugins: [],
}

