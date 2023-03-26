import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import path, { resolve } from 'path';
import { existsSync, readdirSync, lstatSync, rmdirSync, unlinkSync } from 'fs';

import machineFullReload from './vite-machine-full-reload';

emptyDir(resolve(__dirname, 'dist'));

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'Globe',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        '@react-three/fiber',
        'three',
        'xstate',
        '@xstate/react',
        'rxjs',
      ],
      output: {
        globals: {
          react: 'React',
        },
        sourcemapExcludeSources: true,
      },
    },
    sourcemap: true,
    // Reduce bloat from legacy polyfills.
    target: 'esnext',
    // Leave minification up to applications.
    minify: false,
  },
  plugins: [
    react(),
    machineFullReload(['**/*.machine.ts', '**/machine.ts']),
    dts({
      skipDiagnostics: false,
      rollupTypes: true,
      staticImport: true,
      insertTypesEntry: true,
    }),
  ],
});

function emptyDir(dir: string): void {
  if (!existsSync(dir)) {
    return;
  }

  for (const file of readdirSync(dir)) {
    const abs = resolve(dir, file);

    // baseline is Node 12 so can't use rmSync
    if (lstatSync(abs).isDirectory()) {
      emptyDir(abs);
      rmdirSync(abs);
    } else {
      unlinkSync(abs);
    }
  }
}
