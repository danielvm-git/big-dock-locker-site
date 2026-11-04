# `.github` Templates and big-release Canary Findings

- **Date:** 2026-11-04
- **Scope:** `danielvm-git/.github`, the four `bigbase-canary-*` reference repos, and the `big-release` source at `main`.
- **Question:** Does `.github` now contain the CI/CD template we need, and how do the canaries keep `VERSION` in sync with each release?

---

## 1. `.github` current state

- Latest commit checked: `afe97b4` (2026-10-29), `fix(ci): check commit subjects with --format=%s, not --oneline (#39)`.
- The repo is on template generation **v4.2.0** (commit `2e1bd38`, 2026-07-30).
- There are still **no `ci-cd-*.yml` templates**. The `workflow-templates/` tree contains the split pairs:
  - `test-build-release-{node,python,go,php,static,monorepo,fullstack,swift,pages-*}.yml`
  - `deploy-{node,python,go,php,static,monorepo,fullstack,pages-*}.yml`
  - `codeql*.yml`
- `docs/how-to/migrate-ci-cd/migration-plan.md` (2026-07-24) still supersedes the consolidated `ci-cd-*` plan.
- Conclusion: issue #1 remains stale. The referenced `ci-cd-static.yml` does not exist.

### Static template capabilities and gaps

`workflow-templates/test-build-release-static.yml` (v4.1.1):

| Capability                          | Present? | Detail                                                |
| ----------------------------------- | -------- | ----------------------------------------------------- |
| `release_tool: big-release` input   | Yes      | `big-release release --verbose`                       |
| `release_tool` default              | No       | Defaults to `semantic-release`                        |
| Git identity for the release plugin | No       | Only `GITHUB_TOKEN`; no `GIT_AUTHOR_*` / `git config` |
| `VERSION` file update               | No       | No `versionfile` config; consumers hand-roll a step   |
| Node version                        | No       | Node 22 (this repo uses 24)                           |
| Deploy target                       | No       | BigBase (`bigbase-deploy`), this repo uses Netlify    |
| `persist-credentials`               | Yes      | `true` on the release checkout                        |
| Pinned actions                      | Partial  | SHA-pinned, but `setup-node` at v6.4.0                |

The template is a reusable starting point, not a drop-in replacement for this repo.

---

## 2. Canary reference setup

All four canary repos (`bigbase-canary-{go,node,python,php}`) use the same pattern.

### `.big-release.yml`

```yaml
tagFormat: 'v${version}'
initialVersion: '0.1.0'

plugins:
  - changelog
  - git
  - github
```

