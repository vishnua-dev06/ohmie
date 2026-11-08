import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('/node_modules/')) return;
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router/') || id.includes('/@remix-run/')) return 'react-vendor';
          if (id.includes('/@supabase/')) return 'supabase';
          if (id.includes('/framer-motion/') || id.includes('/motion-')) return 'motion';
          if (id.includes('/lucide-react/')) return 'icons';
          if (id.includes('/zustand/')) return 'state';
        },
      },
    },
  },
});
