/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0f1117',
          800: '#161b27',
          700: '#1e2535',
          600: '#252d3d',
          500: '#2d3748',
          400: '#374151'
        }
      }
    }
  },
  plugins: []
};
