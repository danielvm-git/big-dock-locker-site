# Security Plan & Threat Model — Big DockLocker Marketing Website

**Version:** 1.0.0 | **Date:** 2026-11-06

## 1. STRIDE Threat Model

| Threat                     | Target                        | Risk   | Mitigation                                                                                                                                                            |
| -------------------------- | ----------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spoofing**               | GitHub Releases download URLs | High   | Strict regex whitelist on asset names (`arm64.dmg`, `x64.dmg`); only resolve URLs starting with `https://github.com/danielvm-git/big-dock-locker/releases/download/`. |
| **Tampering**              | Static assets and JS bundle   | Medium | Netlify HTTPS enforcement with TLS 1.3; strict CSP headers; Subresource Integrity (SRI) on external scripts.                                                          |
| **Repudiation**            | Release publication           | Low    | All releases automated via GitHub Actions using verified `GITHUB_TOKEN` and signed git commits.                                                                       |
| **Information Disclosure** | Environment secrets           | High   | Zero server tokens in client build; unauthenticated GitHub API only; `.gitignore` covers `.env*`, `*.pem`, `*.key`, `.secrets`.                                       |
| **Denial of Service**      | GitHub API Rate Limiting      | Medium | Client-side memory caching at composable singleton scope; debounced visibility listener; fallback links if rate limit exceeded.                                       |
| **Elevation of Privilege** | Terminal install command      | High   | Command is static and hardcoded (`xattr -dr com.apple.quarantine /Applications/BigDockLocker.app`); no dynamic parameter interpolation.                               |

## 2. Supply Chain Security

- Dependabot alerts enabled on GitHub.
- Pre-commit hooks (`audit-code`) block committing OpenAI, GitHub, or AWS secret keys.
- CI pinned to official actions (`actions/checkout@v7`, `actions/setup-node@v7`).
