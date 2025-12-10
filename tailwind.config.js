/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Colores de SnapfaceID
        primary: {
          DEFAULT: '#6A1B9A',
          light: '#8B4DAE',
          dark: '#4A1D63',
        },
        secondary: {
          DEFAULT: '#FF5722',
          light: '#FF7043',
          dark: '#E64A19',
        },
        neutral: {
          dark: '#333333',
          gray: '#6C757D',
          border: '#E0E0E0',
        },
        status: {
          success: '#4CAF50',
          warning: '#FF9800',
          error: '#F44336',
          info: '#2196F3',
        },
      },
    },
  },
  plugins: [],
}
