# story: e03s02

# e03s02 — Playwright E2E and CI Preflight Wiring

**Epic:** e03 | **Story:** e03s02 | **Status:** done | **BCPs:** 1

## Goal

Provide end-to-end browser smoke test coverage running against the Vite preview server and enforce Preflight verification in CI.

## Scope

- Playwright chromium configuration in `playwright.config.ts`
- E2E smoke tests checking title, section visibility, anchor scrolling, and mocked download URLs
- GitHub Actions CI workflow running `npm run preflight`

## Out of scope

- Cross-browser testing beyond Chromium
- Visual regression snapshot comparisons

## Verify

```bash
npm run preflight
```
