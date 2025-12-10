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
        // Primary brand red palette (used for CTAs and highlights)
        primary: {
          // Use the darker hover-red as the main brand color for better contrast
          DEFAULT: '#C3001F', // main brand red (used as `bg-primary`)
          600: '#ED1C24',     // lighter / hover alternative
          700: '#9B0019',     // active / pressed
          400: '#FF4D56',     // lighter variant
        },

        // Accent kept aligned with primary for legacy `bg-accent` usage
        accent: {
          DEFAULT: '#ED1C24',
          600: '#C3001F'
        },

        // Neutral grays (light and dark) — used for backgrounds, surfaces, and footers
        gray: {
          50: '#FAFAFB',
          100: '#F3F4F6',
          200: '#E6E9EC',
          300: '#D1D5DB',
          400: '#9CA3AF',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#0B1220'
        },

        // Semantic helpers
        bg: '#FFFFFF',
        surface: '#F5F6F7',
        'muted-surface': '#F3F4F6',
        'text-primary': '#0B1220',
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
