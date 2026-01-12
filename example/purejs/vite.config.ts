import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: __dirname,
  base: './',
  build: {
    outDir: '../../docs/js-demo',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'index.html')
    }
  },
  resolve: {
    alias: {
      '@imccc/hex-viewer-js': resolve(__dirname, '../../dist'),
    }
  }
});
