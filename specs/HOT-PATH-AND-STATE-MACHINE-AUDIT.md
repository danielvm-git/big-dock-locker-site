# Hot Path & State Machine Audit

> **Post-execution status:** see `specs/EXECUTION-REPORT.md`. All audit items are fixed except GitHub issue #1, which is blocked externally (stale template).

- **Date:** 2026-11-03
- **Branch:** `audit/state-machines-async`
- **Scope:** `src/**` (production code only; tests and `dist/` excluded)
- **Baseline:** `npm run test` 19/19 green, `npm run typecheck` green, `npm run lint` green.
- **Trigger:** user request to (1) sweep hot paths for unnecessary sequential async calls, (2) inventory implicit state machines and their conflicts, (3) list non-terminal states of the service state machine.

> **Assumption:** "máquina de estados como serviço" is interpreted as the service layer that owns async lifecycle state — here, the module-scope singleton in `src/composables/useLatestRelease.ts`. This document inventories that machine and reports non-terminal states; it does **not** introduce an XState dependency or rewrite the machine, because the user asked to make it explicit themselves.

---

## 1. Method

1. Grep every async boundary in production code: `await`, `.then(`, `Promise.`, `async`, `setTimeout`, `addEventListener`, `fetch(`.
2. Classify each call as (a) independent, (b) data-dependent, or (c) unnecessary sequencing.
3. Enumerate state encoded in module/component variables and derive reachable states + transitions.
4. Run baseline gates before and after changes.

Production async call sites are only two:

| File                                  | Line  | Call                                                   |
| ------------------------------------- | ----- | ------------------------------------------------------ |
| `src/composables/useLatestRelease.ts` | 30–61 | `fetch(...).then(check).then(parse).catch().finally()` |
| `src/components/InstallSection.vue`   | 8–13  | `navigator.clipboard.writeText(...).then(setTimeout)`  |

Everything else is synchronous (Vue render, static markup). Sentry is no longer a
synchronous call site: the facade queues and the SDK itself is dynamic-imported
(BUG-007).

---

## 2. Hot path inventory

| ID   | Hot path           | Trigger                                    | Async boundary                          | Blocks first paint? | Notes                                                                    |
| ---- | ------------------ | ------------------------------------------ | --------------------------------------- | ------------------- | ------------------------------------------------------------------------ |
| HP-1 | Bootstrap          | `main.ts` module eval                      | none                                    | **No**              | `app.mount()` first; `scheduleSentry()` defers the SDK to idle (BUG-007) |
| HP-2 | First release load | `HeroSection` setup → `useLatestRelease()` | `fetch` + `json()`                      | No                  | Fire-and-forget; singleton guard prevents duplicate fetch                |
| HP-3 | Sibling consumers  | `DownloadSection`, `TheFooter` setup       | none                                    | No                  | `release` null + `loading` true → guard skips fetch                      |
| HP-4 | Tab regain         | `visibilitychange` listener                | `fetch` + `json()`                      | No                  | `if (loading) return` coalesces concurrent refreshes                     |
| HP-5 | Download click     | `<a @click>`                               | none                                    | No                  | Optimistic `incrementDownload` + 2 queued Sentry calls                   |
| HP-6 | Copy command       | `<button @click>`                          | `clipboard.writeText` then `setTimeout` | No                  | Timer not tracked/cleared                                                |
| HP-7 | Static sections    | render                                     | none                                    | No                  | Pure markup                                                              |

**Performance note:** HP-1 used to be the only synchronous hot path delaying first
paint (`Sentry.init()` before `app.mount()`, 113 KB gzip of SDK in the entry chunk).
Since BUG-007 the app mounts first and `scheduleSentry()` dynamic-imports the SDK in
`requestIdleCallback`, so no hot path blocks first paint. HP-2 is correctly off the
render path (not awaited in setup), so slow network does not block the hero. No N+1
requests, no request waterfall, no client-side routing.

---

## 3. Sequential async audit

### Verdict: 0 unnecessary sequential async calls in production code

