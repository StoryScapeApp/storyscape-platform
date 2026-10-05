import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const apiUrl = new URL(env.VITE_API_BASE_URL || 'http://localhost:3000');

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg'],
        manifest: {
          name: 'StoryScape Teacher',
          short_name: 'StoryScape',
          description: 'Teacher access to StoryScape academic tracking.',
          start_url: '/',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#ffffff',
          icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
        },
        workbox: {
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api(?:\/|$)/],
          runtimeCaching: [{
            urlPattern: ({ url }) => url.origin === apiUrl.origin,
            handler: 'NetworkOnly',
          }],
        },
      }),
    ],
  };
});
