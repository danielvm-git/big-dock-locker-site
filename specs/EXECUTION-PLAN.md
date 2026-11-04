# Execution Plan — Close Gaps, Defects, and Open Issues

- **Date:** 2026-11-03
- **Coordinator:** build agent (`opencode`)
- **Inputs:** `specs/HOT-PATH-AND-STATE-MACHINE-AUDIT.md`, GitHub issues #1 and #2
- **Baseline:** 21/21 tests, typecheck, lint, build green on `audit/state-machines-async`
- **Orca:** v1.4.247, runtime ready, repo `e30070d4-0cf0-4c34-b743-d83f13b3fe0c`

---

## 1. Objective

Close every open item from the audit and both open GitHub issues with maximum safe parallelism:

| Source           | Item                                                      | Outcome                                              |
| ---------------- | --------------------------------------------------------- | ---------------------------------------------------- |
| Audit D-3 / C3   | No fetch timeout; `loading`/`refreshing` can hang forever | Bounded loading with abort                           |
| Audit C2         | `failed` is a dead end                                    | Explicit retry transition                            |
| Audit C4         | `VISIBLE` dropped while loading                           | Coalesced/queued refresh or TTL guard                |
| Audit C7 / D-4   | Listener has no owner/cleanup                             | Explicit subscription lifecycle                      |
| Audit C5 / D-6   | Optimistic counts lost on refetch                         | Reconciliation rule                                  |
| Audit SM-1       | Implicit release machine                                  | Explicit reducer + tests                             |
| Audit D-5 / SM-2 | Clipboard timer race, no error state                      | Explicit clipboard machine + timer ownership         |
| Issue #2         | `actions/checkout@v4`                                     | `v7` (and audit `setup-node`)                        |
| Issue #1         | CI/CD template consolidation                              | Migrate only after resolving stale-template conflict |

**Definition of done:** all streams merged into an integration branch; full local gates green; audit document updated to show every item `Fixed` or `Blocked` with evidence; PRs prepared (not pushed without approval).

---

## 2. Workstreams

Three independent streams run in parallel. A fourth integration stream runs after they finish.

| ID  | Worktree            | Branch                              | Scope                                                                                                                                                           | Files (expected)                                                                                                                                     | Depends on          |
| --- | ------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| W1  | `release-machine`   | `feat/release-state-machine`        | SM-1 explicit reducer, D-3 timeout/abort, C2 retry, C4 coalesce, D-4 listener lifecycle, D-6 optimistic reconciliation                                          | `src/composables/useLatestRelease.ts`, `src/machines/releaseMachine.ts` (new), `tests/unit/useLatestRelease.test.ts`, component tests if API changes | Audit D-1/D-2 patch |
| W2  | `clipboard-machine` | `feat/clipboard-state-machine`      | SM-2 explicit states (`idle/copying/copied/copy-error`), D-5 timer ownership, rejection handling, unmount cleanup                                               | `src/components/InstallSection.vue`, `tests/unit/InstallSection.test.ts`                                                                             | none                |
| W3  | `ci-hygiene`        | `chore/ci-hygiene`                  | Issue #2: checkout v7 + setup-node audit. Issue #1: verify template availability, document the big-release vs semantic-release conflict, do not replace blindly | `.github/workflows/ci.yml`, `.github/workflows/release.yml`, `specs/CI-MIGRATION-FINDINGS.md`                                                        | none                |
| W4  | `integration`       | `integration/state-machines-and-ci` | Merge W1–W3, full gates, audit status update, release notes                                                                                                     | all                                                                                                                                                  | W1, W2, W3          |

### Why these are parallel-safe

- W1 and W2 touch disjoint files.
- W3 touches only `.github/` and `specs/`.
- W1 is the only stream that may touch `package.json` (decision: **no new dependency**; pure reducer, not XState).
- W4 is the only stream allowed to resolve cross-stream conflicts.

---

## 3. Orca worktree setup

The main checkout keeps the uncommitted audit + D-1/D-2 fixes. Worktrees branch from `main`; W1 receives the audit patch so it builds on the fixes.

```bash
# Snapshot the current uncommitted work so it can be replayed in W1
git diff > /tmp/big-dock-audit.patch

# W1
orca worktree create --repo id:e30070d4-0cf0-4c34-b743-d83f13b3fe0c \
  --name release-machine --no-parent --branch feat/release-state-machine \
  --base-branch main --setup skip --json

# W2
orca worktree create --repo id:e30070d4-0cf0-4c34-b743-d83f13b3fe0c \
  --name clipboard-machine --no-parent --branch feat/clipboard-state-machine \
  --base-branch main --setup skip --json

# W3
orca worktree create --repo id:e30070d4-0cf0-4c34-b743-d83f13b3fe0c \
  --name ci-hygiene --no-parent --branch chore/ci-hygiene \
  --base-branch main --setup skip --json
```

Bootstrap each worktree:

```bash
ln -s /Users/danielvm/Developer/big-dock-locker-site/node_modules <worktree>/node_modules
# W1 only:
git -C <W1> apply /tmp/big-dock-audit.patch
cp specs/HOT-PATH-AND-STATE-MACHINE-AUDIT.md <W1>/specs/
```

Track with Orca:

```bash
orca worktree set --worktree name:release-machine --workspace-status in-progress \
  --comment "W1: explicit release machine + timeout/retry" --json
orca worktree ps --json
```

---

## 4. Stream contracts

Each worker must:

1. Read `specs/HOT-PATH-AND-STATE-MACHINE-AUDIT.md` (or the copy in its worktree).
2. Use TDD: failing test first, then minimal implementation.
3. Run `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build`.
4. **Not commit, not push, not open PRs.**
5. Return: files changed, test evidence, remaining risks.

### W1 — Release machine

Acceptance criteria:

- Explicit state type: `idle | loading | ready | refreshing | failed` with no impossible combinations.
- `USE` and `VISIBLE` transitions are legal from `failed` (retry).
- `FETCH_ERR` during a refresh keeps the last good release and does not set `error`.
- A timeout aborts the request and transitions to `failed` (or `ready(stale)` when data exists).
- `VISIBLE` during `loading`/`refreshing` is coalesced (no lost refresh).
- `incrementDownload` increments are preserved across `FETCH_OK` or the optimistic UI is removed with a documented decision.
- The `visibilitychange` listener has an explicit owner/cleanup path.
- Existing public API stays compatible where possible; any change is documented.
- Tests cover every transition and the timeout path.

### W2 — Clipboard machine

Acceptance criteria:

- States: `idle`, `copying`, `copied`, `copy-error`.
- `copied` resets after 2 s; a second click cancels the first timer.
- Rejection transitions to `copy-error` and is not an unhandled rejection.
- Timer is cleared on unmount.
- Tests use fake timers and cover double click + rejection.

### W3 — CI hygiene

Acceptance criteria:

- `.github/workflows/ci.yml` and `release.yml` use `actions/checkout@v7` (latest verified: v7.0.1).
- `actions/setup-node` audited; update to latest (v7.1.0) if compatible.
- YAML parses and Prettier passes.
- Issue #1: document that `ci-cd-static.yml` does not exist in `danielvm-git/.github`; the current migration plan uses `test-build-release-static.yml` + `deploy-static.yml`, which are semantic-release-based and conflict with this repo's big-release setup. Do not replace the workflows. Produce `specs/CI-MIGRATION-FINDINGS.md` with the evidence and recommended decision.

---

## 5. Integration and gates

```bash
# W4
git checkout -b integration/state-machines-and-ci main
git merge --no-ff feat/release-state-machine
git merge --no-ff feat/clipboard-state-machine
git merge --no-ff chore/ci-hygiene

npm run test
npm run typecheck
npm run lint
npm run build
npm run test:e2e   # optional: requires Playwright browser
```

Integration exit criteria:

- [ ] All unit tests pass.
- [ ] Typecheck, lint, build pass.
- [ ] No new dependency added.
- [ ] Audit document updated: D-3, D-4, D-5, D-6, C2, C4, C5, C7 marked Fixed or Blocked with evidence.
- [ ] `specs/CI-MIGRATION-FINDINGS.md` written.
- [ ] Worktree comments/status updated in Orca.

---

## 6. Commit / push / issue policy

- Local commits are allowed only if the user authorizes them; the default is to leave diffs uncommitted and report them.
- **No push, no PR, no issue close** without explicit approval.
- Issue #1 must not be closed as fixed while the referenced template is missing.
- Issue #2 can be closed only after the change is merged and CI is green.

---

## 7. Risks and mitigations

| Risk                                                                            | Mitigation                                                                          |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| W1 rewrites `useLatestRelease` and conflicts with the uncommitted D-1/D-2 patch | Apply the patch in W1 before the worker starts; W1 owns the file                    |
| Worktrees lack `node_modules`                                                   | Symlink the main checkout's `node_modules`; no dependency changes expected          |
| Orca worktree setup hooks run `npm install`                                     | `--setup skip`                                                                      |
| Issue #1 template missing / semantic-release conflict                           | W3 documents evidence and stops; do not guess a migration                           |
| Parallel workers both edit `specs/`                                             | W3 owns CI findings; W1/W2 only edit their own code/tests; W4 owns the audit update |
| Worker commits or pushes without approval                                       | Prompt explicitly forbids it; coordinator reviews diffs before integration          |
| `AbortSignal.timeout` unsupported in jsdom                                      | W1 uses a testable abort helper or fake timers; verify in the unit suite            |

---

## 8. Execution order

1. Snapshot audit patch; create W1, W2, W3 worktrees.
2. Bootstrap worktrees.
3. Dispatch W1, W2, W3 in parallel.
4. Track with `orca worktree ps` and per-worktree comments.
5. Collect results; review diffs; run per-stream gates.
6. Create W4; merge streams; run full gates.
7. Update audit + write execution report.
8. Pause at the commit/push/PR gate for explicit approval.

---

## 9. Execution status (2026-11-03)

- W1, W2, W3 complete; per-stream gates green.
- Functional integration into the main working tree complete.
- Full gates: 47/47 unit tests, 4/4 Playwright E2E, typecheck, lint, build.
- Orca worktrees are `in-review`.
- Issue #2 code fixed; issue #1 documented as externally blocked.
- No commit, push, PR, or issue mutation performed. See `specs/EXECUTION-REPORT.md`.