| Candidate                                              | Classification              | Why it must stay sequential                                                                          |
| ------------------------------------------------------ | --------------------------- | ---------------------------------------------------------------------------------------------------- |
| `fetch(url).then(r => r.json()).then(parse)`           | **Data-dependent**          | Body cannot be parsed before the response arrives. Rewriting as `await` changes style, not ordering. |
| `clipboard.writeText(cmd).then(() => setTimeout(...))` | **Single async op + timer** | Not two async operations; the timer is UI feedback, not I/O.                                         |
| `Sentry.init()` → `app.mount()`                        | **Synchronous**             | No promise involved. Sentry is no longer awaited or ordered before mount.                            |
| Tests: repeated `await flushPromises()`                | Test-only                   | Outside production scope.                                                                            |

There are no `await a(); await b()` pairs, no independent requests that could use `Promise.all`, and no lazy imports on the hot path. The only parallelization opportunity would be adding new requests, which is out of scope.

---

## 4. Defects found on the async hot path

| ID  | Defect                                                                                                                                                                                                                                                 | Severity                      | Status    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- | --------- |
| D-1 | Non-OK HTTP responses (GitHub 403 rate limit, 404, 5xx) are parsed as success. `assets` is `undefined`, so the app publishes an empty tag plus fallback URLs with `error=false`.                                                                       | High (silent wrong state)     | **Fixed** |
| D-2 | A failed background refresh sets `error=true` while a valid `release` is still loaded. Buttons switch to the fallback and the error message renders next to valid stats.                                                                               | Medium (conflicting UI state) | **Fixed** |
| D-3 | `fetch` has no timeout or abort signal. If the request never settles, `loading` stays `true` forever and the UI never leaves the loading state.                                                                                                        | Medium (liveness)             | Logged    |
| D-4 | `visibilitychange` listener is registered at module scope with no dedupe/cleanup. Vite HMR re-evaluation can attach duplicates; each fires its own fetch (the `loading` guard reduces but does not remove the duplicate-listener risk).                | Low (dev-only)                | Logged    |
| D-5 | Copy button: each click starts an untracked `setTimeout`. Two quick clicks → the first timer clears `copied` while the second confirmation should still be visible. `writeText` rejection is unhandled and leaves no feedback. Timer survives unmount. | Medium (state conflict)       | Logged    |
| D-6 | `incrementDownload` mutates the same object that a refetch replaces. Optimistic increments are silently lost when a refresh lands, so displayed counts can go down.                                                                                    | Low (data consistency)        | Logged    |

### Fixes applied

- **D-1:** reject non-OK responses before `json()` so the machine enters the error state.
- **D-2:** only set `error` when there is no usable `release`; a failed refresh keeps the last good data and does not flip the UI to fallback.

Both fixes are covered by new unit tests (see §8).

---

## 5. Implicit state machines

### SM-1 — Release service (`src/composables/useLatestRelease.ts`)

The machine is encoded in three module-scope refs (`release`, `loading`, `error`) plus one event source (`visibilitychange`) and one guard (`if (loading) return`).

**Events**

| Event       | Source                             | Guard                                                       |
| ----------- | ---------------------------------- | ----------------------------------------------------------- |
| `USE`       | `useLatestRelease()` call          | `release == null && loading == false`                       |
| `FETCH_OK`  | fetch resolves with 2xx + parse    | —                                                           |
| `FETCH_ERR` | fetch rejects / non-OK (after fix) | —                                                           |
| `VISIBLE`   | `visibilitychange`                 | `document.visibilityState === 'visible' && release != null` |
| `INCREMENT` | download click                     | `release != null`                                           |

**Reachable states (pre-fix)**

