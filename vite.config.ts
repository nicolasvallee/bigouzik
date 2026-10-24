import { alphaTab } from '@coderline/alphatab-vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import { trackGroups, trackId } from './src/data/trackGroups'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/bigouzik/' : '/',
  plugins: [alphaTab(), vue(), ...tailwindcss(), {
    name: 'shareable-route-html',
    // GitHub Pages needs real files so link crawlers don't receive the JS-only 404.
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const index = bundle['index.html']
        if (!index || index.type !== 'asset' || typeof index.source !== 'string') {
          this.error('Missing built index.html for social link previews')
        }
        const paths = ['tuto', 'back-to-batuk', ...trackGroups.flatMap(group => [
          `back-to-batuk/${group.id}`,
          ...group.tracks.map(track => `back-to-batuk/${group.id}/${trackId(track)}`),
        ])]
        for (const path of new Set(paths)) {
          this.emitFile({
            type: 'asset',
            fileName: `${path}/index.html`,
            source: index.source.replace(
              'property="og:url" content="https://nicolasvallee.github.io/bigouzik/"',
              `property="og:url" content="https://nicolasvallee.github.io/bigouzik/${path}/"`,
            ),
          })
        }
      },
    },
  }],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}))
