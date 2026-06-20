/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#047857', // dark green for professional botanical feel
          light: '#059669', // lighter green accent
          dark: '#065f46',
        },
        accent: {
          DEFAULT: '#34D399', // bright green accents
        },
      },
    },
  },
  plugins: [],
};