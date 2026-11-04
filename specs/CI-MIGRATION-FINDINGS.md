# CI Migration Findings — Issue #1 vs. Issue #2

- **Date:** 2026-11-03
- **Worktree:** `ci-hygiene` (`chore/ci-hygiene`)
- **Scope:** read-only investigation of GitHub issue #1 and `danielvm-git/.github`; no workflow migration performed
- **Evidence gathered:** 2026-11-03 via GitHub REST API and `raw.githubusercontent.com` (read-only; no issues or PRs were modified)

---

## 1. Issue #1 summary and the stale claim

**Issue #1 — "CI/CD Template Consolidation — Action Required"** (opened 2026-07-12, state `open`).

The issue claims:

1. The `.github` template repo was redesigned from **16 separate workflow templates to 9 unified `ci-cd-*.yml` pipelines**.
2. Each pipeline is a 3-stage `ci → verify → deploy` workflow.
3. A `ci-cd-static.yml` template exists for static sites (Astro, Vue, React) and deploys to BigBase.
4. The migration is: copy `ci-cd-static.yml` to `.github/workflows/ci-cd.yml`, set `APP_TYPE` and `SITE_URL`, **remove `ci.yml`, `release.yml`, `deploy.yml`**, then push.
5. Migration is requested within two weeks; old templates are to be removed afterwards.

### The exact claim that is stale

> "Every `ci-cd-*.yml` template now follows a 3-stage pipeline" and "Copy template:
> `cp ~/Developer/.github/workflow-templates/ci-cd-<language>.yml .github/workflows/ci-cd.yml`"

The `ci-cd-*.yml` template family no longer exists in `danielvm-git/.github`, and the referenced `ci-cd-static.yml` returns HTTP 404. The "remove `release.yml`" instruction also conflicts with this repository's current release architecture (big-release), so the migration as written would regress release automation.

---

## 2. Evidence

### 2.1 `ci-cd-static.yml` does not exist (404)

```
GET https://api.github.com/repos/danielvm-git/.github/contents/.github/workflows/ci-cd-static.yml
→ HTTP 404
```

Same result is expected for every sibling `ci-cd-node.yml`, `ci-cd-python.yml`, etc.: **the workflows directory contains zero `ci-cd-*.yml` files** (24 entries, listed below).

### 2.2 The template repo now ships split pairs

`GET /repos/danielvm-git/.github/contents/.github/workflows` returned 24 files:

```
ci.yml
codeql-javascript.yml
codeql.yml
deploy-fullstack.yml
deploy-go.yml
deploy-monorepo.yml
deploy-node.yml
deploy-pages-mkdocs.yml
deploy-pages-starlight.yml
deploy-php.yml
deploy-python.yml
deploy-static.yml
template-drift-audit.yml
test-build-release-fullstack.yml
test-build-release-go.yml
test-build-release-monorepo.yml
test-build-release-node.yml
test-build-release-pages-mkdocs.yml
test-build-release-pages-starlight.yml
test-build-release-php.yml
test-build-release-python.yml
test-build-release-static.yml
test-build-release-swift.yml
test-build-release.yml
```

The static stack pair is present and retrievable:

| File                                              | HTTP | Version                   |
| ------------------------------------------------- | ---- | ------------------------- |
| `.github/workflows/test-build-release-static.yml` | 200  | `4.1.1` (per file header) |
| `.github/workflows/deploy-static.yml`             | 200  | `4.0.0` (per file header) |

### 2.3 The current migration plan supersedes the consolidated plan

`docs/how-to/migrate-ci-cd/migration-plan.md` (HTTP 200) is dated **2026-07-24** and states:

> **Supersedes:** [2026-07-11 consolidated migration plan](./migration-plan-v2-consolidated.md) (single `ci-cd-*.yml` per stack)

It documents the two-file-per-stack model:

```
test-build-release.yml:  test → verify → semantic-release → upload deploy-meta
deploy.yml:              workflow_run → download artifact → deploy
```

Issue #1 (2026-07-12) predates this plan by 12 days and was never updated. The issue text is therefore an artefact of the superseded consolidated design.

