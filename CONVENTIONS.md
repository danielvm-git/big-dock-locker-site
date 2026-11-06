# Conventions

This document specifies conventions for all AI agents working on this project.

## Session Start

Read [CLAUDE.md](CLAUDE.md), [CONVENTIONS.md](CONVENTIONS.md), [specs/state.yaml](specs/state.yaml), and [specs/release-plan.yaml](specs/release-plan.yaml) at session start.

## Commands

| Action    | Command             |
| --------- | ------------------- |
| Run       | `npm run dev`       |
| Test      | `npm run test`      |
| Build     | `npm run build`     |
| Lint      | `npm run lint`      |
| Preflight | `npm run preflight` |
| CI        | `gh pr checks`      |

## Stack Conventions (profiles/typescript-vue.md)

- Use Vue 3 Composition API with `<script setup>`.
- Order SFC blocks: `<script setup>` then `<template>` then `<style scoped>`.
- Use named exports for composables.
- Use Vitest and Vue Test Utils for unit testing.
- Use Playwright for end-to-end smoke testing.
- Format code using Prettier.

## Workflow & Integration Mode

- Integration mode is `solo-git`.
- Land approved branches via `bash scripts/land-branch.sh <branch> "<message>"`.
- Refer to [specs/WORKFLOW-solo-git.md](specs/WORKFLOW-solo-git.md) for execution details.

## Defensive Code

- **Graceful degradation**: Provide functional fallbacks when GitHub API or external services are unreachable.
- **Timeout**: Enforce 10-second request timeouts and clean up AbortController instances.
- **Retry**: Provide explicit retry actions for failed network operations.
- **State isolation**: Implement state reducers as pure functions using explicit state unions.

## Never

- Never dismiss reproducible gate failures as pre-existing or out of scope.
- Never proceed on red Preflight or red CI.
- Never commit directly to `main` outside release scripts.
- Never include `Co-authored-by` footer in git commits.
- Never use Options API for new components.
- Never commit `dist/`, `node_modules/`, or `.env*` files.

## Always Green / Shift Left

- Keep Preflight green at every step.
- Address reproducible defects immediately using quick-fix or fix-bug.
- Run tests after every code modification.

## Discovered Defects

- Fix defects immediately if trivial.
- Log complex defects into `specs/bugs/registry.yaml` before continuing.

## Banned Phrases

| Banned Phrase        | Required Action                                   |
| -------------------- | ------------------------------------------------- |
| "Pre-existing issue" | Fix the issue or log it into the defect registry. |
| "Unrelated failure"  | Fix the issue or log it into the defect registry. |
| "Out of scope"       | Resolve the gate failure before proceeding.       |