The canaries do **not** use the native `versionfile` plugin; they hand-roll a post-release step. big-release has shipped a native plugin since v2.3.0 (issue #62), but its documented top-level `versionFile` key is not wired and the docs put `versionfile` after `git` (see §3 and big-release#74).

### `VERSION` file

Every canary has a root `VERSION` file (`0.4.0`, `0.2.0`, `0.2.1`, `0.3.0`). The app reads it at runtime; for example, the Node canary's `server.js` reads `VERSION` and replaces `{{VERSION}}` in the HTML.

### Post-release workflow step

The canary `test-build-release.yml` adds this after `big-release release --verbose`:

```yaml
- name: Run big-release
  run: big-release release --verbose
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    GIT_AUTHOR_NAME: big-release-bot
    GIT_AUTHOR_EMAIL: big-release-bot@danielvm-git.github.io
    GIT_COMMITTER_NAME: big-release-bot
    GIT_COMMITTER_EMAIL: big-release-bot@danielvm-git.github.io

- name: Update VERSION file
  run: |
    NEW_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
    if [ -n "$NEW_TAG" ]; then
      NEW_VER="${NEW_TAG#v}"
      echo "$NEW_VER" > VERSION
      if ! git diff --quiet VERSION; then
        git config user.name "big-release-bot"
        git config user.email "big-release-bot@danielvm-git.github.io"
        git add VERSION
        git commit -m "chore(release): update VERSION to $NEW_VER [skip ci]"
        git push origin main
      fi
    fi
```

This is the missing piece. The canary commit history confirms it: `chore(release): update VERSION to 0.2.0 [skip ci]` (commit `aadb270`).

### Live demos

The four URLs (`go/node/python/php.bigbase.click`) currently serve the BigBase application shell, not the canary version pages. The reference repos still contain the working pattern; the live URLs are no longer a reliable proof point.

---

## 3. `big-release` source facts (opensrc)

Source: `/Users/danielvm/.opensrc/repos/github.com/danielvm-git/big-release/main`

- `internal/plugins/changelog.go` — `Prepare()` writes `CHANGELOG.md` from `ctx.NextRelease.Notes`.
- `internal/plugins/git.go` — `Prepare()` stages all changes and commits `chore(release): <version> [skip ci]`; `Publish()` creates the tag and pushes commits + tags; `PostPublish()` stages/commits `postTagAssets` after the tag exists.
- `internal/plugins/versionfile.go` — native `versionfile` plugin (`PostPublish`) writes a version file from a Go template.
- `pkg/release/e2e_test.go` (`TestE2E_VersionFileSync`) uses `plugins: [versionfile, git]` and `PluginConfigs["versionfile"]`. The order is intentional: PostPublish runs in plugin order, so `versionfile` must precede `git`.
- Gotcha 1: the documented top-level `versionFile:` key is defined in `algorithm.Config` but never read; only `pluginConfigs.versionfile` is wired (big-release#74).
- Gotcha 2: `docs/how-to/version-file-sync.md` recommends `plugins: [changelog, git, github, versionfile]`, which runs `git`'s PostPublish before the file is written. Use `[changelog, versionfile, git, github]` (big-release#74).

### Consequence for this repo

- `big-release` now works (v1.5.0 was created after D-7/D-8 fixes).
- The checked-in `CHANGELOG.md` is still stale because its headers are mixed `#`/`##`. The changelog plugin looks for the first `## ` header after line 0; this file's first `## ` is at `## [1.0.2]`, so a future changelog update could drop the newer entries above it.
- The canaries' `CHANGELOG.md` uses a consistent `## [version]` format. Their changelog is also behind `VERSION` at the time of writing, so the changelog plugin is not a proven part of the live-version loop.

---

## 4. Recommendation

1. **Do not migrate to the split templates yet.** They default to semantic-release, Node 22, and BigBase; this repo uses big-release, Node 24, and Netlify. Issue #1 should be closed as obsolete or answered with a validated Netlify + big-release template.
2. **Use the native `versionfile` plugin** instead of the canary workflow step. Keep `versionfile` before `git`, configure `pluginConfigs.versionfile`, and set `pluginConfigs.git.postTagAssets: [VERSION]`. This removes the extra post-release commit from the workflow.
3. **Normalize `CHANGELOG.md`** to the canary `# Changelog` + `## [Unreleased]` + `## [version]` format before relying on the changelog plugin. This is a separate, larger change because the existing history has mixed header levels.
4. Optionally pin actions by SHA (the canaries do) and add the canary preflight/conventional-commit checks.

**Applied:** root `VERSION` plus the native plugin configuration in `.big-release.yml`; the workflow no longer contains a manual VERSION step.

---

## 5. Evidence

- `.github` commits: `afe97b4`, `2e1bd38` (v4.2.0), `332d0fa` (v4.0.0).
- Static template: `workflow-templates/test-build-release-static.yml` (v4.1.1), lines 14–18 and 145–153.
- Canary workflow: `bigbase-canary-node/.github/workflows/test-build-release.yml`, release job (`Update VERSION file` step).
- Canary VERSION commit: `aadb270` (`chore(release): update VERSION to 0.2.0 [skip ci]`).
- big-release source: `internal/plugins/versionfile.go`, `internal/plugins/git.go` (`PostPublish`), `pkg/release/e2e_test.go` (`TestE2E_VersionFileSync`).
- big-release follow-up: https://github.com/danielvm-git/big-release/issues/74 (top-level config not wired; docs order).
