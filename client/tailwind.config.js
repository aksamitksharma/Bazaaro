/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#312E81', light: '#4338CA', dark: '#1E1B4B' },
        secondary: { DEFAULT: '#059669', light: '#10B981' },
        accent: { DEFAULT: '#D97706', light: '#F59E0B' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
