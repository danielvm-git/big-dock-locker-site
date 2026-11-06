# story: e02s01

# e02s01 — Pure Release State Machine & useLatestRelease Composable

**Epic:** e02 | **Story:** e02s01 | **Status:** done | **BCPs:** 4

## Goal

Provide a pure finite state machine reducer (`releaseMachine.ts`) and a reactive composable (`useLatestRelease.ts`) to manage GitHub Releases API queries with timeouts, visibility revalidation, and error recovery.

## Scope

- Pure reducer handling `idle`, `loading`, `ready`, `failed`, and `refreshing`
- 10-second timeout handling with `AbortController`
- Visibilitychange auto-refresh coalescing
- Optimistic download count increments reconciled with server counts
- Comprehensive unit tests covering all state machine transitions

## Out of scope

- Direct rendering of HTML markup

## Verify

```bash
npm run test -- tests/unit/releaseMachine.test.ts tests/unit/useLatestRelease.test.ts
```
