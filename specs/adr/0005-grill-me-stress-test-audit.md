# 5. Stress-Testing and Architectural Assumptions (Grill-Me Audit)

Date: 2026-11-06

## Status

Accepted

## Context

A rigorous stress-test ("grill-me") was conducted across the system architecture, specifically targeting the failure modes of the hot path and state machines documented in `specs/HOT-PATH-AND-STATE-MACHINE-AUDIT.md`.

## Key Challenges & Stress-Test Outcomes

1. **Challenge: GitHub API rate limiting under unauthenticated client queries.**
   - _Resolution_: Enforce in-memory singleton cache at composable scope. Do not re-fetch if `ready` status exists unless explicitly requested or triggered via debounced visibility events.
2. **Challenge: Network hang on slow cellular or VPN connections.**
   - _Resolution_: Add explicit 10-second `AbortController` timeout to both initial load and background refresh.
3. **Challenge: State poisoning on failed background revalidation.**
   - _Resolution_: Background refresh failure in `releaseMachine` maintains `ready` status with existing good payload while transitioning background flag to idle.
4. **Challenge: Clipboard API permission rejections.**
   - _Resolution_: Implement explicit `copy-error` state in `InstallSection.vue` to give actionable user feedback rather than silently failing.
5. **Challenge: Optimistic counters reverting on server revalidation.**
   - _Resolution_: Monotonic clamp algorithm in `releaseMachine.reconcile()` prevents download counter regressions.
