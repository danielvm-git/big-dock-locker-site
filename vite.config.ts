import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { readFileSync } from 'node:fs'

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string }

export default defineConfig({
  plugins: [
    vue(),
    sentryVitePlugin({
      org: 'bigbuilds',
      project: 'javascript-vue',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: {
        name: `big-dock-locker-site@${version}`,
        setCommits: { auto: true, ignoreMissing: true },
      },
      sourcemaps: {
        assets: './dist/**',
        filesToDeleteAfterUpload: './dist/**/*.map',
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        // Cache the framework separately from app code. Scoped to Vue on
        // purpose: a blanket node_modules rule would drag the lazily imported
        // Sentry SDK back into the critical path (BUG-007).
        manualChunks: (id: string) => (/node_modules\/(vue|@vue)\//.test(id) ? 'vue' : undefined),
      },
    },
  },
})
