import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
  build: {
    outDir: resolve(__dirname, '../backend/public'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        app: resolve(__dirname, 'app.html'),
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://127.0.0.1:3000',
      '/users': 'http://127.0.0.1:3000',
      '/location': 'http://127.0.0.1:3000',
      '/security': 'http://127.0.0.1:3000',
      '/proximity': 'http://127.0.0.1:3000',
      '/notifications': 'http://127.0.0.1:3000',
      '/zkp': 'http://127.0.0.1:3000',
      '/health': 'http://127.0.0.1:3000',
    },
  },
});
