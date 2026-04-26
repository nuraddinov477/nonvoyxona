/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bread: {
          50: '#fdf8f0',
          100: '#f9eddb',
          200: '#f2d7b0',
          300: '#e9bc7e',
          400: '#df9a4a',
          500: '#d6802a',
          600: '#c46820',
          700: '#a3501c',
          800: '#84411e',
          900: '#6c371c',
        },
      },
    },
  },
  plugins: [],
}
