// vite.config.ts  (or vite.config.js)
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    port: 5174,   // <-- change this to whatever free port you prefer
    // open: true  // optional: auto‑open the browser
  },
});
