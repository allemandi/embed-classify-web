import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    open: true,
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  optimizeDeps: {
    exclude: ['@xenova/transformers']
  },
  assetsInclude: ['**/*.html']
}); 