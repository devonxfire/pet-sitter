/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
      },
      colors: {
        primary: '#60A5FA', // Soft Sky (new primary)
        accent: '#60A5FA',
        'accent-2': '#F59E0B',
        bg: '#FFFFFF',
        surface: '#F8F5F2',
        'muted-surface': '#F1F2F4',
        'text-primary': '#0F172A',
        'text-secondary': '#6B7280',
        border: '#E6E9EC',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
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
