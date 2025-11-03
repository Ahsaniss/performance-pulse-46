import path from "path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "es-toolkit/compat/get": path.resolve(__dirname, "./src/shims/es-toolkit-get.js"),
      "es-toolkit/compat/get.js": path.resolve(__dirname, "./src/shims/es-toolkit-get.js"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  optimizeDeps: {
    exclude: ["recharts", "es-toolkit"],
  },
}));
