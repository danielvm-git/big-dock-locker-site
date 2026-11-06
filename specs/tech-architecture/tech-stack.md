# Technical Architecture & Stack Specification

## 1. Technology Stack

- **Runtime & Language**: Node.js 24 LTS, TypeScript 6.0 (strict mode enabled).
- **Frontend Framework**: Vue 3.5 (Composition API with `<script setup>`).
- **Build Tooling**: Vite 8.0 with `@vitejs/plugin-vue`.
- **Testing Frameworks**: Vitest 4.1 for unit/integration tests; Playwright 1.60 for end-to-end browser tests; `@vue/test-utils` for Vue component mounting; `jsdom` for DOM simulation.
- **Code Quality**: Prettier 3.8, Husky 9.1, lint-staged 17.0, `vue-tsc` 3.2.
- **Hosting & CI/CD**: Netlify static hosting, GitHub Actions, `big-release` semantic release automation.

## 2. Module Boundaries & Architecture

```
src/
├── components/          # Vue Presentation & Interactive Components
│   ├── TheNavbar.vue    # Sticky header with branding, anchor navigation, and download CTA
│   ├── HeroSection.vue  # Main hero with live release badge, headline, and primary CTA
│   ├── FeaturesSection.vue # Key capabilities showcase
│   ├── HowItWorksSection.vue # Dock locking mechanics explanation
│   ├── InstallSection.vue # Terminal install command with clipboard state machine
│   ├── DownloadSection.vue # Architecture-specific download buttons (ARM64 vs x64)
│   └── TheFooter.vue    # Footer with GitHub repository link and legal notice
├── composables/         # Reusable State & Side-Effect Logic
│   └── useLatestRelease.ts # Service wrapping releaseMachine with network I/O & events
├── machines/            # Pure Finite State Machines
│   └── releaseMachine.ts # Pure reducer managing release fetch lifecycle
└── style.css            # Global CSS variables, reset, and layout utility classes
```

## 3. Domain Language Mapping

- `ReleaseState`: Discriminated union of `{ status: 'idle' | 'loading' | 'ready' | 'failed' | 'refreshing' }`.
- `ReleaseEvent`: Actions dispatched to reducer (`FETCH_START`, `FETCH_SUCCESS`, `FETCH_ERROR`, `TIMEOUT`, `VISIBLE`, `RETRY`, `INCREMENT_DOWNLOAD`).
- `ClipboardState`: State union (`idle`, `copying`, `copied`, `copy-error`).
- `DownloadCounts`: Optimistic local download counter tracking reconciled with upstream API counts.

## 4. Error Handling Strategy

- **Graceful Network Degradation**: If GitHub API fails or rate-limits, the UI displays cached release data if previously loaded or displays direct fallback links to the GitHub repository releases page.
- **Bounded Loading (Timeouts)**: All network calls are wrapped with an `AbortController` and a 10-second timeout to prevent indefinite loading states.
- **Safe Revalidation**: Background refresh errors (`refreshing` state) never overwrite or poison previously validated `ready` data.
- **Clipboard Error Capture**: Unhandled clipboard promise rejections are caught and surfaced via a persistent error feedback state until user interaction resets it.

## 5. API Shape Decisions

- **GitHub Releases Endpoint**: `GET https://api.github.com/repos/danielvm-git/big-dock-locker/releases/latest`
- **Asset Filter**: Regex pattern match for `.dmg` files:
  - Apple Silicon: `/arm64.*\.dmg$/i`
  - Intel: `/(x64|intel).*\.dmg$/i`
- **Reconciliation Model**: Monotonic clamp ensures download numbers never visually decrease when fresh payloads arrive from distributed API caches.
