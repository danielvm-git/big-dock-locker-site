# Historical Gaps — Disposition Record

- **Date:** 2026-11-06
- **Scope:** every red workflow run in the repository's history, plus every
  documented open item in `specs/`, triaged to a disposition.
- **Method:** `gh run list --limit 100` for the full run history; `gh api` to
  re-verify the external claims in issue #1; `git log` for commit evidence.

---

## 1. Workflow run history

50 runs total: `CI` 25/25 success, `Release` 17 success / 8 failure.

### 1.1 Release failures — resolved

| Run           | Date       | Cause                                  | Disposition                                                                                      |
| ------------- | ---------- | -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `42244425072` | 2026-11-06 | `.husky/pre-push` dash parse error     | Fixed — BUG-001 (`e18b3ab`)                                                                      |
| `42244784639` | 2026-11-06 | same                                   | Fixed — BUG-001                                                                                  |
| `42244975647` | 2026-11-06 | same                                   | Fixed — BUG-001                                                                                  |
| `42252746137` | 2026-11-06 | same                                   | Fixed — BUG-001                                                                                  |
| `42253244760` | 2026-11-06 | same                                   | Fixed — BUG-001                                                                                  |
| `42256401441` | 2026-11-06 | `.husky/commit-msg` dash runtime error | Fixed — BUG-001 (`44c2e27`)                                                                      |
| `41868122057` | 2026-11-04 | `Committer identity unknown`           | Already fixed before this audit — PR #5 added the _Configure git identity_ step to `release.yml` |

### 1.2 Release failure — unretrievable, superseded

| Run           | Date       | Cause   | Disposition                                                                                                                                                                                                                                              |
| ------------- | ---------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `30809720751` | 2026-08-03 | Unknown | **Accepted as unretrievable.** GitHub returned `HTTP 410` for the log; the run predates the big-release pipeline (commit `ci: harden release workflow and add CI`) and is superseded by 17 subsequent successful releases. No action possible or needed. |

### 1.3 Verification

`Release` is green on the two most recent pushes (`42257002379`,
`42257318429`) and `v1.6.0` is published — the first release after six
consecutive failures. All remaining red runs predate the fix.

---

## 2. Documented open items

### 2.1 Issue #1 — "CI/CD Template Consolidation" — CLOSED as obsolete

The issue instructs copying `ci-cd-static.yml` and deleting `release.yml`.
Re-verified on 2026-11-06:

- `GET /repos/danielvm-git/.github/contents/.github/workflows/ci-cd-static.yml` → **404**
- `ci-cd-*.yml` files present in the template repo → **0**
- The split pair does exist: `test-build-release-static.yml`, `deploy-static.yml`
- The consolidated plan was superseded on 2026-07-24 by
  `docs/how-to/migrate-ci-cd/migration-plan.md`; issue #1 (2026-07-12) predates
  it and was never updated.
- Following it would regress release automation: the template defaults to
  semantic-release, this repo uses big-release.

Disposition: **closed as obsolete**, with the corrected guidance recorded on
the issue. Details in `specs/CI-MIGRATION-FINDINGS.md`.

### 2.2 Orca worktree cleanup — already done

`EXECUTION-REPORT.md` §7 listed three worktrees (`release-machine`,
`clipboard-machine`, `ci-hygiene`) for manual removal. `git worktree list`
shows only the primary checkout; `orca worktree list` shows no such worktrees.
Disposition: **no action — already cleaned up.**

### 2.3 `CHANGELOG.md` drift — fixed (BUG-005)

`VERSION` was `1.6.0` while `CHANGELOG.md` stopped at `1.0.0`. Root cause: the
big-release changelog plugin writes `CHANGELOG.md` during `Prepare()`, but
`.big-release.yml` listed only `VERSION` under `git.postTagAssets`, so the
generated file was written into the runner workspace and discarded. Every
release commit touched `VERSION` alone (verified on `b19fb56`).

Fixed: `CHANGELOG.md` added to `postTagAssets`, and the missing `1.5.0`–`1.6.0`
entries backfilled from the published GitHub releases (no invented content).

