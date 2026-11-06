# 2. Pure State Machine for GitHub Releases API Integration

Date: 2026-11-06

## Status

Accepted

## Context

Fetching live release metadata from the unauthenticated GitHub API introduces race conditions, network failures, rate-limiting, and state poisoning (e.g. background visibility refreshes failing and wiping out usable release data).

## Decision

Implement a pure finite state machine reducer (`releaseMachine.ts`) decoupled from side effects.

- States: `idle`, `loading`, `ready`, `failed`, `refreshing`.
- Timeouts: 10s default via AbortController.
- Visibility change: Coalesces background refreshes; failure preserves existing good data.
- Monotonic count clamping: Reconciles optimistic increments with server count responses.

## Consequences

- 100% testable state transitions without mock network servers.
- Total immunity against state poisoning and unbounded loading hangs.
