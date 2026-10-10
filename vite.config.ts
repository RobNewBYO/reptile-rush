import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  build: {
    chunkSizeWarningLimit: 1500, // Phaser is large; fine for a game
  },
});
