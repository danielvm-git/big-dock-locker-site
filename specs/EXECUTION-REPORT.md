# Execution Report — Gaps, Defects, and Open Issues

- **Date:** 2026-11-03
- **Coordinator:** build agent (`opencode`)
- **Plan:** `specs/EXECUTION-PLAN.md`
- **Audit:** `specs/HOT-PATH-AND-STATE-MACHINE-AUDIT.md`
- **Integrated working tree:** `/Users/danielvm/Developer/big-dock-locker-site` (`audit/state-machines-async`)
- **Result:** 47/47 unit tests, typecheck, lint, build green. No commit/push/PR performed.

---

## 1. Status summary

| Item                                              | Source    | Status                     | Evidence                                                                                                                                          |
| ------------------------------------------------- | --------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-1 non-OK HTTP treated as success                | Audit     | **Fixed**                  | `useLatestRelease.ts` rejects `!response.ok`; test `treats a non-OK HTTP response...`                                                             |
| D-2 refresh failure poisons usable data           | Audit     | **Fixed**                  | Reducer keeps `ready` on refresh error; test `keeps the last good release when a background refresh fails`                                        |
| D-3 no fetch timeout / unbounded loading          | Audit     | **Fixed**                  | `AbortController` + `setTimeout` (10 s default); tests for initial-load and refresh timeout                                                       |
| D-4 duplicate visibility listener / no cleanup    | Audit     | **Fixed**                  | `listenerAttached` guard + `dispose()` + `import.meta.hot.dispose`; test `registers the visibilitychange listener once and removes it on dispose` |
| D-5 clipboard timer race / unhandled rejection    | Audit     | **Fixed**                  | Explicit `idle/copying/copied/copy-error`; timer cleared on new click and unmount; rejection caught; 6 new tests                                  |
| D-6 optimistic increments lost on refetch         | Audit     | **Fixed**                  | Pending delta reconciled into server counts; test `keeps an optimistic increment when a refetch lands`                                            |
| D-7 `big-release` invoked without subcommand      | Execution | **Fixed**                  | Workflow ran `big-release`, which prints help and exits 0 (no release). Now runs `big-release release`                                            |
| D-8 missing git committer identity in release job | Execution | **Fixed**                  | `big-release release` failed at the git plugin with `Committer identity unknown`; workflow now configures `github-actions[bot]` before running    |
| C2 `failed` has no retry                          | Audit     | **Fixed**                  | `retry()` + `VISIBLE` from `failed` + new-consumer retry; tests for all three                                                                     |
| C3 unbounded `loading`/`refreshing`               | Audit     | **Fixed**                  | Same timeout/abort as D-3                                                                                                                         |
| C4 `VISIBLE` dropped while loading                | Audit     | **Fixed**                  | `queued` flag in reducer + deferred fetch; test `coalesces visibilitychange during an in-flight load...`                                          |
| C5 optimistic/server reconciliation               | Audit     | **Fixed**                  | `reconcile()` + monotonic clamp; reducer tests                                                                                                    |
| C7 listener lifetime                              | Audit     | **Fixed**                  | Same as D-4                                                                                                                                       |
| SM-1 implicit release machine                     | Audit     | **Fixed**                  | `src/machines/releaseMachine.ts` pure reducer + `useLatestRelease.ts` service wrapper                                                             |
| SM-2 implicit clipboard machine                   | Audit     | **Fixed**                  | `InstallSection.vue` explicit state union                                                                                                         |
| Issue #2 actions outdated                         | GitHub #2 | **Code fixed, not closed** | `checkout@v7`, `setup-node@v7` in both workflows; YAML + lint pass                                                                                |
| Issue #1 CI/CD consolidation                      | GitHub #1 | **Blocked (external)**     | `ci-cd-static.yml` 404; split templates exist but are semantic-release/Netlify-conflicting; see `specs/CI-MIGRATION-FINDINGS.md`                  |

---

## 2. Workstream results

### W1 — Release state machine

- Worktree: `/Users/danielvm/orca/workspaces/big-dock-locker-site/release-machine`
- Branch: `feat/release-state-machine`
- Files:
  - `src/machines/releaseMachine.ts` (new, pure reducer)
  - `src/composables/useLatestRelease.ts` (service wrapper)
  - `tests/unit/releaseMachine.test.ts` (new, 12 tests)
  - `tests/unit/useLatestRelease.test.ts` (17 tests)
- Gates: 41/41 tests, typecheck, lint, build green.

### W2 — Clipboard state machine

- Worktree: `/Users/danielvm/orca/workspaces/big-dock-locker-site/clipboard-machine`
- Branch: `feat/clipboard-state-machine`
- Files:
  - `src/components/InstallSection.vue`
  - `tests/unit/InstallSection.test.ts` (7 tests)
- Gates: 25/25 tests, typecheck, lint, build green.

