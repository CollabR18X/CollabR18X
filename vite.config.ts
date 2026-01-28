import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// Conditionally load Replit plugins (avoiding top-level await)
const getReplitPlugins = () => {
  if (process.env.NODE_ENV === "production" || !process.env.REPL_ID) {
    return [];
  }
  // These will be loaded dynamically by Vite if needed
  // For now, we'll skip them to avoid esbuild issues
  return [];
};

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...getReplitPlugins(),
  ],
  // For GitHub Pages project site at https://github.com/CollabR18X/CollabR18X
  // and https://collabr18x.github.io/CollabR18X/, assets must be served
  // from the repository subpath.
  base: process.env.VITE_BASE ?? "/CollabR18X/",
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@client": path.resolve(import.meta.dirname, "client"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    host: "127.0.0.1", // Use localhost for Windows compatibility
    port: 5173,
    // Proxy API requests to Python backend in development
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000", // Use IPv4 explicitly
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxying
      },
    },
  },
});
