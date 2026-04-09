/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#EFF6F5',
        surface: '#FFFFFF',
        'surface-2': '#F2F9F8',
        gold: '#0B9E96',
        cream: '#1A2B2A',
        muted: '#8AABAA',
        brick: '#D94F4F',
        clay: '#D98A2E',
        sage: '#2EA88A',
      },
      fontFamily: {
        cormorant: ['"Cormorant SC"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