| State             | `release` | `loading` | `error` | Stable?              | Entry                      |
| ----------------- | --------- | --------- | ------- | -------------------- | -------------------------- |
| `idle`            | null      | false     | false   | transient            | module init                |
| `loading`         | null      | true      | false   | transient            | `USE`                      |
| `ready`           | set       | false     | false   | **terminal success** | `FETCH_OK`                 |
| `failed`          | null      | false     | true    | **terminal failure** | `FETCH_ERR`                |
| `refreshing`      | set       | true      | false   | transient            | `VISIBLE`                  |
| `refresh-failed`  | set       | false     | true    | stable degraded      | `FETCH_ERR` during refresh |
| `failing`         | null      | true      | true    | 1 microtask          | `.catch` before `.finally` |
| `refresh-failing` | set       | true      | true    | 1 microtask          | `.catch` before `.finally` |

**Transitions (pre-fix)**

```
idle --USE--> loading
loading --FETCH_OK--> ready
loading --FETCH_ERR--> failed
ready --VISIBLE--> refreshing
refreshing --FETCH_OK--> ready
refreshing --FETCH_ERR--> refresh-failed
failed --(no automatic edge)--> failed        # dead end
ready --INCREMENT--> ready                    # data mutation
refresh-failed --VISIBLE--> refreshing
```

**Conflicts**

1. **C1 (fixed):** `refresh-failed` renders fallback URLs _and_ the error banner while `release` still holds valid URLs and stats.
2. **C2 (open):** `failed` has no automatic retry. `VISIBLE` is guarded by `release != null`, so a tab switch cannot recover. Only a remount or full reload retries.
3. **C3 (open):** `loading` / `refreshing` have no timeout. They can be non-terminal forever (D-3).
4. **C4 (open):** `VISIBLE` during `loading`/`refreshing` is silently dropped. If the in-flight request later fails, the dropped refresh opportunity is lost.
5. **C5 (open):** `INCREMENT` mutates the same object `FETCH_OK` replaces → optimistic counts are lost on refresh (D-6).
6. **C6 (fixed):** HTTP 4xx/5xx produced `ready` with empty data instead of `failed`.
7. **C7 (open):** listener lifetime is the module lifetime; no explicit owner or cleanup (D-4).

### SM-2 — Clipboard feedback (`src/components/InstallSection.vue`)

Encoded in one boolean plus an untracked timer.

| State        | `copied`    | Timer   | Entry                |
| ------------ | ----------- | ------- | -------------------- |
| `idle`       | false       | none    | init / after 2 s     |
| `copied`     | true        | pending | `writeText` resolves |
| `copying`    | **missing** | —       | not modeled          |
| `copy-error` | **missing** | —       | not modeled          |

```
idle --CLICK--> (implicit pending) --RESOLVE--> copied --2000ms--> idle
idle --CLICK--> (implicit pending) --REJECT--> idle (unhandled)
```

**Conflicts**

- No `copying` state → double clicks allowed; no pending feedback.
- Each click creates a new timer; the oldest timer wins and clears `copied` early.
- Rejection is unhandled; no error feedback.
- Timer is not cleared on unmount.

### SM-3 — Download telemetry / optimistic counter

Not a formal machine, but an implicit data-consistency protocol:

```
release == null --CLICK--> no-op
release != null --CLICK--> increment(silicon|intel) + total + Sentry breadcrumb + captureMessage
FETCH_OK --> replace whole release (drops optimistic increments)
```

**Conflict:** no reconciliation rule between optimistic clicks and server truth; counts can decrease.

### SM-4 — Tab visibility event source

`document.visibilityState` is an external two-state machine (`hidden` / `visible`). The app subscribes at module scope and never unsubscribes. It is an input to SM-1, not a machine of its own, but it is the only source of background refresh.

### SM-5 — Bootstrap / Sentry lifecycle

`app.mount()` runs first. `scheduleSentry()` queues the SDK load on
`requestIdleCallback` (timer fallback), so the facade has two states — queued and
loaded — and events raised while queued are replayed on load. `initSentry()` never
rejects: a blocked or failed SDK degrades observability only and cannot reach the
render path (BUG-007). No conflict found.

### Static sections

`FeaturesSection`, `HowItWorksSection`, `TheNavbar`, `TheFooter` (except the release badge) have no mutable state and therefore no implicit machine.

---

## 6. Non-terminal states (service machine SM-1)

