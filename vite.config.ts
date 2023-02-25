import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import machineFullReload from './vite-machine-full-reload';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), machineFullReload(['**/*.machine.ts', '**/machine.ts'])],
});
