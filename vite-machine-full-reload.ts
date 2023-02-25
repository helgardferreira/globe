import { resolve, relative } from 'path';
import picomatch from 'picomatch';
// eslint-disable-next-line import/no-extraneous-dependencies
import { type PluginOption, type ViteDevServer, normalizePath } from 'vite';

function normalizePaths(root: string, path: string | string[]): string[] {
  return (Array.isArray(path) ? path : [path])
    .map((path) => resolve(root, path))
    .map(normalizePath);
}

export default function machineFullReload(
  paths: string | string[]
): PluginOption {
  return {
    name: 'vite-plugin-full-reload',

    apply: 'serve',

    // NOTE: Enable globbing so that Vite keeps track of the template files.
    config: () => ({ server: { watch: { disableGlobbing: false } } }),

    configureServer({ watcher, ws, config: { logger } }: ViteDevServer) {
      const root = process.cwd();
      const always = false;

      const files = normalizePaths(root, paths);
      const shouldReload = picomatch(files);
      const checkReload = (path: string) => {
        if (shouldReload(path)) {
          ws.send({ type: 'full-reload', path: always ? '*' : path });
          logger.info(`page reload ${relative(root, path)}`, {
            clear: true,
            timestamp: true,
          });
        }
      };

      // Ensure Vite keeps track of the files and triggers HMR as needed.
      watcher.add(files);

      // Do a full page reload if any of the watched files changes.
      watcher.on('add', checkReload);
      watcher.on('change', checkReload);
    },
  };
}
