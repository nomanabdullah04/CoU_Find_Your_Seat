/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0B3D91',
          dark: '#072861',
          light: '#134cb0',
        },
        'bright-blue': '#1E6FEB',
        'sky-tint': '#EAF2FF',
        success: '#16A34A',
        warning: '#F59E0B',
        text: '#0F172A',
      },
      fontFamily: {
        sans: ['Inter', 'Hind Siliguri', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        bangla: ['Hind Siliguri', 'sans-serif'],
        english: ['Inter', 'sans-serif'],
        sora: ['Sora', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