### W3 — CI hygiene

- Worktree: `/Users/danielvm/orca/workspaces/big-dock-locker-site/ci-hygiene`
- Branch: `chore/ci-hygiene`
- Files:
  - `.github/workflows/ci.yml` — `checkout@v7`, `setup-node@v7`
  - `.github/workflows/release.yml` — `checkout@v7`, `setup-node@v7`
  - `specs/CI-MIGRATION-FINDINGS.md` (new)
- Gates: Prettier clean, YAML parse OK for both workflows.

### W4 — Integration

Because commits/pushes were not authorized, integration was performed as a **functional integration**: the three worktree diffs were copied into the main working tree, then the full gate stack was run. The per-stream branches/worktrees remain intact for later commits and PRs.

### D-7 — Release workflow was a no-op

Verification of the post-merge Release run exposed a latent defect: `.github/workflows/release.yml` ran `big-release` with no subcommand. The binary prints its help text and exits 0, so the job reported success without creating a tag or GitHub Release. The fix is `big-release release`.

A second post-fix run exposed D-8: the git plugin could not create a tag because the runner had no committer identity (`fatal: empty ident name`). The workflow now configures `github-actions[bot]` before invoking big-release. Both fixes are tracked in follow-up branches `fix/big-release-invocation` and `fix/big-release-git-identity`.

---

## 3. Integration gate evidence

```text
npm run test      → 6 files, 47 tests passed
npm run typecheck → vue-tsc -b (no output = pass)
npm run lint      → All matched files use Prettier code style!
npm run build     → 351 modules transformed, built successfully
npm run test:e2e  → 4/4 Playwright tests passed
```

Bundle after the change: `index-*.js` 347.42 kB (gzip 117.39 kB); no new dependency.

---

## 4. Orca worktrees

| Worktree            | Branch                         | Orca status | Comment                                                           |
| ------------------- | ------------------------------ | ----------- | ----------------------------------------------------------------- |
| `release-machine`   | `feat/release-state-machine`   | `in-review` | W1 complete: 41 tests, gates green; awaiting integration          |
| `clipboard-machine` | `feat/clipboard-state-machine` | `in-review` | W2 complete: 25 tests, gates green; awaiting integration          |
| `ci-hygiene`        | `chore/ci-hygiene`             | `in-review` | W3 complete: actions v7 + issue #1 findings; awaiting integration |

`node_modules` in each worktree is a symlink to the main checkout; no dependency changes were made.

---

## 5. Open items and blockers

### Issue #2 — actions update

Code is ready in the integrated tree. Closing the issue requires a commit, push, and green CI; those steps are gated on explicit user approval.

### Issue #1 — CI/CD template consolidation

Blocked externally, not by this repo:

- `ci-cd-static.yml` returns 404 in `danielvm-git/.github`.
- The current migration plan (2026-07-24) supersedes the consolidated `ci-cd-*.yml` design.
- The live static pair (`test-build-release-static.yml` + `deploy-static.yml`) supports `release_tool: big-release` as an input but defaults to semantic-release.
- The deploy template targets BigBase; this repo deploys to Netlify.
- Node 22 vs 24, `workflow_call` vs `workflow_run`, secret names, and `big-release` vs `big-release release --verbose` all differ.

Recommended resolution: ask the maintainer to close #1 as obsolete or publish a validated Netlify + big-release static template. Do not delete `ci.yml`/`release.yml` before a replacement produces a tag and release on a scratch branch.

### Commit / push / PR gate

No commit, push, PR, or issue mutation was performed. The integrated diff is uncommitted in the main worktree. The per-stream branches hold the same changes if the user prefers three separate commits/PRs.

---

## 6. Trade-offs / risks

| Risk                              | Detail                                                                                               | Mitigation                                                                    |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Monotonic download counts         | `reconcile()` clamps visible counts so they never decrease; a genuine server-side decrease is hidden | Documented; if server truth must win, remove the clamp in `releaseMachine.ts` |
| Module-level timeout config       | `useLatestRelease({ timeoutMs })` sets a module singleton; the last caller wins                      | Set it once at the first call, or convert to per-fetch option later           |
| `copy-error` persistence          | Error state stays until the next click                                                               | Acceptable; add a reset timer if desired                                      |
| Worktree symlinked `node_modules` | Fast bootstrap, but a future `npm install` in a worktree writes through to the main checkout         | Remove the symlink before installing new deps                                 |
| Issue #1 migration                | A naive template copy would regress releases/deploy                                                  | Findings doc + checklist; no migration performed                              |

---

## 7. Next actions (need approval)

1. Commit the integrated tree (or the three worktree branches) with Conventional Commits.
2. Push and open PRs; close #2 after CI is green.
3. Comment on #1 with the findings and request a maintainer decision.

Playwright E2E was already run: 4/4 passed.
