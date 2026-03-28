import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputOptions = {
  entryFileNames: '[name].js',
  chunkFileNames: 'chunks/[name].js',
  assetFileNames: 'assets/[name][extname]'
};

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'index.html'),
        background: resolve(__dirname, 'src/background/index.js')
      },
      output: outputOptions
    }
  }
});
