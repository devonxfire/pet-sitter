import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Force WASM fallback for lightningcss to avoid native binary issues
process.env.LIGHTNING_CSS_FORCE_WASM = process.env.LIGHTNING_CSS_FORCE_WASM || '1';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
