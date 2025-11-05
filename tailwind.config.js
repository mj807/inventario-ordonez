/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1e3a8a", // azul acero Ordoñez
        dark: "#111827", // gris oscuro
      },
    },
  },
  plugins: [],
};
