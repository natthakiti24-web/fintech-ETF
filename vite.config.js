import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api/yahoo': {
        target: 'https://query2.finance.yahoo.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/yahoo/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('referer');
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('x-forwarded-for');
            proxyReq.removeHeader('x-forwarded-proto');
            proxyReq.removeHeader('x-forwarded-host');
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0');
          });
        }
      },
      '/api/gemini': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true
      },
      '/api/finnhub': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true
      }
    }
  }
});
