import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import machineFullReload from './vite-machine-full-reload';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'Globe',
      formats: ['es', 'cjs'],
      fileName: (format) => `globe.${format}.js`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react-three-fiber',
        'three',
        'xstate',
        '@xstate/react',
        'rxjs',
      ],
      output: {
        sourcemapExcludeSources: true,
      },
    },
    sourcemap: true,
    // Reduce bloat from legacy polyfills.
    target: 'esnext',
    // Leave minification up to applications.
    minify: false,
  },
  plugins: [react(), machineFullReload(['**/*.machine.ts', '**/machine.ts'])],
});
