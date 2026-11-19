import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures assets are relative for double-click local opening and GitHub Pages
  test: {
    globals: true,
    environment: 'node',
  },
});
