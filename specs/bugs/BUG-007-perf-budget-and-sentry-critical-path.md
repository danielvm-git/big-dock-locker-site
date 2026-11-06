---
bug_id: BUG-007
status: open
severity: high
scope: perf
title: Site exceeds the "under 1 second" vision criterion — 117 KB gzip JS on the critical path
issue: 13
---

# BUG-007 — Site exceeds the "under 1 second" vision criterion

## Summary

`specs/VISION_LATEST.yaml` success criterion #1 — _"Site loads under 1 second with
static assets and minimal bundle size"_ — is the only vision criterion with no
test protecting it, and the only one measurably failing. Everything (Vue, the
app, and the full Sentry SDK with tracing + session replay) ships in a single
blocking chunk, and the favicon is a 4.1 MB PNG.

## Baseline (recorded before any change, 2026-11-06)

Local build of `main` @ `4ef650b` (v1.6.3):

| Asset                     | Raw       | Gzip          |
| ------------------------- | --------- | ------------- |
| `dist/assets/index-*.js`  | 347.42 kB | **117.40 kB** |
| `dist/assets/index-*.css` | 11.13 kB  | 2.73 kB       |

Live site `https://bigdocklocker.netlify.app/` (Lighthouse 12, mobile defaults,
serving the older `index-COMqoqnk.js` build):

| Metric      | Value     |
| ----------- | --------- |
| Performance | **44**    |
| FCP         | 2.2 s     |
| LCP         | 3.2 s     |
| TBT         | 2,470 ms  |
| Speed Index | 7.0 s     |
| CLS         | 0.24      |
| TTI         | 4.9 s     |
| Page weight | 4,340 KiB |

Page-weight breakdown from the same report: `icon.png` **4,134,861 B**,
`dashboard.png` 188,469 B, `index-*.js` 111,821 B, CSS 2,621 B. The 4.1 MB
`icon.png` is the `<link rel="icon">` favicon and is also rendered at 22–28 px
in the navbar and footer. `dashboard.png` is rendered without `width`/`height`,
which is the 0.24 CLS.

## Root cause

1. `vite.config.ts` emits one bundle — no `manualChunks`/`advancedChunks`, so
   Vue, app code and Sentry cannot be cached or loaded independently.
2. `src/main.ts` imports `@sentry/vue` eagerly and initialises it before
   `app.mount('#app')`, pulling the whole SDK (tracing + session replay) into
   the critical path.
3. `public/icon.png` is a 2048×2048 / 4.1 MB source image used as a favicon and
   as a 22 px icon — 95 % of total page weight for an image never displayed
   above 28 px.
4. `HeroSection.vue` renders `dashboard.png` with no intrinsic size → layout
   shift when it decodes.

## Fix approach

1. `src/observability/sentry.ts` — lazy Sentry facade: `initSentry()` dynamic-imports
   `@sentry/vue` after first paint (`requestIdleCallback`, `load` fallback), and
   exposes `addBreadcrumb`/`captureMessage` that no-op until the SDK is loaded.
   `src/main.ts` and the two components call the facade instead of the SDK.
   Observability must never block first render; losing a breadcrumb before the
   SDK lands is acceptable, losing the render is not.
2. `vite.config.ts` — split vendor code (`vue`) from app code via
   `output.advancedChunks` so the vendor chunk is cached across deploys.
3. `public/icon.png` — downscale to 256×256 (the largest place it is used is
   28 px); keep the filename so `index.html`, navbar and footer are unchanged.
4. `HeroSection.vue` — add `width`/`height` (892×1058) to the hero screenshot to
   reserve layout space.
5. `scripts/check-bundle-budget.mjs` — asserts the gzip size of every emitted JS
   chunk is under budget; wired into `preflight` after `build`. Paired with a
   `tests/unit/ciWiring.test.ts` assertion so the gate cannot be silently
   dropped from `preflight`, mirroring the BUG-003 drift-guard.

## Acceptance criteria

- [ ] Baseline LCP/TBT recorded in issue #13 before any change (done above)
- [ ] Main JS chunk gzip reduced materially (target: under ~60 KB gzip)
- [ ] Sentry does not block first render
- [ ] Bundle-size budget asserted by a test that fails CI on regression
- [ ] Lighthouse performance on the live URL ≥ 90
- [ ] `npm run preflight` and the `e2e` CI job still green

## Verify

```bash
npm run preflight        # includes check:bundle
node scripts/check-bundle-budget.mjs
npx lighthouse <url> --only-categories=performance
```

## Out of scope

- Migrating the site off Netlify, CDN tuning, service worker/precache.
- Any visual redesign: the sections and copy stay byte-identical.
