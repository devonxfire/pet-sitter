/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
        display: ['Nohemi', 'Poppins', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
      },
      colors: {
        primary: '#c3001f', // Brand primary is now the darker hover red
        accent: '#c3001f',
        'accent-2': '#ed0025', // previous primary becomes accent-2 (used for highlights/hover)
        bg: '#FFFFFF',
        surface: '#F5F6F7', // light neutral surface
        'muted-surface': '#F3F4F6',
        'text-primary': '#0B1220', // near-black, warm
        'text-secondary': '#6B7280',
        border: '#E6E9EC',
        success: '#16A34A',
        warning: '#D97706',
        danger: '#EF4444',
      },
      backgroundImage: {
        'accent-gradient': "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))",
      },
      boxShadow: {
        'elevated': '0 10px 30px rgba(11,18,32,0.10), 0 3px 8px rgba(11,18,32,0.04)'
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem'
      },
      spacing: {
        32: '8rem',
      },
    },
  },
  safelist: [
    'mb-32',
    'mb-48',
    'mb-64',
    'pt-48',
    'pb-48',
  ],
  plugins: [],
}
