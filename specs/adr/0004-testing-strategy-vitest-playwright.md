# 4. Two-Tier Testing Strategy: Vitest and Playwright

Date: 2026-11-06

## Status

Accepted

## Context

A marketing site requires verifying both low-level reactive logic (state machines, clipboard timers, composable singletons) and full-browser user experiences (page rendering, anchor scrolling, valid download URLs).

## Decision

Adopt a two-tier testing pyramid:

1. **Tier 1 (Unit & Component)**: Vitest + Vue Test Utils + jsdom for fast, isolated tests run on every commit pre-commit hook.
2. **Tier 2 (End-to-End Smoke)**: Playwright against Vite preview server for Chromium headless validation before release.

## Consequences

- Fast developer feedback (< 2s unit tests) coupled with end-to-end browser confidence.
- Both test suites are automated as hard gates in CI.
