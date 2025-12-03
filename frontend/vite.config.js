import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    // Required for Docker mapping
    host: '0.0.0.0',
    port: 5173,
    // HMR Port must be explicit for the proxy to work correctly
    hmr: {
      clientPort: 80 
    }
  }
})
