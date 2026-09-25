import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // The English word list is a lazily loaded ~3 MB chunk; that's expected.
    chunkSizeWarningLimit: 4000,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
