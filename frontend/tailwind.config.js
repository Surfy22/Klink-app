/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      keyframes: {
        'pulse-ring': {
          '0%':   { transform: 'scale(1)',   opacity: '0.7' },
          '100%': { transform: 'scale(2.8)', opacity: '0'   },
        },
        'slide-up': {
          '0%':   { transform: 'translateY(40px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        'slide-down': {
          '0%':   { transform: 'translateY(-40px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'bounce-in': {
          '0%':   { transform: 'scale(0.75)', opacity: '0' },
          '60%':  { transform: 'scale(1.04)' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        'confetti-fall': {
          '0%':   { transform: 'translateY(-20px) rotate(0deg)',   opacity: '1' },
          '90%':  { opacity: '0.6' },
          '100%': { transform: 'translateY(110vh) rotate(720deg)', opacity: '0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)'  },
          '50%':      { transform: 'translateY(-6px)' },
        },
        'shrink-bar': {
          '0%':   { width: '100%' },
          '100%': { width: '0%'   },
        },
      },
      animation: {
        'pulse-ring':    'pulse-ring 1.5s ease-out infinite',
        'slide-up':      'slide-up 0.3s ease-out',
        'slide-down':    'slide-down 0.3s ease-out',
        'fade-in':       'fade-in 0.25s ease-out',
        'bounce-in':     'bounce-in 0.45s cubic-bezier(0.34,1.56,0.64,1)',
        'confetti-fall': 'confetti-fall linear infinite',
        'float':         'float 3s ease-in-out infinite',
        'shrink-bar':    'shrink-bar 8s linear forwards',
      },
    },
  },
  plugins: [],
};
