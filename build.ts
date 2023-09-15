import { buildWatcher } from "bun-build-watcher";

await Bun.build({
  entrypoints: ['./src/code.ts'],
  outdir: './dist',
  minify: true,
  plugins: [buildWatcher()]
});