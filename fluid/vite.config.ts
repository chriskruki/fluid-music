import { defineConfig } from 'vite'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: './',
  publicDir: 'static',
  build: {
    outDir: 'dist/public',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        control: path.resolve(__dirname, 'control.html'),
        beat: path.resolve(__dirname, 'beat-detector.html')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name.includes('beat-detector-processor')
            ? 'assets/[name].js'
            : 'assets/[name]-[hash].js'
        }
      }
    }
  },
  server: {
    port: 3001,
    open: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'ts')
    }
  }
})
