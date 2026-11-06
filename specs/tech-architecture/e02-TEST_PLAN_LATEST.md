# Test Plan: e02 Live Releases & Interactive Machines

**Epic:** e02 | **Status:** Active | **Risk Tier:** Critical (P1)

## 1. Test Levels

- **Reducer Unit Tests (`releaseMachine.test.ts`)**:
  - Initial state creation (`idle`)
  - State transitions: `FETCH_START` → `loading`, `FETCH_SUCCESS` → `ready`, `FETCH_ERROR` → `failed`, `TIMEOUT` → `failed`
  - Revalidation: `VISIBLE` during `ready` → `refreshing`
  - Error isolation: `FETCH_ERROR` during `refreshing` maintains `ready` status with existing data
  - Monotonic download count reconciliation
- **Composable Service Tests (`useLatestRelease.test.ts`)**:
  - Singleton module scope behavior
  - AbortController timeout execution after 10s
  - Visibility event listener cleanup and revalidation
- **Component Tests (`InstallSection.test.ts`)**:
  - Clipboard copy success transitions: `idle` → `copying` → `copied`
  - Ephemeral confirmation reset after 2000ms
  - Clipboard rejection error transition: `idle` → `copying` → `copy-error`

## 2. Risk Matrix

| Component          | Risk          | Level          | Test Strategy                       |
| ------------------ | ------------- | -------------- | ----------------------------------- |
| `releaseMachine`   | Critical (P1) | Pure Unit      | Exhaustive state transition testing |
| `useLatestRelease` | High (P1)     | Integration    | Mock fetch + fake timers            |
| `InstallSection`   | Medium (P2)   | Component Unit | Mock navigator.clipboard            |
