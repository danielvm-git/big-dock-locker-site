# story: e02s02

# e02s02 — Install Section Clipboard State Machine

**Epic:** e02 | **Story:** e02s02 | **Status:** done | **BCPs:** 2

## Goal

Provide a terminal install command snippet with clipboard state machine (`idle`, `copying`, `copied`, `copy-error`) that handles copy feedback and timer resets gracefully.

## Scope

- Terminal quarantine removal command display in `src/components/InstallSection.vue`
- Copy button with 4 distinct visual feedback states
- 2-second timeout reset with cleanup on unmount
- Unit tests mocking `navigator.clipboard`

## Out of scope

- Direct execution of terminal commands in the browser

## Verify

```bash
npm run test -- tests/unit/InstallSection.test.ts
```
