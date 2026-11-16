import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

// Use the same API port as server/.env, so changing PORT there is enough (restart npm run dev after changing it).
let apiPort = 5051;
try {
  const m = fs.readFileSync(new URL('../server/.env', import.meta.url), 'utf8').match(/^PORT\s*=\s*(\d+)/m);
  if (m) apiPort = Number(m[1]);
} catch { /* no .env: keep 5000 */ }

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': `http://localhost:${apiPort}`,
      '/uploads': `http://localhost:${apiPort}`, // seller photos
    },
  },
});
