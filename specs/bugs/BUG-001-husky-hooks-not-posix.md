---
bug_id: BUG-001
status: fixed
severity: high
scope: ci
title: Release workflow red on every push to main — husky hooks are not POSIX
---

# BUG-001 — Release workflow red on every push to main

## Summary

The `Release` GitHub Actions workflow failed on **every** push to `main` since
the guard-git hooks landed (6/6 runs, `42244425072` → `42256401441`). `CI` is
green throughout, so the failure was invisible in the usual gate.

`big-release` computed and tagged the next version, then died. **No version was
ever published** — `v1.6.0` was computed and rolled back on every run.

## Impact

- No release has ever shipped; the latest published release is still `v1.5.3`.
- The failure is silent in the normal loop: `npm run preflight` and the `CI`
  workflow both pass, so a red `Release` run is the only signal.
- A permanently red workflow masks any _future_ genuine release failure.
- On Linux, `.husky/commit-msg` rejected **every** commit, because `[[` is not
  a dash builtin and every `if` guard silently evaluated false.

## Root cause

Three defects. The first two are in `.husky/pre-push`, the third in
`.husky/commit-msg` and was only exposed once the first two were fixed.

### 1. `.husky/pre-push` — bash-only regex is a _parse_ error

The hook used `[[ "$remote_ref" =~ refs/heads/(main|master) ]]`. husky's
`.husky/_/h` shim ends with `sh -e "$s"` and ignores the file's
`#!/usr/bin/env bash` shebang. On Debian/Ubuntu `sh` is dash, which does not
implement `[[`/`=~`; dash parses the whole `while` compound command before
executing it, so the hook aborted with a syntax error on **any** push, not just
the pushes it meant to block.

```
.husky/pre-push: 8: Syntax error: "(" unexpected (expecting "then")
```

### 2. Release workflow — a main-pusher with no exemption

After the parse error is fixed, `big-release`'s git plugin (`pushRefs` in
`internal/plugins/git.go`) pushes tags and then the release commit, because
`tagOnly` is not configured. The guard then correctly blocks
`refs/heads/main`. CONVENTIONS already scopes the rule ("Never commit directly
to `main` outside release scripts"); the Release workflow _is_ the release
script and must set the same `GIT_BIGPOWERS_LAND=1` escape hatch that
`scripts/land-branch.sh` sets.

### 3. `.husky/commit-msg` — bash-only test is a _runtime_ error

This one was invisible to `dash -n`, which accepts `[[` (it parses as a command
name). At runtime dash reports `[[: not found`, the command fails, and every
`if` guard silently takes the false branch — so the hook rejected **every**
commit message, including valid Conventional Commits:

```
.husky/commit-msg: 8: [[: not found
.husky/commit-msg: 15: [[: not found
ERROR: Commit message does not follow Conventional Commits format.
Got: chore(release): update version files to 1.6.0 [skip ci]
```

That message is valid Conventional Commits; big-release's post-tag commit
failed on it, which is the failure visible in run `42256401441`.

## Why it was invisible locally

macOS `/bin/sh` is bash, which implements `[[`/`=~`. Every hook worked on the
developer machine and broke only on the Ubuntu runner:

```console
$ printf 'refs/tags/v1.6.0 a refs/tags/v1.6.0 b\n' | /bin/dash -e .husky/pre-push
.husky/pre-push: 8: Syntax error: "(" unexpected (expecting "then")
```

## Fix

- `.husky/pre-push`: rewrite as POSIX sh — `case "$remote_ref" in` instead of
  `[[ =~ ]]`, `#!/bin/sh`, drop the unused `current_branch` subshell.
- `.github/workflows/release.yml`: set `GIT_BIGPOWERS_LAND: '1'` on the
  `big-release` step.
- `.husky/commit-msg`: rewrite as POSIX sh — `case` for the merge/release
  escape hatch, `grep -Eq` for the Conventional Commits pattern.
- `tests/unit/huskyHooks.test.ts`: regression suite. `dash -n` alone is
  insufficient (see root cause 3), so it also scans executable lines for
  bash-only constructs and exercises both hooks behaviourally through `sh -e`,
  including the exact `chore(release): update version files to 1.6.0 [skip ci]`
  message that failed in CI.

## Verify steps

1. `npx vitest run tests/unit/huskyHooks.test.ts` → 25 passed.
2. Mutation check: restoring the original `commit-msg` makes 11 tests fail.
3. `printf 'chore(release): update version files to 1.6.0 [skip ci]\n' | /bin/dash -e .husky/commit-msg /dev/stdin` → exit 0.
4. `printf 'refs/heads/main a refs/heads/main b\n' | /bin/dash -e .husky/pre-push` → exit 1, guard message.
5. `printf 'refs/tags/v1.0.0 a refs/tags/v1.0.0 b\n' | /bin/dash -e .husky/pre-push` → exit 0.
6. `npm run preflight` → green.
7. Push to `main` → `Release` workflow green and `v1.6.0` published.
