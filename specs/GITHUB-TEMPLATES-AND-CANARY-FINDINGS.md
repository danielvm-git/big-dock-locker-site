# `.github` Templates and big-release Canary Findings

- **Date:** 2026-11-04
- **Scope:** `danielvm-git/.github`, the four `bigbase-canary-*` reference repos, and the `big-release` source at `main`.
- **Question:** Does `.github` now contain the CI/CD template we need, and how do the canaries keep `VERSION` in sync with each release?
- **Update 2026-11-04:** `.github#40`, `big-release#74`, and `big-release#75` are closed. The template is production-ready for big-release (v4.2.1), and big-release v2.8.1 inserts `versionfile` before `git`, so the top-level `versionFile` form is now safe. This repo uses that form.

---

## 1. `.github` current state

- Latest commit checked: `b48b6e0` (2026-11-04), Godot template + v4.4.0.
- The static template is now **v4.2.1** (`workflow-templates/test-build-release-static.yml`); the template changelog is at **v4.4.0**.
- Issue `.github#40` was resolved in PR #41 (`0767cad`): big-release is the default `release_tool`, git identity env vars are present, the post-release `VERSION` step is included, `node_version` defaults to 24, actions are pinned to `checkout@v7.0.1` / `setup-node@v7.1.0`, and the `CHANGELOG.md` header contract is documented.
- There are still **no `ci-cd-*.yml` templates**. The `workflow-templates/` tree contains the split pairs:
  - `test-build-release-{node,python,go,php,static,monorepo,fullstack,swift,pages-*}.yml`
  - `deploy-{node,python,go,php,static,monorepo,fullstack,pages-*}.yml`
  - `codeql*.yml`
- `docs/how-to/migrate-ci-cd/migration-plan.md` (2026-07-24) still supersedes the consolidated `ci-cd-*` plan.
- Conclusion: issue #1 remains stale. The referenced `ci-cd-static.yml` does not exist.

### Static template capabilities and gaps

`workflow-templates/test-build-release-static.yml` (v4.2.1):

| Capability                          | Present? | Detail                                                         |
| ----------------------------------- | -------- | -------------------------------------------------------------- |
| `release_tool: big-release` input   | Yes      | `big-release release --verbose`                                |
| `release_tool` default              | Yes      | Defaults to `big-release`                                      |
| Git identity for the release plugin | Yes      | `GIT_AUTHOR_*` / `GIT_COMMITTER_*` env vars                    |
| `VERSION` file update               | Yes      | Manual post-release step (not the native `versionfile` plugin) |
| Node version                        | Yes      | `node_version` input, default `24`                             |
| Deploy target                       | No       | BigBase (`bigbase-deploy`), this repo uses Netlify             |
| `persist-credentials`               | Yes      | `true` on the release checkout                                 |
| Pinned actions                      | Yes      | `checkout@v7.0.1`, `setup-node@v7.1.0`                         |

The template is now production-ready for big-release, but it remains BigBase-centric. This repo keeps its Netlify workflows.

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
- **Fixed in v2.7.3 (#74):** the top-level `versionFile:` block is wired. `effectivePlugins()` auto-adds `versionfile`, and `versionFileConfig()` merges the top-level values with `pluginConfigs.versionfile` (explicit entries win).
- **Docs fixed:** `docs/how-to/version-file-sync.md` now says `versionfile` must precede `git` when listed manually and documents the top-level form.
- **Fixed in v2.8.1 (#75):** `effectivePlugins()` now inserts `versionfile` immediately before `git` when the top-level block is used, so PostPublish writes the file before the git plugin commits `postTagAssets`. Regression tests cover the effective order and a git-stub PostPublish observing the file.

### Consequence for this repo

- `big-release` now works (v1.5.0 was created after D-7/D-8 fixes).
- The checked-in `CHANGELOG.md` is still stale because its headers are mixed `#`/`##`. The changelog plugin looks for the first `## ` header after line 0; this file's first `## ` is at `## [1.0.2]`, so a future changelog update could drop the newer entries above it.
- The canaries' `CHANGELOG.md` uses a consistent `## [version]` format. Their changelog is also behind `VERSION` at the time of writing, so the changelog plugin is not a proven part of the live-version loop.

---

## 4. Recommendation

1. **Template migration is now optional.** `test-build-release-static.yml` v4.2.1 defaults to big-release, Node 24, git identity, and the VERSION step. It is still BigBase-centric; this repo should only migrate if it also switches its deploy target away from Netlify.
2. **Use the top-level `versionFile` form** now that v2.8.1 inserts `versionfile` before `git`: `plugins: [changelog, git, github]`, `versionFile: {path: VERSION, template: "{{.Version}}"}`, and `pluginConfigs.git.postTagAssets: [VERSION]`. The explicit `plugins: [changelog, versionfile, git, github]` form still works.
3. **Normalize `CHANGELOG.md`** to the canary `# Changelog` + `## [Unreleased]` + `## [version]` format before relying on the changelog plugin. This is a separate, larger change because the existing history has mixed header levels.
4. Optionally pin actions by SHA (the canaries do) and add the canary preflight/conventional-commit checks.

**Applied:** root `VERSION` plus the top-level `versionFile` configuration in `.big-release.yml`; the workflow has no manual VERSION step. Release v1.5.2 confirmed the native path writes and commits `VERSION`.

---

## 5. Evidence

- `.github` commits: `b48b6e0` (v4.4.0, Godot), `0767cad` (#41, static template v4.2.1), `2e1bd38` (v4.2.0).
- Static template: `workflow-templates/test-build-release-static.yml` (v4.2.1), release job.
- Canary workflow: `bigbase-canary-node/.github/workflows/test-build-release.yml`, release job (`Update VERSION file` step).
- Canary VERSION commit: `aadb270` (`chore(release): update VERSION to 0.2.0 [skip ci]`).
- big-release source: `internal/plugins/versionfile.go`, `internal/plugins/git.go` (`PostPublish`), `pkg/release/release.go` (`effectivePlugins`, `versionFileConfig`), `pkg/release/e2e_test.go` (`TestE2E_VersionFileSync`).
- big-release releases: v2.7.3 (`2d05b9e`, top-level config wired), v2.8.1 (`892f05a`, `versionfile` inserted before `git`), v2.8.1 current.
- Follow-ups: https://github.com/danielvm-git/big-release/issues/74 (fixed), https://github.com/danielvm-git/big-release/issues/75 (fixed in v2.8.1).
