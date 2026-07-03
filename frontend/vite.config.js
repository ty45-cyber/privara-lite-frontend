import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: mode === 'production'
    ? { 'import.meta.env.VITE_MOCK_MODE': '"true"' }
    : {},
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          mockLayer: ['./src/lib/mockApi.js', './src/lib/mockData.js'],
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
}))