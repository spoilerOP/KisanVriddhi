/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nature: {
          50: '#f4f9f4',
          100: '#e3f0e4',
          200: '#c7e2c9',
          300: '#9cca9f',
          400: '#6aa86f',
          500: '#488b4d',
          600: '#36703b',
          700: '#2c5930',
          800: '#254728',
          900: '#1f3b22',
          950: '#0f2011',
        },
        accent: {
          gold: '#d4af37',
          orange: '#e67e22',
          red: '#c0392b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
        'glow': '0 0 15px rgba(72, 139, 77, 0.4)',
      }
    },
  },
  plugins: [],
}
