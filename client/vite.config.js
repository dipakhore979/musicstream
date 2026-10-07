import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const api = { "/api": { target: "http://localhost:5000", changeOrigin: true } };

// The proxy keeps the API same-origin, so httpOnly cookies work without CORS/SameSite headaches.
// `preview` serves the production build (npm run build && npm run preview), which is what you need
// to test installing the app: service workers only run in production builds.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: api },
  preview: { port: 4173, proxy: api },
});
