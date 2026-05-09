/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0A',
        celeste: {
          DEFAULT: '#6CACE4',
          dark: '#2E5C8A',
        },
        carbon: '#2C2C2A',
        bone: '#FAF8F5',
        sol: '#F4B942',
        cat: {
          politica: '#A32D2D',
          economia: '#185FA5',
          sociedad: '#3B6D11',
          cultura: '#3C3489',
          deportes: '#0F6E56',
          agro: '#854F0B',
          espectaculos: '#993556',
          mundo: '#444441',
          provincias: '#6B4423',
        },
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