**Second defect found once the first was fixed.** The v1.6.1 release commit did
include `CHANGELOG.md` — the fix works — but the plugin appended the new
section at the **bottom** of the file, producing out-of-order history. Root
cause: `insertReleaseSection` (`internal/plugins/changelog.go`) inserts after
the `<!-- big-release managed -->` marker, or before `## [Unreleased]`, and
otherwise falls through to appending. The checked-in file had neither, and
starts with an H1, so it hit the append branch.

Fixed: `CHANGELOG.md` now carries the canonical header
(`# Changelog` → `## [Unreleased]` → `<!-- big-release managed -->`) that
big-release expects, and the misplaced `1.6.1` section was moved under the
marker. Future releases insert newest-first without further intervention.

**Known cosmetic artefact (left in place deliberately):** the file contains two
`1.0.0` sections. The one dated 2026-08-03 duplicates the v1.5.0 content (same
Sentry commits) and was mislabelled by the semantic-release setup that preceded
big-release. It is retained rather than deleted, because removing historical
changelog content is a provenance decision, not a defect fix.

---

## 3. Gaps found during this audit (not previously filed)

| ID      | Gap                                                                                                                                                                                                                                                                                                         | Disposition                         |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| BUG-002 | `execution-status.yaml` reported `e03s01`/`e03s02` as `pending` while `release-plan.yaml`, `epic.yaml` and the code all said done; e03 capsule was never archived                                                                                                                                           | Fixed                               |
| BUG-003 | `e03s02` is "Playwright E2E **and CI Preflight Wiring**" but no workflow ran the E2E suite — 4 browser tests had no gate                                                                                                                                                                                    | Fixed — `e2e` job added to `ci.yml` |
| BUG-004 | `land-branch.sh` used `git branch -d` after a squash merge, which always refuses; every landing warned and left a stale branch                                                                                                                                                                              | Fixed — `git branch -D`             |
| BUG-005 | `CHANGELOG.md` frozen at `1.0.0`                                                                                                                                                                                                                                                                            | Fixed — see 2.3                     |
| BUG-006 | `trace-stories.py` read story status from `development_status` instead of `stories`, so every story resolved to `backlog` and `--strict` skipped all of them — the traceability gate checked nothing. Archiving e03 then exposed a second defect: archived capsules were not resolved, dropping all stories | Fixed                               |

### 3.1 BUG-006 detail — the gate was vacuous

Two independent defects, both required for a meaningful gate:

1. `dev_status = exec_status.get("development_status", {})` — wrong key. The
   `development_status` block holds phase metadata; story statuses live under
   `stories:`. Every story therefore resolved to `"backlog"`, and
   `_STRICT_UNIMPLEMENTED_STATUSES` contains `backlog`, so every story was
   skipped by the coverage check.
2. `_MIN_STORY_BASELINE` was lowered to `1` in this repo (upstream bigpowers
   uses `50`). Combined with (1), `--strict` passed on a matrix containing no
   verifiable stories.

Archiving the e03 capsule surfaced both: `capsule_dir` in `release-plan.yaml`
keeps the pre-archive path, so archived epics resolved to nothing and the story
count fell to `0`.

Fixed: status read from `stories:`, archive fallback added for
`specs/epics/archive/<name>/epic.yaml`, baseline raised to the real story count
(6). `--strict` now reports 6 stories, 0 dark, and exits 0.

**Upstream note:** `danielvm-git/bigpowers` `scripts/lib/trace-stories.py` has
the same wrong-key defect (masked by its `50` baseline). This repo's copy is
vendored; the fix here should be ported upstream.

### 3.2 Known non-defect

`trace-stories.sh` reports 6 "stale tags" — one per completed story. That is the
tool's upstream definition ("story done, tag still in code"). This project keeps
`// story: <id>` markers as durable provenance and declares them in each
`epic.yaml` (`tags:`), so the tags are intentional. The heuristic is upstream
design and was left unchanged.

---

## 4. Conclusion

Every historical red run has a disposition: 7 fixed, 1 unretrievable and
superseded. Every documented open item is closed. Six new defects found during
the audit are fixed with regression coverage.
