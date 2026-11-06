# 6. Defer the split-pair static workflow templates

Date: 2026-11-06

## Status

Accepted (defer — no trigger has fired)

## Context

`danielvm-git/.github` now offers a split-pair static pipeline:

| File                            | Purpose                                        |
| ------------------------------- | ---------------------------------------------- |
| `test-build-release-static.yml` | `test → verify → release → upload deploy-meta` |
| `deploy-static.yml`             | `workflow_run → download artifact → deploy`    |

`test-build-release-static.yml` accepts a `release_tool` input defaulting to
`semantic-release` and also supports `big-release`, so unlike the obsolete
`ci-cd-*` instructions from issue #1 it would not regress this repository's
release tool.

This repository currently has two purpose-built, green workflows
(`.github/workflows/ci.yml`, `.github/workflows/release.yml`), a
`big-release` config with `GIT_BIGPOWERS_LAND=1` (BUG-001) and
`postTagAssets: [VERSION, CHANGELOG.md]` (BUG-005), and a Netlify
git-integration deploy declared in `netlify.toml` — there is no deploy workflow
to replace, so `deploy-static.yml` would be unused.

## Decision

**Defer.** Keep `ci.yml` + `release.yml` + `netlify.toml`. Re-open the evaluation
only if one of these triggers fires:

1. Deployment moves from Netlify to BigBase.
2. A second static site needs the same pipeline (template reuse starts paying
   for itself).
3. `ci.yml` / `release.yml` need changes the template already solves.

If a trigger fires, the migration must preserve, and prove it preserves:

- the `e2e` job — the template has no Playwright stage, so dropping it would
  re-open BUG-003;
- the `GIT_BIGPOWERS_LAND=1` exemption the release commit needs to pass the
  `pre-push` guard (BUG-001);
- `postTagAssets: [VERSION, CHANGELOG.md]`, so `CHANGELOG.md` keeps shipping
  with the release (BUG-005);
- the post-deploy live-site smoke gate (BUG-008 / issue #14), which the
  templates do not provide.

## Consequences

- No migration risk and no new external dependency for a pipeline that is green
  and purpose-fit.
- The deploy half of the split pair is not adopted, because Netlify already
  owns deployment. Post-deploy verification is provided instead by the
  live-site smoke check specified in `BUG-008` / issue #14, which tests the
  deployed artifact and therefore covers the gap the templates would not. That
  gate is **not landed yet**: issue #14 is blocked on BUG-012, because Netlify's
  git integration for this repository has no webhook and has not deployed since
  2026-05-21. The decision recorded here is unaffected — no trigger fired — but
  the migration must not be reconsidered as a workaround for a broken deploy:
  the templates deploy to BigBase, and this site stays on Netlify.
- Issue #16 is closed with this decision so the option is documented rather than
  re-litigated.
