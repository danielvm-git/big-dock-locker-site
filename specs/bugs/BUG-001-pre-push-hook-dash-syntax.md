---
bug_id: BUG-001
status: open
severity: high
scope: ci
title: Release workflow red on every push to main — pre-push hook is bash-only
---

# BUG-001 — Release workflow red on every push to main

## Summary

The `Release` GitHub Actions workflow has failed on **every** push to `main`
since the guard-git hooks landed (5/5 runs, `42244425072` → `42253244760`).
`CI` is green throughout, so the failure was invisible in the usual gate.

`big-release` computes and tags the next version, then dies pushing to the
remote. No release has ever been published.

## Impact

- No version has ever been released; `v1.6.0` was computed and rolled back each
  time.
- The failure is silent in the normal loop: `npm run preflight` and the `CI`
  workflow both pass, so a red `Release` run is the only signal.
- A permanently red workflow masks any _future_ genuine release failure.

## Reproduction

The exact stderr from CI:

```
plugin "git" publish failed: push failed, local tag v1.6.0 removed:
failed to push tags: push failed (unknown): exit status 1:
.husky/pre-push: 8: Syntax error: "(" unexpected (expecting "then")
error: failed to push some refs to 'https://github.com/danielvm-git/big-dock-locker-site'
```

Locally (macOS), `git push` succeeds because `/bin/sh` is bash. The defect is
shell-dependent, which is why it never appeared during development:

```console
$ printf 'refs/tags/v1.6.0 a refs/tags/v1.6.0 b\n' | /bin/dash -e .husky/pre-push
.husky/pre-push: 8: Syntax error: "(" unexpected (expecting "then")
$ echo $?
2
```

## Root cause

Two independent defects that must both be fixed:

1. **`.husky/pre-push` was not POSIX.** It used `[[ "$remote_ref" =~ refs/heads/(main|master) ]]`.
   husky's `.husky/_/h` shim ends with `sh -e "$s"` — it ignores the file's
   `#!/usr/bin/env bash` shebang. On Debian/Ubuntu `sh` is dash, which does not
   implement `[[`/`=~`; dash parses the whole `while` compound command before
   executing it, so the hook aborts with a parse error on **any** push, not
   only on pushes it would have blocked.

2. **The Release workflow is a main-pusher but was not exempted.** After the
   parse error is fixed, `big-release`'s git plugin (`internal/plugins/git.go`
   `pushRefs`) pushes tags first and then `git push origin` for the release
   commit, because `tagOnly` is not configured. The guard correctly blocks that
   push to `refs/heads/main`, so the release would still fail — now with the
   intended guard message instead of a syntax error. CONVENTIONS already
   scopes the rule ("Never commit directly to `main` outside release scripts");
   the Release workflow _is_ the release script and must set the same
   `GIT_BIGPOWERS_LAND=1` escape hatch that `scripts/land-branch.sh` sets.

## Fix

- Rewrite `.husky/pre-push` as POSIX sh: `case "$remote_ref" in` instead of
  `[[ =~ ]]`, and `#!/bin/sh`. Drop the unused `current_branch` subshell.
- Set `GIT_BIGPOWERS_LAND: '1'` on the `big-release` step in
  `.github/workflows/release.yml`.
- Regression test `tests/unit/huskyHooks.test.ts` parses every hook with dash
  and exercises the guard's allow/block/exempt matrix through `sh -e`, so a
  bash-ism can never reach CI again.

## Verify steps

1. `npx vitest run tests/unit/huskyHooks.test.ts` → 11 passed.
2. `printf 'refs/heads/main a refs/heads/main b\n' | /bin/dash -e .husky/pre-push` → exit 1, guard message.
3. `printf 'refs/tags/v1.0.0 a refs/tags/v1.0.0 b\n' | /bin/dash -e .husky/pre-push` → exit 0.
4. `npm run preflight` → green.
5. Push to `main` → `Release` workflow green and a tag published.
