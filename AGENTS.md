# Big-Dock-Locker Website — AI Agents

Read CONVENTIONS.md before any GitHub or git operation.

## Project

This is the official public website of the big-dock-locker app.
Stack: TypeScript / Vue.js / Vite / Node.js 24 LTS

## Commands

| Action | Command         |
| ------ | --------------- |
| Run    | `npm run dev`   |
| Test   | `npm run test`  |
| Build  | `npm run build` |
| Lint   | `npm run lint`  |

## Architecture

The site is a single-page application with sections for Home, Features, Pricing, Docs, Blog, and Contact, reflecting the structure of the reference site.

## Conventions

- Follow the bigpowers principles.

## Never

- Deviate from the bigpowers workflow.

## Agent Rules

- **Workflow Mandate:** You MUST use the bigpowers skills (e.g. `plan-work`, `develop-tdd`, `orchestrate-project`) to perform tasks. DO NOT write code directly in response to a user prompt like "build this feature".
- Read specs/ before writing code.
- All planning and specifications MUST be written to `specs/` (e.g. `specs/PLAN.md`) before any code is generated.
- Write the minimum code that solves the stated problem. Nothing extra.
- Never refactor, rename, or reorganize code outside the task scope.
- Run tests after every change. Show evidence before declaring done.
- One clarifying question beats a wrong assumption baked into 200 lines.
