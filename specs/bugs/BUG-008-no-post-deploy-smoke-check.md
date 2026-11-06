---
bug_id: BUG-008
status: open
severity: high
scope: ci
title: Deployment is invisible to CI — no post-deploy smoke check on the live site
issue: 14
---

# BUG-008 — Deployment is invisible to CI

## Summary

A green `ci` run proves the code builds, not that the public site works. Netlify
builds and publishes from git via `netlify.toml`; there is no deploy workflow and
no post-deploy verification, so a bad build config, a missing asset, a redirect
rule or a failed Netlify deploy leaves every gate green while the site is broken.

Evidence at intake: the live site served `index-COMqoqnk.js` while a build of
`main` @ `4ef650b` emitted `index-UQHrV6G5.js`. Nothing surfaced the divergence.

## Root cause

`.github/workflows/` contains only `ci.yml` (build + e2e, both pre-deploy) and
`release.yml` (tagging). Netlify's deploy result never re-enters CI, and no job
asserts anything about the published artifact.

## Fix approach

1. `scripts/smoke-live.mjs` — Playwright-driven checker against a **live URL**
   (never a local rebuild, so it catches deploy-layer failures):
   - HTTP 200 on `/`
   - `<title>` contains `Big DockLocker`
   - sections `#features`, `#how-it-works`, `#install`, `#download` all visible
     (the same contract `tests/e2e/smoke.test.ts` encodes)
   - at least one download link resolves to a real GitHub release asset (HTTP
     200 on the `browser_download_url` from the releases API)
   - the runtime version badge equals the latest `danielvm-git/big-dock-locker`
     release tag, i.e. the badge is not stale
   - deploy freshness: when `--dist dist` is supplied, the `<script src>` hash
     served by the live site must equal the local build's hash, after a bounded
     wait for the Netlify deploy to finish. A stale deploy fails loudly.
   - failures name the failing assertion and print the Netlify deploys URL.
2. `--self-test` mode serves a deliberately broken copy of the page on
   `127.0.0.1` and asserts the checker **fails** on it. This is the negative
   test required by the acceptance criteria; it runs in the workflow before the
   live check so a checker that silently passes everything cannot go green.
3. `.github/workflows/deploy-smoke.yml` — separate workflow (`push: main`,
   `schedule`, `workflow_dispatch`) in the pinned Playwright container. Separate
   file so it cannot block or slow the existing `ci` / `e2e` jobs.
4. `tests/unit/ciWiring.test.ts` — drift guard: the workflow must exist, run the
   checker, run the self-test, pin the same Playwright image as `ci.yml`, and
   must **not** be reachable from the `ci` job.
5. `CONVENTIONS.md` — document the gate so future agents know it exists.

## Acceptance criteria

- [ ] Live-site smoke check runs automatically after a production deploy
- [ ] A deliberately broken deploy fails the check (verify by negative test)
- [ ] Failure output names the failing assertion and links the Netlify deploy
- [ ] Does not block or slow the existing `ci` / `e2e` jobs
- [ ] Documented in `CONVENTIONS.md`

## Verify

```bash
node scripts/smoke-live.mjs --self-test
node scripts/smoke-live.mjs --url https://bigdocklocker.netlify.app/ --dist dist
gh run watch        # deploy-smoke workflow
```

## Out of scope

- Replacing Netlify, PR preview checks, BigBase migration.
