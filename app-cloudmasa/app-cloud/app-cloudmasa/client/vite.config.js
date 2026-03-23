import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  // ✅ ADD THIS LINE 👇
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.svg', '**/*.gif'],

  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 5173,
      overlay: false,
    },
    proxy: {
      '/api': {
        target: 'http://13.218.210.100:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
