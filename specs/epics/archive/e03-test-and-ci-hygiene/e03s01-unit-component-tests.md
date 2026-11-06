# story: e03s01

# e03s01 — Unit and Component Test Suite

**Epic:** e03 | **Story:** e03s01 | **Status:** done | **BCPs:** 2

## Goal

Provide comprehensive unit and component tests verifying download button rendering, release version display, and architecture CTA routing.

## Scope

- DownloadSection component tests with mock composable fixtures
- HeroSection component tests with mock release payload
- Assertions on download links, badges, and button labels

## Out of scope

- Real network calls to api.github.com during unit testing

## Verify

```bash
npm run test -- tests/unit/DownloadSection.test.ts tests/unit/HeroSection.test.ts
```
