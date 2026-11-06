# Big-Dock-Locker Website — AI Agents

Read CONVENTIONS.md before any GitHub or git operation.

## Session Start

Read CLAUDE.md, CONVENTIONS.md, specs/state.yaml, and specs/release-plan.yaml at the start of each session.

## Project

This is the official public website of the big-dock-locker app.
Stack: TypeScript / Vue.js / Vite / Node.js 24 LTS
Profile: profiles/typescript-vue.md

## Commands

| Action    | Command             |
| --------- | ------------------- |
| Run       | `npm run dev`       |
| Test      | `npm run test`      |
| Build     | `npm run build`     |
| Lint      | `npm run lint`      |
| Preflight | `npm run preflight` |
| CI        | `gh pr checks`      |

`preflight` also runs `npm run check:bundle`, which fails when the critical-path
JavaScript exceeds 60 KB gzip. Do not raise that budget to get green — move code
behind a `import()` and record the reason in `specs/bugs/BUG-007-*.md`.

## Architecture

The site is a single-page application with sections for Home, Features, Pricing, Docs, Blog, and Contact.

## Conventions

- Follow bigpowers principles.
- Use Vue 3 Composition API with `<script setup>`.
- Use TypeScript for all components and composables.

## Never

- Never dismiss reproducible gate failures as pre-existing or out of scope.
- Never proceed on red Preflight or red CI.
- Never commit directly to `main` outside release scripts.
- Never include `Co-authored-by` footer in git commits.
- Never commit `dist/`, `node_modules/`, or `.env*` files.

## Agent Rules

- **Workflow Mandate:** You MUST use bigpowers skills (`plan-work`, `develop-tdd`, `orchestrate-project`) to perform tasks. DO NOT write code directly in response to a user prompt like "build this feature".
- **Always Green:** Preflight and CI must be green before forward work.
- Read specs/ before writing code.
- All planning and specifications MUST be written to `specs/` before any code is generated.
- Write the minimum code that solves the stated problem. Nothing extra.
- Never refactor, rename, or reorganize code outside the task scope.
- Run tests after every change. Show evidence before declaring done.
- One clarifying question beats a wrong assumption baked into 200 lines.
