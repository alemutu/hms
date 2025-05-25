import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  root: '/home/project',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize build for production
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['@radix-ui/react-label', '@radix-ui/react-slot', 'class-variance-authority', 'clsx', 'tailwind-merge'],
          'icons': ['lucide-react']
        }
      }
    }
  },
  server: {
    // Increase timeout for build operations
    hmr: {
      timeout: 5000
    }
  }
});