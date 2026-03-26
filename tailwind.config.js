/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard Variable', 'Pretendard', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Pretendard Variable', 'Pretendard', 'Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#E6F0FF',
          100: '#CCE0FF',
          200: '#99C2FF',
          300: '#66A3FF',
          400: '#3385FF',
          500: '#0066FF', /* Electric Blue */
          600: '#0052CC',
          700: '#003D99',
          800: '#002966',
          900: '#001433',
        },
        emerald: {
          50: '#E6FAF3',
          100: '#CCF5E7',
          200: '#99EBCF',
          300: '#66E1B7',
          400: '#33D79F',
          500: '#00C48C', /* Emerald Green */
          600: '#009D70',
          700: '#007654',
          800: '#004E38',
          900: '#00271C',
        },
        surface: {
          deep: '#0A0E1A',
          card: '#101828',
          elevated: '#161E37',
          border: 'rgba(255, 255, 255, 0.08)',
        },
      },
      maxWidth: {
        '7xl': '1440px', /* 120% wider than default 6xl(1152px) */
        '8xl': '1536px',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        'glass': '0 4px 24px rgba(0, 0, 0, 0.2)',
        'glass-hover': '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.06)',
        'glow-blue': '0 4px 20px rgba(0, 102, 255, 0.3)',
        'glow-emerald': '0 4px 20px rgba(0, 196, 140, 0.3)',
      },
      animation: {
        'fade-up': 'fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-dot': 'pulse-dot 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
