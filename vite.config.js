import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: ".", // asegura que Vite busque en la raíz
  build: {
    outDir: "dist", // salida estándar para Vercel
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  server: {
    host: true,
  },
});

