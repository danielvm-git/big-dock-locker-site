# Threat Model: Epic e02 — Live GitHub Releases & Interactive Machines

**Epic:** e02 | **Date:** 2026-11-06 | **Evaluator:** security-review

## 1. Scope & Surface Area

- `src/machines/releaseMachine.ts`: Pure state machine managing release fetch transitions and download counts.
- `src/composables/useLatestRelease.ts`: Module-level service managing network I/O, timeouts, and visibility events.
- `src/components/InstallSection.vue`: Interactive terminal command copying via Clipboard API.
- External GitHub Releases API: `https://api.github.com/repos/danielvm-git/big-dock-locker/releases/latest`.

## 2. Threat Analysis (STRIDE)

| Threat                     | Risk Level | Target                                   | Mitigation                                                                                                                                                                           |
| :------------------------- | :--------: | :--------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spoofing**               |    High    | Download URLs & Release Assets           | Only parse URLs matching `https://github.com/danielvm-git/big-dock-locker/releases/download/*`. Regex whitelist on `.dmg` asset names for Apple Silicon (`arm64`) and Intel (`x64`). |
| **Tampering**              |   Medium   | In-memory release state                  | Reducer state is pure and immutable; background revalidation errors do not poison existing `ready` release payload.                                                                  |
| **Repudiation**            |    Low     | Download count increments                | Counts are optimistic local UI feedback, reconciled with monotonic clamp against server counts.                                                                                      |
| **Information Disclosure** |    High    | Client network tokens                    | Zero API keys or tokens are passed to or used by the client; unauthenticated public GitHub API only.                                                                                 |
| **Denial of Service**      |   Medium   | GitHub API Rate Limiting / Network Hangs | 10-second `AbortController` timeout; debounced visibility event revalidation; singleton composable cache.                                                                            |
| **Elevation of Privilege** |    High    | Terminal Install Command                 | Command string is strictly static: `xattr -dr com.apple.quarantine /Applications/BigDockLocker.app`. No template interpolation or user input concatenation.                          |

## 3. Security Verdict

**PASS** — Hardened against state poisoning, rate-limit hangs, and URL injection.
