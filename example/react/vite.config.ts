import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@imccc/hex-viewer-js': path.resolve(__dirname, '../../dist'),
    },
  },
  base: './',
  build: {
    outDir: '../../docs/react-demo',
    emptyOutDir: true
  }
})
