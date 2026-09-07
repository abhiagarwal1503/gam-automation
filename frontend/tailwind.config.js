/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gam: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#1a73e8',
          600: '#1557b0',
          700: '#0d47a1',
        }
      }
    },
  },
  plugins: [],
}
