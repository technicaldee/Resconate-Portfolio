/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./*.js"
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'plus-jakarta': ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        primary: {
          50: 'hsl(215, 100%, 95%)',
          100: 'hsl(215, 100%, 90%)',
          200: 'hsl(215, 100%, 80%)',
          300: 'hsl(215, 100%, 70%)',
          400: 'hsl(215, 100%, 60%)',
          500: 'hsl(215, 100%, 50%)',
          600: 'hsl(215, 100%, 40%)',
          700: 'hsl(215, 100%, 30%)',
          800: 'hsl(215, 100%, 20%)',
          900: 'hsl(215, 100%, 10%)',
        },
        secondary: {
          50: 'hsl(330, 100%, 95%)',
          100: 'hsl(330, 100%, 90%)',
          200: 'hsl(330, 100%, 80%)',
          300: 'hsl(330, 100%, 70%)',
          400: 'hsl(330, 100%, 60%)',
          500: 'hsl(330, 100%, 50%)',
          600: 'hsl(330, 100%, 40%)',
          700: 'hsl(330, 100%, 30%)',
          800: 'hsl(330, 100%, 20%)',
          900: 'hsl(330, 100%, 10%)',
        }
      }
    },
  },
  plugins: [],
} 