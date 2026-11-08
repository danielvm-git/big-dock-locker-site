---
bug_id: BUG-012
status: open
severity: critical
scope: infra
title: Netlify never deploys — GitHub App installation revoked, no webhook, no build hook
issue: 14
found: '2026-11-06'
rca_verified: '2026-11-08'
---

# BUG-012 — Netlify never deploys

## Summary

`main` has moved 77 commits past the last production deploy. The public site
`https://bigdocklocker.netlify.app/` still serves the build from `77d72ae`
(2026-05-21) — including the 4.1 MB `icon.png` and the pre-optimisation
`index-COMqoqnk.js` — while a local build of `main` emits `index-86qctmDw.js`.

Every CI gate is green. Nothing in the pipeline observes the deploy, so the site
can stay stale indefinitely without a single red check. This also blocks
BUG-008 (the post-deploy smoke gate) from landing: a deploy gate cannot pass
while no deploy exists.

## Problem

- **Actual:** pushes to `main` never create a Netlify build. Newest deploy is
  `6a0f5187…` at `2026-05-21T18:40:07Z` on commit `77d72ae`.
- **Expected:** each push to `main` produces a production deploy of that commit.
- **Reproduce:** push any commit to `main`, then
  `netlify api listSiteDeploys` — the deploy count (5) does not change.

## Root Cause Analysis

Verified 2026-11-08 with read-only Netlify and GitHub API calls.

| Probe                                | Result                    | Meaning                                   |
| ------------------------------------ | ------------------------- | ----------------------------------------- |
| `getSite.build_settings.repo_url`    | the repo                  | Netlify still _knows_ the repo            |
| `getSite.build_settings.stop_builds` | `false`                   | auto-builds are not paused                |
| `getSite.installation_id`            | **`null`**                | **no authorised GitHub App installation** |
| `getSite.deploy_key_id`              | **`null`**                | no deploy key fallback                    |
| `listHooksBySiteId`                  | email/form hooks only     | **no build hook**                         |
| repo `GET /hooks`                    | Snyk only                 | **no Netlify webhook**                    |
| `listSiteDeploys`                    | 5 deploys, all 2026-05-21 | nothing since                             |
| `git log 77d72ae..main`              | 77 commits                | 77 missed deploys                         |

The site configuration survived, but the **Netlify GitHub App installation for
this site was deauthorised** (`installation_id: null`). Netlify therefore
neither receives push webhooks nor holds clone credentials, so it never starts a
build. The retained `build_settings.repo_url` is a stale string, not a live
integration — which is why the site _looks_ connected.

Contributing factor: there is no deploy job in `.github/workflows/` and no
post-deploy check, so the divergence has no detector. That gap is BUG-008.

Risk level: **High** — the public site has served a 2026-05-21 build for six
months, including a 4.1 MB favicon that BUG-007 already fixed in source.

Security impact: **NONE**. No exploit path identified; the failure is availability
and correctness of published content, not confidentiality or integrity of code.

## Fix options — all require owner action

Every option mutates production infrastructure or creates a repository secret.
Per `DEC-BUG012-NO-UNILATERAL-INFRA` and the standing approval for this run
(commit / push / PR / merge / worktree cleanup), the agent does **not** perform
any of them.

1. **Re-link the GitHub integration (preferred).** Netlify UI → site
   `bigdocklocker` → _Build & deploy_ → _Link repository_ → authorise the Netlify
   GitHub App for `danielvm-git/big-dock-locker-site`. Restores webhooks _and_
   clone credentials; no secret handling. Needs an interactive OAuth flow on the
   owner's Netlify account.
2. **Build hook.** `netlify api createHookBySiteId`, then store the hook URL as a
   repository secret and `curl` it from a `push: main` workflow. Creates
   production infrastructure plus a secret.
3. **CI deploy.** Add `NETLIFY_AUTH_TOKEN` as a repository secret and run
   `netlify deploy --prod --dir dist` from a workflow. Requires exporting the
   owner's Netlify token.

A build hook alone is insufficient if `installation_id` stays `null` and the
build must clone from GitHub — option 1 is the only one that repairs the clone
path itself.

## Acceptance criteria

- [ ] A push to `main` produces a production deploy of that commit
- [ ] `published_deploy.commit_ref` equals `origin/main` within a bounded wait
- [ ] The live site serves the same `assets/index-*.js` hash as a local build
- [ ] `icon.png` served live is the downscaled asset from BUG-007
- [ ] BUG-008's `deploy-smoke` workflow passes against the live URL

## Verify

```bash
netlify api listSiteDeploys --data '{"site_id":"f6e1acd7-dd3a-4fb8-942b-7d3c29cc904b"}' \
  | python3 -c 'import json,sys;print(json.load(sys.stdin)[0]["commit_ref"])'
git rev-parse origin/main
curl -s https://bigdocklocker.netlify.app/ | grep -oE 'assets/index-[A-Za-z0-9_-]+\.js'
grep -oE 'assets/index-[A-Za-z0-9_-]+\.js' dist/index.html
```

## Out of scope

- Migrating off Netlify.
- Changing DNS or custom domains.
- Implementing the smoke checker itself (that is BUG-008).
