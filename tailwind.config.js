/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        papel: '#F3EDE3',
        'papel-hondo': '#E8DFD1',
        tinta: '#2B2622',
        'tinta-suave': '#6B625A',
        borde: '#2B2622',
        terracota: '#C8553D',
        'terracota-claro': '#E6B3A5',
        arena: '#FBF7F0',
        mostaza: '#D9A441',
        oliva: '#7A8B6F',
        cielo: '#5B7C99',
      },
      fontFamily: {
        serif: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: { tarjeta: '10px' },
      boxShadow: {
        papel: '0 1px 0 0 rgba(43,38,34,0.06)',
        sheet: '0 -8px 32px -8px rgba(43,38,34,0.22)',
      },
      keyframes: {
        'sheet-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'rise': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'sheet-up': 'sheet-up .26s cubic-bezier(.22,.9,.32,1)',
        'fade-in': 'fade-in .2s ease-out',
        rise: 'rise .28s cubic-bezier(.22,.9,.32,1) both',
      },
    },
  },
  plugins: [],
}
