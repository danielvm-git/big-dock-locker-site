---
bug_id: BUG-009
status: open
severity: high
scope: tooling
title: trace-stories --strict is vacuous upstream — wrong status key, no archive fallback, magic baseline
issue: 15
---

# BUG-009 — `trace-stories --strict` is vacuous upstream

## Summary

BUG-006 fixed the vacuous traceability gate in this repo, but the script is
**vendored** from `danielvm-git/bigpowers`. The next skill sync silently
reintroduces the defect, so the fix has to land upstream.

Confirmed by `diff` at intake — the only differences between this repo's copy
and `bigpowers/scripts/lib/trace-stories.py` are exactly the three BUG-006
changes plus the baseline override.

## Root cause (upstream, identical to the BUG-006 defect)

1. `dev_status = exec_status.get("development_status", {})` reads phase
   metadata instead of story status. `stories:` holds id → dict, so
   `dev_status.get(sid)` is always `None` and every story resolves to
   `"backlog"`.
2. `_STRICT_UNIMPLEMENTED_STATUSES` contains `"backlog"`, so `--strict` skips
   every story: it reports success while verifying nothing.
3. `_MIN_STORY_BASELINE = 50` masks the vacuity — upstream has enough declared
   stories to clear the floor, so the empty matrix still looks legitimate.
4. No archive fallback: `land-branch.sh` moves completed capsules to
   `specs/epics/archive/` while `release-plan.yaml` keeps the original
   `capsule_dir`, so archived epics drop their stories.

## Fix approach

Upstream (`danielvm-git/bigpowers`):

1. Read story status from `stories:` through a `story_status(sid)` helper that
   tolerates dict and string shapes.
2. Resolve archived capsules under `specs/epics/archive/`.
3. Replace the magic `_MIN_STORY_BASELINE` with a floor **derived from
   `release-plan.yaml`**: every story declared in the release plan must appear
   in the matrix. A hardcoded constant can be lowered (this repo lowered it to
   `1`); a derived floor cannot hide a degenerate matrix.
4. `tests/test_trace_stories.py` — pytest regression test built on a fixture
   repo: a story marked `done` under `stories:` (must not resolve to backlog)
   and a P0 story with no code links (must make `--strict` exit non-zero). The
   test fails against the old wrong-key read.

This repo:

5. Re-vendor the fixed script, drop the local `MIN_STORY_BASELINE` env override,
   and confirm `bash scripts/trace-stories.sh --strict` still reports 6 stories,
   0 dark, exit 0.

## Acceptance criteria

- [ ] Upstream reads story status from `stories:`
- [ ] Upstream resolves archived capsules
- [ ] Upstream has a regression test that fails with the old wrong-key read
- [ ] `_MIN_STORY_BASELINE` is not a magic number that can mask vacuity
- [ ] This repo re-syncs and `bash scripts/trace-stories.sh --strict` still exits 0 with 6 stories

## Verify

```bash
# upstream
cd ../bigpowers && python3 -m pytest tests/test_trace_stories.py -q
# here
bash scripts/trace-stories.sh --strict
```
