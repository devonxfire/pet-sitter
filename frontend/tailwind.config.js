/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#20B2AA', // Muted Turquoise
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