### 2.4 semantic-release vs. this repo's big-release — a hard conflict

The static template's release job defaults to semantic-release:

```yaml
# test-build-release-static.yml (v4.1.1), workflow_call input
release_tool:
  description: 'Release tool to run: semantic-release | big-release'
  default: 'semantic-release'
```

and then installs/runs it:

```yaml
- name: Install semantic-release
  if: inputs.release_tool == 'semantic-release' || inputs.release_tool == ''
  run: npm install --no-save semantic-release @semantic-release/changelog @semantic-release/git

- name: Run semantic-release
  if: inputs.release_tool == 'semantic-release' || inputs.release_tool == ''
  run: npx semantic-release
```

This repository deliberately replaced semantic-release with **big-release**:

- `.big-release.yml` defines `branches: [main]`, `tagFormat: 'v${version}'`, and plugins `changelog`, `git`, `github`.
- `.github/workflows/release.yml` downloads `big-release-linux-amd64` and runs `big-release`.
- `specs/REFACTOR_LATEST.md` records the replacement decision under a **HARD GATE invariant** and lists removal of `semantic-release` and all `@semantic-release/*` packages as completed scope.

Applying issue #1 step 3 ("Remove old workflows: `ci.yml`, `release.yml`") would delete the big-release job and either drop automated releases or force a regression to semantic-release and its dependency footprint. That is the primary reason issue #1 must not be applied blindly.

### 2.5 Additional conflicts found during this audit

These are not in issue #1 but would block a naive migration:

| ID  | Conflict                        | Detail                                                                                                                                                                                                                                                                                                                                                                   |
| --- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C-1 | **Deploy target differs**       | This repo deploys via Netlify (`netlify.toml`, `publish = "dist"`, `NODE_VERSION = "24"`). `deploy-static.yml` deploys to BigBase via `danielvm-git/.github/actions/bigbase-deploy`.                                                                                                                                                                                     |
| C-2 | **Node version**                | Template pins `actions/setup-node` to the SHA for `v6.4.0` and `node-version: 22`. This repo runs Node 24 (`.github/workflows/*.yml`, `netlify.toml`, `@types/node ^24`).                                                                                                                                                                                                |
| C-3 | **Trigger model mismatch**      | The 2026-07-24 plan describes `deploy.yml` as `workflow_run`-triggered; the shipped `deploy-static.yml` v4.0.0 exposes only `on: workflow_call` and gates on `github.event_name == 'workflow_call'`.                                                                                                                                                                     |
| C-4 | **Release invocation differs**  | `test-build-release-static.yml` runs `big-release release --verbose`; this repo's `release.yml` and `specs/REFACTOR_LATEST.md` run `big-release` with no subcommand. Subcommand compatibility is unverified.                                                                                                                                                             |
| C-5 | **Secret contract differs**     | Template deploy requires `BIGBASE_SITE_ID` and `BIGBASE_DEPLOY_TOKEN`; this repo currently uses `secrets.GITHUB_TOKEN` plus Netlify's own build integration.                                                                                                                                                                                                             |
| C-6 | **Org version matrix is stale** | `danielvm-git/.github/docs/reference/github-actions-versions.md` ("verified 2026-07-25") lists `actions/setup-node` latest as `v6.4.0` and `actions/checkout` as `v7.0.0`. Actual latest releases are `setup-node v7.1.0` (2026-10-08) and `checkout v7.0.1` (2026-07-20), both confirmed via the GitHub releases API. The matrix should be refreshed by the maintainer. |

Positive note: `test-build-release-static.yml` v4.1.1 already accepts `release_tool: big-release`, so a big-release-compatible path exists in the template **if** it is invoked with that input rather than copied verbatim. The default remains semantic-release.

---

## 3. Recommendation

**Keep the current two workflows and apply action version updates only.**

Concretely:

