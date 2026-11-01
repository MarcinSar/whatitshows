// Build frame for the kb export: the export ships src/ only (support repo, apps/kb/ -> src/).
import adapter from '@sveltejs/adapter-static';
import { mdsvex } from 'mdsvex';
import { fileURLToPath } from 'node:url';

const runbook = fileURLToPath(new URL('./src/lib/layouts/runbook.svelte', import.meta.url));

export default {
  extensions: ['.svelte', '.svx'],
  preprocess: [mdsvex({ extensions: ['.svx'], layout: { runbook } })],
  kit: {
    // Static HTML, the way the desk reads the kb. `render/` is committed.
    adapter: adapter({ pages: 'render', assets: 'render', strict: true }),
    alias: { '#lib': 'src/lib' },
    prerender: { entries: ['*'] },
  },
};
