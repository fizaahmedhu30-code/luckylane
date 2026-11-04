import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.SLOTOPOL_API_URL || 'http://localhost:8080';
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/slotopol': {
          target,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/slotopol/, ''),
        },
      },
    },
  };
});
