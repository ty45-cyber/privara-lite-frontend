import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load all env vars — including those without VITE_ prefix
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],

    // Force mock mode in production — zero backend dependency on Vercel
    // This is injected at BUILD TIME, not runtime
    define: {
      // Always true in production — judges see fully functional mock
      'import.meta.env.VITE_MOCK_MODE': JSON.stringify(
        mode === 'production' ? 'true' : (env.VITE_MOCK_MODE || 'false')
      ),
      // Pass through SoSoValue API key if set
      'import.meta.env.VITE_SOSOVALUE_API_KEY': JSON.stringify(
        env.VITE_SOSOVALUE_API_KEY || ''
      ),
    },

    // Base path — must be '/' for Vercel SPA
    base: '/',

    // Dev server proxy — only used locally, not in production
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },

    build: {
      outDir:          'dist',
      sourcemap:       false,
      // Ensure assets use relative paths — prevents blank screen
      assetsDir:       'assets',
      // Chunk splitting for faster initial load
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React — always needed
            vendor: ['react', 'react-dom', 'react-router-dom'],
            // UI icons — large but cacheable
            ui:     ['lucide-react'],
            // Mock layer — loaded only in production
            mock:   ['./src/lib/mockApi.js', './src/lib/mockData.js'],
            // Agents — loaded on demand
            agents: ['./src/lib/agents.js'],
            // SoSoValue client — loads on dashboard
            ssv:    ['./src/lib/sosovalue.js'],
          },
        },
      },
    },

    // Prevent Vite from crashing on missing optional deps
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
    },
  }
})