/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'twitch-purple': '#9147ff',
        'twitch-purple-dark': '#772ce8',
        'chat-bg': 'var(--chat-bg)',
        'chat-text': 'var(--chat-text)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.3s ease-out forwards',
        'fade-in-slide': 'fadeInSlide 0.3s ease-out forwards',
        'pop-in': 'popIn 0.15s ease-out forwards',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        fadeInSlide: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '70%': { transform: 'scale(1.05)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(145, 71, 255, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(145, 71, 255, 0.8)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      fontSize: {
        '2xs': '0.625rem',
      },
      spacing: {
        '18': '4.5rem',
      },
    },
  },
  plugins: [],
};
