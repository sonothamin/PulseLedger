import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory
  const env = loadEnv(mode, process.cwd(), '');
  const apiBase = env.VITE_API_BASE;
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'HindSiliguri-Regular.ttf', 'logo.png'],
        manifest: {
          name: 'PulseLedger',
          short_name: 'PulseLedger',
          description: 'PulseLedger - POS management.',
          theme_color: '#242424',
          background_color: '#242424',
          display: 'standalone',
          start_url: '.',
          icons: [
            {
              src: 'logo-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'logo-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
        devOptions: {
          enabled: true,
        },
      }),
    ],
    assetsInclude: ['**/*.lang'],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
