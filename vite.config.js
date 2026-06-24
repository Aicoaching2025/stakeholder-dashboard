import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Base "./" keeps asset paths relative so the build works on Vercel, GitHub
// Pages, or any static host without extra config.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200, // plotly is large by nature
  },
});
