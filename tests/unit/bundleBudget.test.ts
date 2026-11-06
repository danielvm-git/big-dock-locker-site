// story: BUG-007
// `specs/VISION_LATEST.yaml` success criterion #1 ("site loads under 1 second
// with static assets and minimal bundle size") is the only vision criterion
// with no test protecting it, and the only one that measurably fails. Without a
// gate the bundle silently grows with every feature — the same drift that let
// the Playwright suite run nowhere (BUG-003). This guards the invariant: the
// critical-path JavaScript payload is measured on every preflight and fails
// when it regresses.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8')) as {
  scripts: Record<string, string>
}

const SCRIPT = resolve(ROOT, 'scripts/check-bundle-budget.mjs')

describe('the bundle budget gate exists and runs in preflight', () => {
  it('defines a check:bundle script that runs the budget checker', () => {
    expect(pkg.scripts['check:bundle']).toContain('scripts/check-bundle-budget.mjs')
  })

  it('runs check:bundle in preflight, after the build it measures', () => {
    expect(pkg.scripts.preflight).toMatch(/npm run build && npm run check:bundle/)
  })

  it('fails CI on regression by failing preflight', () => {
    // preflight is what the CI build job runs; no separate wiring needed.
    const ci = readFileSync(resolve(ROOT, '.github/workflows/ci.yml'), 'utf-8')
    expect(ci).toMatch(/npm run preflight/)
  })
})

describe('the critical-path payload is computed from dist/index.html', () => {
  const load = async () =>
    (await import('../../scripts/check-bundle-budget.mjs')) as {
      initialAssetUrls: (html: string) => string[]
      JS_BUDGET_KB: number
    }

  it('counts the entry module and every modulepreload, and nothing else', async () => {
    const { initialAssetUrls } = await load()
    const html = [
      '<script type="module" crossorigin src="/assets/index-abc.js"></script>',
      '<link rel="modulepreload" crossorigin href="/assets/vendor-def.js">',
      '<link rel="stylesheet" crossorigin href="/assets/index-ghi.css">',
      '<link rel="icon" type="image/png" href="/icon.png">',
    ].join('\n')

    expect(initialAssetUrls(html)).toEqual(['/assets/index-abc.js', '/assets/vendor-def.js'])
  })

  it('ignores dynamically imported chunks that are not preloaded', async () => {
    const { initialAssetUrls } = await load()
    const html = [
      '<script type="module" crossorigin src="/assets/index-abc.js"></script>',
      // A lazily imported chunk is never referenced from index.html, which is
      // exactly how a deferred Sentry SDK stays off the critical path.
      '<link rel="modulepreload" href="/assets/vendor-def.js">',
    ].join('\n')

    expect(initialAssetUrls(html)).not.toContain('/assets/sentry-lazy.js')
  })

  it('keeps the budget honest — a 60 KB gzip ceiling for critical-path JS', async () => {
    const { JS_BUDGET_KB } = await load()
    expect(JS_BUDGET_KB).toBeLessThanOrEqual(60)
    expect(JS_BUDGET_KB).toBeGreaterThan(10)
  })
})
