import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: ".", // base del proyecto
  base: "./", // 👈 clave para que Vercel sirva los assets correctamente
  build: {
    outDir: "dist", // salida para producción
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5174,
  },
});
