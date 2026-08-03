# Refactor Plan: Replace semantic-release with big-release

> **HARD GATE Invariant**: The repository must automatically generate SemVer tags and GitHub Releases on push to `main` based on Conventional Commits, without breaking `npm run build` or package installation.

## Problem Statement

The repository currently uses `semantic-release` and 5 associated npm package dependencies (`@semantic-release/changelog`, `@semantic-release/commit-analyzer`, `@semantic-release/git`, `@semantic-release/github`, `@semantic-release/release-notes-generator`) configured via `.releaserc.json` in `.github/workflows/release.yml`. 
`semantic-release` introduces a heavy Node dependency footprint for release orchestration. We need to transition to `big-release` (a fast, lightweight Go binary CLI from `https://github.com/danielvm-git/big-release`).

## Solution

1. Create a native `.big-release.yml` configuration file specifying release branches, tag format, plugins (`changelog`, `git`, `github`), and commit type sections.
2. Update `.github/workflows/release.yml` to install the `big-release` Linux binary and invoke `big-release` instead of `npx semantic-release`.
3. Remove `semantic-release` and all `@semantic-release/*` packages from `package.json` devDependencies, update `package-lock.json`, and delete `.releaserc.json`.
4. Update documentation in `README.md` and `specs/RELEASE-PLAN.md` to reference `big-release`.

## Commits

1. Add `.big-release.yml` configuration file → verify: `test -f .big-release.yml && echo OK`
2. Update `.github/workflows/release.yml` to download and execute `big-release` → verify: `grep -q "big-release" .github/workflows/release.yml && echo OK`
3. Remove `semantic-release` packages from `package.json` and delete `.releaserc.json` → verify: `npm run build && ! test -f .releaserc.json && echo OK`
4. Update `README.md` and `specs/RELEASE-PLAN.md` references to `big-release` → verify: `grep -q "big-release" README.md && echo OK`

## Decision Document

- **Configuration Format**: `.big-release.yml` in root directory.
- **Plugins**: `changelog`, `git`, `github` plugins enabled.
- **Publishers**: Disabled / omitted since `package.json` is `"private": true` (web application marketing site).
- **Workflow Pipeline**: Download `big-release-linux-amd64` in GitHub Actions job, mark executable, move to PATH, and run `big-release`.
- **Dependency Cleanup**: Full removal of Node-based `semantic-release` tooling.

## Testing Decisions

- Verification of YAML schema and structure of `.big-release.yml`.
- Verification of GitHub Actions workflow file structure.
- Clean execution of `npm run build` to ensure no build or runtime scripts depend on removed node_modules.

## Out of Scope

- Changes to Vue/Vite application code or styles.
- Deployment configuration for Netlify.
- Modifying `big-release` source code or building custom plugins for `big-release`.

## Further Notes

- Branch protection note: `git` plugin in `big-release` commits `CHANGELOG.md` back to `main`. If `main` has strict branch protection enabled without bypass permissions for `GITHUB_TOKEN`, ensure `GITHUB_TOKEN` has contents write access or consider dropping `changelog`/`git` plugins in favor of pure GitHub Release notes.
