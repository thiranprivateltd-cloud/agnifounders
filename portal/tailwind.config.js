/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgPrimary: '#0A0A0F',
        bgSurface: '#161622',
        accentPrimary: '#F5A623',
        accentSecondary: '#7B5EA7',
        textPrimary: '#FFFFFF',
        textSecondary: '#8A8A9A',
      }
    },
  },
  plugins: [],
}
