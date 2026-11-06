# Test Plan: e03 Testing Pyramid and CI Preflight Gates

**Epic:** e03 | **Status:** Active | **Risk Tier:** High (P1)

## 1. Test Levels

- **Component Tests**:
  - `HeroSection.test.ts`: Live version badge formatting, fallback states, and CTA actions.
  - `DownloadSection.test.ts`: Apple Silicon (`arm64`) vs Intel (`x64`) URL resolution and download count rendering.
- **End-to-End Smoke Tests (`smoke.test.ts`)**:
  - Page title matches "Big DockLocker".
  - All 7 sections are visible in DOM (`#features`, `#how-it-works`, `#install`, `#download`, etc.).
  - Navbar CTA scrolls viewport to `#download`.
  - Download buttons have valid HTTPS hrefs with mocked GitHub API response.
- **Automated CI Preflight**:
  - Combined `npm run preflight` executing typecheck, unit tests, lint check, and production build.

## 2. Risk Matrix

| Component                     | Risk   | Level      | Test Strategy                     |
| ----------------------------- | ------ | ---------- | --------------------------------- |
| HeroSection / DownloadSection | Medium | Unit       | Vue Test Utils + fixture data     |
| Full SPA Experience           | High   | E2E        | Playwright against Vite preview   |
| CI Pipeline                   | High   | Automation | GitHub Actions workflow execution |