1. Keep `.github/workflows/ci.yml` and `.github/workflows/release.yml` as the source of truth for this repo.
2. Do not adopt `test-build-release.yml` + `deploy.yml` in this release.
3. Ask the maintainer of `danielvm-git/.github` to either:
   - **close issue #1 as obsolete** (its `ci-cd-*.yml` templates were superseded on 2026-07-24 and no longer exist), or
   - **publish a static template explicitly validated for this repo**, with `release_tool: big-release` as the default (or a dedicated `test-build-release-static-big-release` variant), Node 24, and the Netlify deploy target — not BigBase by default.
4. Do not close issue #1 as "fixed" while `ci-cd-static.yml` is missing and the semantic-release/big-release conflict is unresolved.

### Why not migrate now

- The issue is factually stale (404 template).
- The only live static path defaults to semantic-release, which this repo removed under a hard gate.
- The deploy target, Node version, trigger model, secret names, and release CLI invocation all differ, so a copy-paste migration would require an unplanned rewrite of both workflows.

---

## 4. Future migration checklist (not executed)

If the maintainer confirms a big-release-compatible static template, a future migration must resolve all of the following before deleting any existing workflow.

### Inputs and configuration

- [ ] Set `APP_TYPE: static`.
- [ ] Set `SITE_URL` to the production URL (not the `https://CHANGE-ME.bigbase.click` placeholder).
- [ ] Confirm `release_tool: big-release` explicitly (do not rely on the semantic-release default).
- [ ] Confirm the big-release CLI invocation (`big-release` vs `big-release release --verbose`) against the pinned binary version.
- [ ] Preserve `.big-release.yml` (`branches`, `tagFormat`, plugins `changelog`/`git`/`github`).

### Runtime and actions

- [ ] Raise the template's `node-version: 22` to `24` in every job.
- [ ] Update the template's pinned `actions/setup-node` SHA from `v6.4.0` to `v7.1.0` (major tag `v7`).
- [ ] Update the template's pinned `actions/checkout` SHA from `v7.0.0` to `v7.0.1` (major tag `v7`).
- [ ] Keep `cache: npm`.
- [ ] Keep `fetch-depth: 0` on the release job (big-release needs full history for tags/changelog).

### Release and deploy semantics

- [ ] Keep release `concurrency.cancel-in-progress: false`; releases must not cancel each other.
- [ ] Decide the deploy target: retain Netlify (`netlify.toml`) **or** switch to BigBase deliberately. Do not mix.
- [ ] If Netlify: confirm the template does not require `BIGBASE_SITE_ID` / `BIGBASE_DEPLOY_TOKEN`; add a Netlify deploy step or keep Netlify's git integration.
- [ ] If BigBase: provision site, set `BIGBASE_SITE_ID` and `BIGBASE_DEPLOY_TOKEN` repository secrets, and add `environment: production`.
- [ ] Resolve the trigger model: the shipped `deploy-static.yml` is `workflow_call`, while the plan describes `workflow_run`. Pick one and verify the artifact handoff (`deploy-meta.json`).
- [ ] Confirm no semantic-release packages or `.releaserc` return to `package.json`.

### Workflow naming and cleanup

- [ ] If copying (not `workflow_call`), name the CI workflow exactly `Test Build Release` and the deploy workflow `Deploy`, per the plan's naming rule.
- [ ] Remove `ci.yml` / `release.yml` **only after** the replacement has produced a successful tag and GitHub Release on a scratch branch.
- [ ] Keep the `[skip ci]` guard used by Netlify's production context (`netlify.toml`).

### Gates before merge

- [ ] `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/<file>'))"` for each new file.
- [ ] `npm run lint`.
- [ ] `npm run typecheck`.
- [ ] `npm run test`.
- [ ] `npm run build`.
- [ ] Dry-run the release path on a non-`main` branch with `big-release --dry-run` (or equivalent) before enabling on `main`.

---

## 5. Actions taken in this workstream

- Updated `actions/checkout@v4` → `@v7` and `actions/setup-node@v4` → `@v7` in `.github/workflows/ci.yml` and `.github/workflows/release.yml`.
- Kept all job names, triggers, permissions, concurrency, `fetch-depth: 0`, and big-release steps unchanged.
- No workflow migration performed. No commit, push, PR, or issue mutation.
