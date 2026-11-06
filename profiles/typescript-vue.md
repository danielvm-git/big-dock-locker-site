# Stack Profile: TypeScript + Vue

Opt-in conventions fragment for `seed-conventions`.

## Commands

| Action    | Command                        |
| --------- | ------------------------------ |
| Test      | `npm run test` or `vitest run` |
| Lint      | `npm run lint`                 |
| Build     | `npm run build`                |
| Dev       | `npm run dev`                  |
| Preflight | `npm run preflight`            |

## Architecture

- Vue 3 Composition API + `<script setup>`
- Single-page marketing site with components and reactive composables
- Explicit finite state machines (`src/machines/`) for async state flows

## Conventions

- SFC order: `<script setup>` → `<template>` → `<style scoped>`
- Prettier for format; named exports in composables
- Vitest for unit tests; Vue Test Utils for components
- Playwright for end-to-end smoke tests

## Never

- Never use Options API for new components unless extending legacy
- Never commit `dist/`, `node_modules/`, `.env*`
- Never bypass `npm run preflight` before landing
