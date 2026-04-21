import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@web-ssh/shared-types': path.resolve(__dirname, '../../packages/shared-types/index.ts'),
      '@web-ssh/protocol': path.resolve(__dirname, '../../packages/protocol/index.ts'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/ws': {
        target: 'ws://localhost:4000',
        ws: true,
      },
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
