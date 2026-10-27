/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fredoka', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        roll: {
          '0%': { transform: 'scale(0.6) rotate(-12deg)', opacity: '0' },
          '60%': { transform: 'scale(1.06) rotate(3deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0)' },
        },
      },
      animation: {
        roll: 'roll 380ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
      },
    },
  },
  plugins: [],
};
