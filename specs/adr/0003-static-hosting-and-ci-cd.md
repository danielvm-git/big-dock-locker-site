# 3. Static Hosting on Netlify and Automated Releases via Big-Release

Date: 2026-11-06

## Status

Accepted

## Context

The site has zero requirement for a dedicated server runtime or database. It needs reliable global CDN hosting and automated versioning on git commits.

## Decision

- Host static output (`dist/`) on Netlify with automated preview branches and CDN edge distribution.
- Use `big-release` in GitHub Actions (`.github/workflows/release.yml`) on merges to `main` with plugins:
  - `changelog`: Updates CHANGELOG.md
  - `git`: Commits changelog back to `main` with bot committer identity
  - `github`: Creates GitHub Release

## Consequences

- Zero backend server attack surface and zero maintenance infrastructure costs.
- Fully automated releases triggered strictly by Conventional Commits (`feat:`, `fix:`).