**Definition used:** a state is **terminal** when it is a stable resting state with no automatic outgoing transition (success or failure). A state is **non-terminal** when it has an outgoing transition or can remain forever without reaching a terminal state.

| State             | Terminal?                              | Can remain forever?                  | Exit edges              | Risk                           |
| ----------------- | -------------------------------------- | ------------------------------------ | ----------------------- | ------------------------------ |
| `idle`            | No                                     | No (first `USE` follows immediately) | `USE`                   | None in practice               |
| `loading`         | No                                     | **Yes (D-3)**                        | `FETCH_OK`, `FETCH_ERR` | Spinner forever if fetch hangs |
| `ready`           | **Yes (success)**                      | Yes (intended)                       | `VISIBLE`, `INCREMENT`  | None                           |
| `failed`          | **Yes (failure)**                      | Yes                                  | none (dead end, C2)     | No recovery without reload     |
| `refreshing`      | No                                     | **Yes (D-3)**                        | `FETCH_OK`, `FETCH_ERR` | Stale data + spinner forever   |
| `refresh-failed`  | Degraded terminal (removed by D-2 fix) | Yes                                  | `VISIBLE`               | Conflicting UI (C1)            |
| `failing`         | No (transient)                         | No                                   | `.finally`              | One-tick inconsistent UI       |
| `refresh-failing` | No (transient)                         | No                                   | `.finally`              | One-tick inconsistent UI       |

**Non-terminal states:** `idle`, `loading`, `refreshing`, `failing`, `refresh-failing` (and `refresh-failed` before the fix).

**Liveness gaps (distinct from non-terminality):**

- `loading` and `refreshing` are non-terminal **and unbounded** because the async operation has no timeout/abort (D-3).
- `failed` is terminal but is a **dead end**: no edge back to `loading`. The service cannot self-heal (C2).

**Post-fix state set:** `refresh-failed` is removed; a failed refresh stays in `ready` (degraded success). `loading`/`refreshing` remain non-terminal and unbounded until D-3 is addressed.

---

## 7. Recommended explicit model (not implemented)

### SM-1

```
type State =
  | { name: 'idle' }
  | { name: 'loading'; controller: AbortController }
  | { name: 'ready'; release: Release; stale: boolean }
  | { name: 'failed'; reason: 'network' | 'http' | 'timeout' }

Events: USE | FETCH_OK(release) | FETCH_ERR(reason) | VISIBLE | INCREMENT(arch)
```

Recommended transitions to add:

1. `failed --USE|VISIBLE--> loading` (retry, fixes C2).
2. `loading|refreshing --TIMEOUT--> failed|ready(stale)` (fixes C3).
3. `ready --VISIBLE--> refreshing` only when `now - lastFetchedAt > TTL` (avoids useless refetches).
4. `INCREMENT` should bump a separate optimistic delta and `FETCH_OK` should merge it, or drop optimistic UI (fixes C5).
5. Own the listener in `onMounted`/`onUnmounted` or keep the singleton with an explicit `dispose()` (fixes C7).

### SM-2

```
States: idle | copying | copied | copy-error
idle --CLICK--> copying
copying --RESOLVE--> copied --TIMEOUT--> idle
copying --REJECT--> copy-error --CLICK|TIMEOUT--> idle
```

Track the timer id; clear it before starting a new one and on unmount.

---

## 8. Verification

| Gate                | Result                           |
| ------------------- | -------------------------------- |
| `npm run test`      | 21/21 pass (19 baseline + 2 new) |
| `npm run typecheck` | pass                             |
| `npm run lint`      | pass                             |

New tests:

- `treats a non-OK HTTP response as an error instead of a successful empty release`
- `keeps the last good release when a background refresh fails`

---

## 9. Out of scope

- Adding XState or another state-machine library.
- Rewriting the composable around an explicit reducer.
- Adding a fetch timeout (D-3) — requires a product decision on the timeout value.
- Fixing the clipboard timer race (D-5) and optimistic counter (D-6) — reported for the explicit-model refactor.
- Changes to CI, release automation, or static markup.
