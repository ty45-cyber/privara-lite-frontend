import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],

  // Force mock mode in production — zero backend dependency on Vercel
  define: mode === 'production'
    ? { 'import.meta.env.VITE_MOCK_MODE': '"true"' }
    : {},

  server: {
    proxy: {
      '/api': {
        target:       'http://localhost:8080',
        changeOrigin: true,
        rewrite:      (path) => path.replace(/^\/api/, ''),
      },
    },
  },

  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          mockLayer: ['./src/lib/mockApi.js', './src/lib/mockData.js'],
          agents:    ['./src/lib/agents.js'],
          vendor:    ['react', 'react-dom', 'react-router-dom'],
          ui:        ['lucide-react'],
        },
      },
    },
  },
}))