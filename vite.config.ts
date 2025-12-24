import { defineConfig } from 'vite';

export default defineConfig({
  base: '/3d-exploration-game/',
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'babylonjs-core': ['@babylonjs/core'],
          'babylonjs-gui': ['@babylonjs/gui'],
          'babylonjs-loaders': ['@babylonjs/loaders'],
        },
      },
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});
