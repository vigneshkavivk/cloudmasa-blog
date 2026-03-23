/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          800: '#0a192f',
          900: '#020c1b',
          950: '#01060f',
        },
        // ⚠️ Note: You're redefining 'emerald' as orange shades
        // This works, but consider using a custom name like 'brand-orange'
        // to avoid confusion with Tailwind's real emerald palette.
        emerald: {
          400: '#fb923c', // orange-400
          500: '#f97316', // orange-500
          600: '#ea580c', // orange-600
        },
        glass: {
          100: 'rgba(255, 255, 255, 0.03)',
          200: 'rgba(255, 255, 255, 0.08)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}