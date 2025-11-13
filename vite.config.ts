import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    server: {
        host: "::",
        port: 8080,
        proxy: {
            "/api": { target: "http://localhost:8082", changeOrigin: true },
            "/ws":  { target: "http://localhost:8082", changeOrigin: true, ws: true },
        },
    },
    define: { global: "window" }, // fix 'global is not defined' for sockjs-client

    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
