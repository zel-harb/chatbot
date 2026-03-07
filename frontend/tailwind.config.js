/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#BDE8F5',   // Light blue
          100: '#B0DFF2',
          200: '#8ED0EB',
          300: '#6BC1E4',
          400: '#4988C4',  // Medium blue
          500: '#4988C4',  // Medium blue
          600: '#1C4D8D',  // Dark medium blue
          700: '#1C4D8D',  // Dark medium blue
          800: '#0F2854',  // Very dark blue
          900: '#0F2854',  // Very dark blue
        },
        secondary: {
          400: '#4988C4',
          500: '#4988C4',
          600: '#1C4D8D',
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #0F2854 0%, #1C4D8D 50%, #4988C4 100%)',
        'gradient-light': 'linear-gradient(135deg, #BDE8F5 0%, #B0DFF2 50%, #8ED0EB 100%)',
      }
    },
  },
  plugins: [],
}
